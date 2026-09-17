/*
  Vista Principal de la Sala de Subasta en Vivo (src/pages/LiveAuctionPage.tsx).
  Responsabilidad Única (SRP):
  - Ensambla el layout de dos columnas (Ficha + Reloj + Consola vs Historial en vivo).
  - Orquesta el estado global de la subasta, la recepción de SignalR y las notificaciones flotantes.
  - Guarda automáticamente el ID de la subasta en localStorage al realizar una puja exitosa.
*/

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Radio, Tag, User, Clock } from 'lucide-react';
import { httpClient, ApiError } from '../API/httpClient';
import { useAuth } from '../context/AuthContext';
import { useAuctionHub } from '../hooks/useAuctionHub';
import { DigitalCountdown } from '../components/auction/DigitalCountdown';
import { PujaHistoryList, type PujaItem } from '../components/auction/PujaHistoryList';
import { BidConsole } from '../components/auction/BidConsole';
import { ToastContainer, type ToastItem, type ToastTipo } from '../components/common/Toast';
import type { SubastaDetalle, NuevaPujaEvent } from '../types/auction';

export const LiveAuctionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { usuarioActual, saldos, actualizarSaldos } = useAuth();

  const [subasta, setSubasta] = useState<SubastaDetalle | null>(null);
  const [pujas, setPujas] = useState<PujaItem[]>([]);
  const pujasRef = useRef<PujaItem[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [enviandoPuja, setEnviandoPuja] = useState<boolean>(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Helper para agregar notificaciones flotantes auto-desvanecibles (3.5 segundos)
  const agregarToast = useCallback((mensaje: string, tipo: ToastTipo) => {
    const nuevoId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setToasts((prev) => [...prev, { id: nuevoId, mensaje, tipo }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== nuevoId));
    }, 3500);
  }, []);

  const cerrarToast = useCallback((idToast: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== idToast));
  }, []);

  // Carga inicial de datos desde la API REST (GET /api/subastas/{id})
  const cargarDetalleSubasta = useCallback(async () => {
    if (!id) return;
    try {
      setCargando(true);
      const data = await httpClient.get<SubastaDetalle>(`/subastas/${id}`);
      setSubasta(data);
      const listaPujas = data.ultimasPujas || [];
      setPujas(listaPujas);
      pujasRef.current = listaPujas;
      setErrorCarga(null);
    } catch (err: any) {
      setErrorCarga(err.message || 'No se pudo cargar la subasta solicitada.');
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    cargarDetalleSubasta();
  }, [cargarDetalleSubasta]);

  // Manejo de eventos en tiempo real recibidos por SignalR
  const manejarNuevaPujaSignalR = useCallback(
    (evento: NuevaPujaEvent) => {
      setSubasta((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          precioActual: evento.monto,
          cantidadPujas: prev.cantidadPujas + 1,
          fechaFin: evento.nuevaFechaFin || prev.fechaFin,
        };
      });

      const liderAnterior = pujasRef.current.length > 0 ? pujasRef.current[0] : null;

      const nuevaPujaItem: PujaItem = {
        id: Date.now(),
        compradorId: evento.compradorId,
        compradorNombre: evento.postor,
        monto: evento.monto,
        fechaPuja: evento.fechaPuja || new Date().toISOString(),
      };

      pujasRef.current = [nuevaPujaItem, ...pujasRef.current];
      setPujas(pujasRef.current);

      if (evento.seAplicoAntiSniping) {
        agregarToast('¡Regla Anti-Sniping activada! El tiempo se extendió por una oferta en el último minuto.', 'info');
      }

      if (
        usuarioActual &&
        evento.compradorId !== usuarioActual.id &&
        liderAnterior &&
        liderAnterior.compradorId === usuarioActual.id
      ) {
        agregarToast(
          `¡Fuiste superado! Alguien ofertó $ ${evento.monto.toLocaleString('es-AR')}. Tus fondos en custodia fueron liberados.`,
          'advertencia'
        );
        actualizarSaldos();
      }
    },
    [usuarioActual, agregarToast, actualizarSaldos]
  );

  const { conectado } = useAuctionHub({
    subastaId: subasta?.id ?? null,
    onNuevaPuja: manejarNuevaPujaSignalR,
  });

  // Envío de oferta mediante POST /api/pujas
  const manejarOfertar = async (monto: number) => {
    if (!subasta) return;

    try {
      setEnviandoPuja(true);
      await httpClient.post('/pujas', {
        subastaId: subasta.id,
        monto,
      });

      // PERSISTENCIA LOCAL: Registrar el ID de subasta para agilizar "Mis Ofertas"
      const idsOfertados: number[] = JSON.parse(localStorage.getItem('mis_subastas_ofertadas') || '[]');
      if (!idsOfertados.includes(subasta.id)) {
        idsOfertados.push(subasta.id);
        localStorage.setItem('mis_subastas_ofertadas', JSON.stringify(idsOfertados));
      }

      agregarToast(`¡Oferta de $ ${monto.toLocaleString('es-AR')} registrada con éxito! Saldo retenido en custodia.`, 'exito');
      await actualizarSaldos();
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          agregarToast('Conflicto de oferta: Otro usuario ofertó en el mismo milisegundo. Se actualizó el valor sugerido para reintentar.', 'advertencia');
        } else {
          agregarToast(err.message || 'Error al procesar la oferta.', 'error');
        }
      } else {
        agregarToast('No se pudo establecer comunicación con el servidor.', 'error');
      }
    } finally {
      setEnviandoPuja(false);
    }
  };

  const manejarIntentoBloqueado = (motivo: 'lider' | 'vendedor') => {
    if (motivo === 'lider') {
      agregarToast('¡Ya eres líder! Espera a que otro postor supere tu oferta para volver a pujar.', 'bloqueo');
    } else {
      agregarToast('¡No podés autopujarte! Eres el vendedor y dueño de esta publicación.', 'bloqueo');
    }
  };

  const manejarTiempoAgotado = () => {
    setSubasta((prev) => (prev ? { ...prev, estado: 'FINALIZADA' } : prev));
    agregarToast('El tiempo de la subasta ha concluido.', 'info');
    setTimeout(() => {
      cargarDetalleSubasta();
    }, 4000);
  };

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-400">Ingresando a la Sala de Subasta en Vivo...</p>
      </div>
    );
  }

  if (errorCarga || !subasta) {
    return (
      <div className="max-w-lg mx-auto p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4 my-12">
        <h2 className="text-xl font-bold text-white">Error al cargar la sala</h2>
        <p className="text-sm text-slate-400">{errorCarga || 'La subasta no existe o fue dada de baja.'}</p>
        <button
          onClick={() => navigate('/catalogo')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
        >
          ← Volver al Catálogo
        </button>
      </div>
    );
  }

  const ultimaPujaLider = pujas.length > 0 ? pujas[0] : null;
  const esLider = Boolean(usuarioActual && ultimaPujaLider && ultimaPujaLider.compradorId === usuarioActual.id);
  const esVendedor = Boolean(usuarioActual && subasta.vendedorId === usuarioActual.id);
  const estaFinalizada = subasta.estado === 'FINALIZADA' || subasta.estado === 'DESIERTA' || subasta.estado === 'CANCELADA';
  const saldoDisponibleActual = saldos?.saldoDisponible ?? 0;

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onCerrar={cerrarToast} />

      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <button
          onClick={() => navigate('/catalogo')}
          className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Catálogo
        </button>

        <div className="flex items-center gap-3">
          <span
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
              conectado
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${conectado ? 'animate-pulse' : ''}`} />
            {conectado ? 'En Vivo (WebSockets Activo)' : 'Reconectando sala...'}
          </span>

          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-slate-800 text-slate-200 border border-slate-700">
            {subasta.estado}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="aspect-video w-full bg-slate-950 relative overflow-hidden flex items-center justify-center">
              <img
                src={subasta.urlImagen || '/imagenes/auto1.png'}
                alt={subasta.titulo}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/imagenes/auto1.png';
                }}
              />
              <div className="absolute top-3 left-3 flex gap-2">
                <span className="px-3 py-1 bg-slate-950/80 backdrop-blur-md border border-slate-700 rounded-full text-xs font-bold text-slate-200 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-blue-400" />
                  {subasta.categoriaNombre || 'General'}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                  {subasta.titulo}
                </h1>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    Vendedor: <strong className="text-slate-300 font-semibold">{subasta.vendedorNombre || `Usuario #${subasta.vendedorId}`}</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Lote #{subasta.id}
                  </span>
                </div>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed pt-2 border-t border-slate-800/80">
                {subasta.descripcion}
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <DigitalCountdown
              fechaFin={subasta.fechaFin}
              fechaInicio={subasta.fechaInicio}
              estado={subasta.estado}
              onFinalizada={manejarTiempoAgotado}
            />
          </div>

          <BidConsole
            precioActual={subasta.precioActual}
            incrementoMinimo={subasta.incrementoMinimo}
            precioBase={subasta.precioBase}
            cantidadPujas={subasta.cantidadPujas}
            saldoDisponible={saldoDisponibleActual}
            esLider={esLider}
            fueSuperado={!esLider && pujas.some((p) => usuarioActual && p.compradorId === usuarioActual.id)}
            esVendedor={esVendedor}
            finalizada={estaFinalizada}
            enviando={enviandoPuja}
            onPujar={manejarOfertar}
            onIntentoBloqueado={manejarIntentoBloqueado}
          />
        </div>

        <div className="lg:col-span-5 sticky top-8">
          <PujaHistoryList pujas={pujas} cargando={false} />
        </div>
      </div>
    </div>
  );
};