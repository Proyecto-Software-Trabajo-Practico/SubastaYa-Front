

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Package, 
  History, 
  DollarSign, 
  Gavel, 
  Trophy, 
  AlertTriangle, 
  ExternalLink, 
  Clock, 
  TrendingUp, 
  RefreshCw, 
  PlusCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { subastaApi, type SubastaCardDto } from '../API/subastaApi';

interface OfertaCompradorItem {
  subasta: SubastaCardDto;
  montoMayorPuja: number;
  estadoPuja: 'GANANDO' | 'SUPERADO' | 'GANADA' | 'NO_ADJUDICADA';
}

const CACHE_PUBS_KEY = 'activities_mis_publicaciones_cache';
const CACHE_OFERTAS_KEY = 'activities_mis_ofertas_cache';

const parsearFechaUtc = (fechaIso: string): number => {
  if (!fechaIso) return 0;
  const utcStr = fechaIso.endsWith('Z') || fechaIso.includes('+') ? fechaIso : `${fechaIso}Z`;
  return new Date(utcStr).getTime();
};

const estaVigente = (sub: SubastaCardDto): boolean => {
  if (sub.estado === 'FINALIZADA' || sub.estado === 'CANCELADA') return false;
  const finMs = parsearFechaUtc(sub.fechaFin);
  return finMs > Date.now();
};

const calcularTiempoRestante = (fechaFinIso: string): string => {
  const fin = parsearFechaUtc(fechaFinIso);
  if (!fin) return 'Finalizada';

  const diferencia = fin - Date.now();
  if (diferencia <= 0) return 'Cerrada';

  const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
  const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);

  if (dias > 0) return `${dias}d ${horas}h restantes`;
  if (horas > 0) return `${horas}h ${minutos}m restantes`;
  if (minutos > 0) return `${minutos}m ${segundos}s restantes`;
  return `${segundos}s restantes`;
};

export const ActivitiesPage: React.FC = () => {
  const { usuarioActual } = useAuth();
  const navigate = useNavigate();

  const cargandoRef = useRef(false);

  const [tabActiva, setTabActiva] = useState<'publicaciones' | 'pujas'>('publicaciones');

  const [misPublicaciones, setMisPublicaciones] = useState<SubastaCardDto[]>(() => {
    const cached = sessionStorage.getItem(CACHE_PUBS_KEY);
    return cached ? JSON.parse(cached) : [];
  });

  const [misOfertas, setMisOfertas] = useState<OfertaCompradorItem[]>(() => {
    const cached = sessionStorage.getItem(CACHE_OFERTAS_KEY);
    return cached ? JSON.parse(cached) : [];
  });

  const [cargando, setCargando] = useState<boolean>(() => {
    const hasPubs = !!sessionStorage.getItem(CACHE_PUBS_KEY);
    const hasOfertas = !!sessionStorage.getItem(CACHE_OFERTAS_KEY);
    return !(hasPubs && hasOfertas);
  });

  const cargarDatos = async (forzarRefresco = false) => {
    if (!usuarioActual?.id || cargandoRef.current) return;
    
    cargandoRef.current = true;
    if (forzarRefresco || misPublicaciones.length === 0 || misOfertas.length === 0) {
      setCargando(true);
    }

    try {
      const [resPubs, resOfertas] = await Promise.all([
        subastaApi.obtenerMisPublicaciones(usuarioActual.id, 1, 15),
        subastaApi.obtenerMisOfertas(usuarioActual.id, 1, 20)
      ]);

      const pubsFetched = resPubs.items || [];
      setMisPublicaciones(pubsFetched);
      sessionStorage.setItem(CACHE_PUBS_KEY, JSON.stringify(pubsFetched));

      const subastasOfertadas = resOfertas.items || [];
      
    const itemsComprador: OfertaCompradorItem[] = subastasOfertadas.map((item) => {
    const activaReal = estaVigente(item);
    
    // ⚡ Evaluación estricta
    const esGanador = item.compradorGanadorId !== undefined && item.compradorGanadorId !== null
      ? String(item.compradorGanadorId) === String(usuarioActual.id)
      : false;

    let estadoPuja: 'GANANDO' | 'SUPERADO' | 'GANADA' | 'NO_ADJUDICADA';

    if (activaReal) {
      estadoPuja = esGanador ? 'GANANDO' : 'SUPERADO';
    } else {
      estadoPuja = esGanador ? 'GANADA' : 'NO_ADJUDICADA';
    }

  return {
    subasta: item,
    montoMayorPuja: item.precioActual || item.precioBase,
    estadoPuja
  };
});

      setMisOfertas(itemsComprador);
      sessionStorage.setItem(CACHE_OFERTAS_KEY, JSON.stringify(itemsComprador));
    } catch (err) {
      console.error("Error cargando datos de actividades:", err);
    } finally {
      setCargando(false);
      cargandoRef.current = false;
    }
  };

  useEffect(() => {
    let montado = true;

    if (montado && usuarioActual?.id) {
      
        cargarDatos();
      
    }

    return () => {
      montado = false;
    };
  }, [usuarioActual?.id]);

  const recaudacionEnJuego = misPublicaciones
    .filter(p => estaVigente(p))
    .reduce((sum, p) => sum + (p.precioActual || p.precioBase || 0), 0);

  const totalRecaudado = misPublicaciones
    .filter(p => !estaVigente(p) && p.cantidadPujas > 0)
    .reduce((sum, p) => sum + (p.precioActual || 0), 0);

  const publicacionesActivasCount = misPublicaciones.filter(p => estaVigente(p)).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5">
            <Activity className="w-7 h-7 text-blue-500" />
            Mis Actividades
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Gestioná tus publicaciones como vendedor y seguí en vivo las subastas en las que ofertaste.
          </p>
        </div>

        {/* Control de Pestañas */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => cargarDatos(true)}
            disabled={cargando}
            title="Refrescar datos desde el servidor"
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin text-blue-400' : ''}`} />
          </button>

          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setTabActiva('publicaciones')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                tabActiva === 'publicaciones'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Package className="w-4 h-4" />
              Mis Publicaciones ({misPublicaciones.length})
            </button>
            <button
              onClick={() => setTabActiva('pujas')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                tabActiva === 'pujas'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              Mis Ofertas ({misOfertas.length})
            </button>
          </div>
        </div>
      </div>

      {/* PESTAÑA 1: MIS PUBLICACIONES (ROL VENDEDOR) */}
      {tabActiva === 'publicaciones' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Total Recaudado</span>
                <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
                  $ {totalRecaudado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Recaudación en Juego</span>
                <span className="text-xl font-bold font-mono text-blue-400 mt-1 block">
                  $ {recaudacionEnJuego.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Subastas Activas</span>
                <span className="text-xl font-bold font-mono text-amber-400 mt-1 block">
                  {publicacionesActivasCount} {publicacionesActivasCount === 1 ? 'artículo' : 'artículos'}
                </span>
              </div>
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                <Gavel className="w-6 h-6" />
              </div>
            </div>
          </div>

          {cargando && misPublicaciones.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              Cargando tus publicaciones...
            </div>
          ) : misPublicaciones.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
              <div className="p-4 bg-blue-500/10 text-blue-400 rounded-2xl w-fit mx-auto">
                <Package className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">No tenés publicaciones activas</h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto mt-1">
                  Publicá un artículo para comenzar a recibir ofertas en vivo de compradores.
                </p>
              </div>
              <Link
                to="/publicar"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition"
              >
                <PlusCircle className="w-4 h-4" /> Publicar una Subasta
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {misPublicaciones.map((subasta) => {
                const activa = estaVigente(subasta);
                return (
                  <div key={subasta.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex gap-4 items-center hover:border-slate-700 transition">
                    <div className="w-20 h-20 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                      {subasta.urlImagen ? (
                        <img 
                          src={subasta.urlImagen} 
                          alt={subasta.titulo} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                          <Package className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate">
                          {subasta.categoriaNombre || 'General'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                            activa
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : subasta.cantidadPujas > 0
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {activa ? 'ACTIVA' : subasta.cantidadPujas > 0 ? 'ADJUDICADA' : 'DESIERTA'}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white truncate">{subasta.titulo}</h4>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-400">Precio Actual:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          $ {(subasta.precioActual || subasta.precioBase).toLocaleString('es-AR')}
                        </span>
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-slate-800/60 mt-1">
                        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>
                            {activa 
                              ? calcularTiempoRestante(subasta.fechaFin) 
                              : `Cerró ${new Date(parsearFechaUtc(subasta.fechaFin)).toLocaleDateString('es-AR')}`}
                          </span>
                        </div>

                        <button
                          onClick={() => navigate(`/subastas/${subasta.id}`)}
                          className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition cursor-pointer"
                        >
                          Ver Sala <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 2: MIS OFERTAS / COMPRAS (ROL COMPRADOR) */}
      {tabActiva === 'pujas' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Garantías Activas (Escrow)</span>
                <span className="text-xl font-bold font-mono text-amber-400 mt-1 block">
                  $ {misOfertas
                    .filter(o => o.estadoPuja === 'GANANDO')
                    .reduce((sum, o) => sum + o.montoMayorPuja, 0)
                    .toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                <Gavel className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Subastas Ganadas</span>
                <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
                  {misOfertas.filter(o => o.estadoPuja === 'GANADA').length} {misOfertas.filter(o => o.estadoPuja === 'GANADA').length === 1 ? 'artículo' : 'artículos'}
                </span>
              </div>
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <Trophy className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">En Competencia</span>
                <span className="text-xl font-bold font-mono text-blue-400 mt-1 block">
                  {misOfertas.filter(o => estaVigente(o.subasta)).length} {misOfertas.filter(o => estaVigente(o.subasta)).length === 1 ? 'subasta' : 'subastas'}
                </span>
              </div>
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>

          {cargando && misOfertas.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              Consultando tus ofertas...
            </div>
          ) : misOfertas.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
              <div className="p-4 bg-purple-500/10 text-purple-400 rounded-2xl w-fit mx-auto">
                <History className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">No realizaste ofertas aún</h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto mt-1">
                  Explorá el catálogo en vivo e ingresá tu primera puja para competir en subastas.
                </p>
              </div>
              <Link
                to="/catalogo"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition"
              >
                <Gavel className="w-4 h-4" /> Ir al Catálogo
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {misOfertas.map(({ subasta, montoMayorPuja, estadoPuja }) => {
                const activaReal = estaVigente(subasta);

                return (
                  <div key={subasta.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex gap-4 items-center hover:border-slate-700 transition">
                    <div className="w-20 h-20 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                      {subasta.urlImagen ? (
                        <img 
                          src={subasta.urlImagen} 
                          alt={subasta.titulo} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                          <Package className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate">
                          Tu Oferta: <strong className="text-amber-400 font-mono">${montoMayorPuja.toLocaleString('es-AR')}</strong>
                        </span>

                        {estadoPuja === 'GANANDO' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> GANANDO
                          </span>
                        )}
                        {estadoPuja === 'SUPERADO' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/40 flex items-center gap-1 shrink-0">
                            <AlertTriangle className="w-3 h-3" /> SUPERADO
                          </span>
                        )}
                        {estadoPuja === 'GANADA' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1 shrink-0">
                            <Trophy className="w-3 h-3" /> ¡GANASTE!
                          </span>
                        )}
                        {estadoPuja === 'NO_ADJUDICADA' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                            NO ADJUDICADA
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-white truncate">{subasta.titulo}</h4>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-400">Precio Actual:</span>
                        <span className="font-mono font-bold text-white">
                          $ {(subasta.precioActual || subasta.precioBase).toLocaleString('es-AR')}
                        </span>
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-slate-800/60 mt-1">
                        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>
                            {activaReal
                              ? calcularTiempoRestante(subasta.fechaFin) 
                              : `Finalizó ${new Date(parsearFechaUtc(subasta.fechaFin)).toLocaleDateString('es-AR')}`}
                          </span>
                        </div>

                        <button
                          onClick={() => navigate(`/subastas/${subasta.id}`)}
                          className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition cursor-pointer ${
                            estadoPuja === 'SUPERADO'
                              ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40'
                              : 'text-blue-400 hover:text-blue-300'
                          }`}
                        >
                          {estadoPuja === 'SUPERADO' ? 'Superar Puja' : 'Ver Sala'} <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivitiesPage;