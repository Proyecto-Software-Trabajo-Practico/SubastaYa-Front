/*
  Página de Mis Actividades (ActivitiesPage).
  Corresponde al Módulo 5 del TP.
  Incluye caché en sessionStorage para evitar parpadeos y spinners al navegar entre páginas.
  Optimización mediante Promise.all para la resolución paralela de pujas del comprador.
*/

import React, { useState, useEffect } from 'react';
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
import { subastaApi, type SubastaCardDto, type SubastaDetalleDto } from '../API/subastaApi';

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

  const [tabActiva, setTabActiva] = useState<'publicaciones' | 'pujas'>('publicaciones');

  // Inicializar estado directamente desde sessionStorage si existe
  const [misPublicaciones, setMisPublicaciones] = useState<SubastaCardDto[]>(() => {
    const cached = sessionStorage.getItem(CACHE_PUBS_KEY);
    return cached ? JSON.parse(cached) : [];
  });

  const [misOfertas, setMisOfertas] = useState<OfertaCompradorItem[]>(() => {
    const cached = sessionStorage.getItem(CACHE_OFERTAS_KEY);
    return cached ? JSON.parse(cached) : [];
  });

  // Si ya había datos en caché, no mostramos el estado de carga inicial
  const [cargando, setCargando] = useState<boolean>(() => {
    return !sessionStorage.getItem(CACHE_PUBS_KEY);
  });

  const cargarDatos = async (forzarRefresco = false) => {
    if (!usuarioActual?.id) return;
    
    // Si ya tenemos datos y no es un refresco forzado por botón, no mostramos el loader gigante
    if (forzarRefresco || misPublicaciones.length === 0) {
      setCargando(true);
    }

    try {
      // 1. Cargar Publicaciones del Vendedor
      const resPubs = await subastaApi.obtenerMisPublicaciones(usuarioActual.id, 1, 100);
      const pubsFetched = resPubs.items || [];
      setMisPublicaciones(pubsFetched);
      sessionStorage.setItem(CACHE_PUBS_KEY, JSON.stringify(pubsFetched));

      // 2. Cargar Catálogo General
      const resCat = await subastaApi.obtenerCatalogoGeneral(1, 100);
      const catalogoItems = resCat.items || [];

      // 3. OPTIMIZACIÓN: Disparar TODAS las peticiones de detalle simultáneamente en paralelo
      const detallesPromises = catalogoItems.map(item =>
        subastaApi.obtenerDetalleSubasta(item.id).catch(() => null)
      );

      // Tipado explícito para evitar advertencias de TypeScript con la interfaz importada
      const detallesResult: (SubastaDetalleDto | null)[] = await Promise.all(detallesPromises);

      // 4. Procesar y filtrar los resultados en memoria
      const itemsComprador: OfertaCompradorItem[] = [];

      detallesResult.forEach((detalle, index) => {
        // Si falló la petición individual o no hay pujas, salteamos
        if (!detalle || !detalle.pujas || detalle.pujas.length === 0) return;

        const item = catalogoItems[index];
        const misPujasEnSubasta = detalle.pujas.filter(p => p.usuarioId === usuarioActual.id);

        if (misPujasEnSubasta.length > 0) {
          const mayorOfertaPropia = Math.max(...misPujasEnSubasta.map(p => p.monto));
          
          // El mayor oferente global es el usuario con la puja de mayor monto en el array
          const pujaMasAltaGlobal = detalle.pujas.reduce(
            (max, p) => (p.monto > max.monto ? p : max), 
            detalle.pujas[0]
          );
          const esMayorOferenteGlobal = pujaMasAltaGlobal.usuarioId === usuarioActual.id;

          const activaReal = estaVigente(item);
          let estadoPuja: 'GANANDO' | 'SUPERADO' | 'GANADA' | 'NO_ADJUDICADA';

          if (activaReal) {
            estadoPuja = esMayorOferenteGlobal ? 'GANANDO' : 'SUPERADO';
          } else {
            estadoPuja = esMayorOferenteGlobal ? 'GANADA' : 'NO_ADJUDICADA';
          }

          itemsComprador.push({
            subasta: item,
            montoMayorPuja: mayorOfertaPropia,
            estadoPuja
          });
        }
      });

      setMisOfertas(itemsComprador);
      sessionStorage.setItem(CACHE_OFERTAS_KEY, JSON.stringify(itemsComprador));
    } catch {
      // Error silencioso
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    // Si no hay nada en caché, hacemos el fetch inicial
    if (!sessionStorage.getItem(CACHE_PUBS_KEY)) {
      cargarDatos();
    }
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
          {/* Tarjetas KPIs */}
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
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Proyección de venta</span>
                <span className="text-xl font-bold font-mono text-amber-400 mt-1 block">
                  $ {recaudacionEnJuego.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Subastas Activas</span>
                <span className="text-xl font-bold font-mono text-blue-400 mt-1 block">
                  {publicacionesActivasCount} {publicacionesActivasCount === 1 ? 'artículo' : 'artículos'}
                </span>
              </div>
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                <Gavel className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Grilla de Publicaciones */}
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
                <h3 className="text-lg font-bold text-white">No tenés subastas creadas</h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto mt-1">
                  Publicá tu primer artículo para empezar a recibir ofertas en vivo de compradores.
                </p>
              </div>
              <Link
                to="/publicar"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm transition"
              >
                <PlusCircle className="w-4 h-4" /> Publicar Subasta Ahora
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {misPublicaciones.map((sub) => {
                const esActiva = estaVigente(sub);
                const esAdjudicada = !esActiva && sub.cantidadPujas > 0;
                const esDesierta = !esActiva && sub.cantidadPujas === 0;

                return (
                  <div key={sub.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex gap-4 items-center hover:border-slate-700 transition">
                    <div className="w-20 h-20 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0">
                      {sub.urlImagen ? (
                        <img src={sub.urlImagen} alt={sub.titulo} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                          <Package className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider truncate">
                          {sub.categoriaNombre || 'Categoría'}
                        </span>

                        {esActiva && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> ACTIVA
                          </span>
                        )}
                        {esAdjudicada && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1 shrink-0">
                            <Trophy className="w-3 h-3" /> ADJUDICADA
                          </span>
                        )}
                        {esDesierta && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                            DESIERTA
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-white truncate">{sub.titulo}</h4>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-400">
                          Pujas: <strong className="text-white font-mono">{sub.cantidadPujas}</strong>
                        </span>
                        <span className="font-mono font-bold text-emerald-400">
                          $ {(sub.precioActual || sub.precioBase).toLocaleString('es-AR')}
                        </span>
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-slate-800/60 mt-1">
                        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>
                            {esActiva
                              ? calcularTiempoRestante(sub.fechaFin)
                              : esDesierta
                              ? 'Cerrada (Desierta)'
                              : 'Cerrada (Adjudicada)'}
                          </span>
                        </div>

                        <button
                          onClick={() => navigate(`/subastas/${sub.id}`)}
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
                    <div className="w-20 h-20 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0">
                      {subasta.urlImagen ? (
                        <img src={subasta.urlImagen} alt={subasta.titulo} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                          <Package className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate">
                          Tu Puja Máxima: <strong className="text-amber-400 font-mono">${montoMayorPuja.toLocaleString('es-AR')}</strong>
                        </span>

                        {estadoPuja === 'GANANDO' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> GANANDO
                          </span>
                        )}
                        {estadoPuja === 'SUPERADO' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1 shrink-0">
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
                            NO GANADA
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
                              : subasta.cantidadPujas === 0
                              ? 'Cerrada (Desierta)'
                              : 'Cerrada'}
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
                          {estadoPuja === 'SUPERADO' ? 'Superar Puja' : 'Ver Detalle'} <ExternalLink className="w-3 h-3" />
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