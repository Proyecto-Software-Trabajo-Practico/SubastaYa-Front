/*
  Página principal del Catálogo de Subastas (CatalogPage.tsx).
  Implementa el diseño estilo "Spotlight en Vivo" propuesto en draw.io:
  - Columna Izquierda: Filtros dinámicos con chips descartables y caja de Descripción técnica.
  - Columna Central: Carrusel interactivo para recorrer subastas con botón "PUJAR!" hacia la Sala en Vivo.
  - Columna Derecha: Reloj Digital LED (fondo negro/letras blancas/rojo < 1min) e Historial de Pujas en tiempo real.
*/

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { httpClient } from '../API/httpClient';
import { DigitalCountdown } from '../components/auction/DigitalCountdown';
import { PujaHistoryList, type PujaItem } from '../components/auction/PujaHistoryList';
import { AuctionFilters, type FiltrosSubasta } from '../components/auction/AuctionFilters';
import { ChevronLeft, ChevronRight, Gavel, Tag, AlertCircle, Trophy } from 'lucide-react';

export interface SubastaCard {
  id: number;
  titulo: string;
  urlImagen: string | null;
  estado: string;
  precioBase: number;
  precioActual: number;
  cantidadPujas: number;
  fechaFin: string;
  categoriaId: number;
  categoriaNombre: string;
}

export interface SubastaDetalle extends SubastaCard {
  descripcion: string;
  incrementoMinimo: number;
  fechaInicio: string;
  vendedorId: number;
  vendedorNombre: string;
  ultimasPujas: PujaItem[];
}

interface Categoria {
  id: number;
  nombre: string;
}

interface ResultadoPaginado<T> {
  items: T[];
  totalItems: number;
  pagina: number;
  tamanoPagina: number;
  totalPaginas: number;
}

export const CatalogPage: React.FC = () => {
  const navigate = useNavigate();

  // Estados de catálogo y filtros
  const [subastas, setSubastas] = useState<SubastaCard[]>([]);
  const [indiceActual, setIndiceActual] = useState<number>(0);
  const [detalleActivo, setDetalleActivo] = useState<SubastaDetalle | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [cargandoDetalle, setCargandoDetalle] = useState<boolean>(false);

  // Caché en memoria para transiciones instantáneas (0 ms) sin parpadeos al volver a subastas ya vistas
  const cacheDetalles = useRef<Record<number, SubastaDetalle>>({});

  // Estados para paginación escalable del catálogo (requisito de rendimiento)
  const [pagina, setPagina] = useState<number>(1);
  const [totalPaginas, setTotalPaginas] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const TAMANO_PAGINA = 20;

  const [filtros, setFiltros] = useState<FiltrosSubasta>({
    estado: null,
    orden: null,
    categoriaId: null,
    categoriaNombre: null,
  });

  // Al alterar los filtros de búsqueda, reseteamos a la primera página de resultados
  useEffect(() => {
    setPagina(1);
  }, [filtros]);

  // Carga inicial de categorías desde GET /api/categorias
  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const data = await httpClient.get<Categoria[]>('/categorias');
        if (data && data.length > 0) {
          setCategorias(data);
        }
      } catch {
        // Categorías por defecto si la BD aún no las tiene cargadas
        setCategorias([
          { id: 1, nombre: 'Juegos y Coleccionables' },
          { id: 2, nombre: 'Hogar y Muebles' },
          { id: 3, nombre: 'Tecnología' },
        ]);
      }
    };
    cargarCategorias();
  }, []);

  // Consulta paginada del catálogo GET /api/subastas con filtros y página activa
  useEffect(() => {
    const cargarSubastas = async () => {
      setCargando(true);
      try {
        const params = new URLSearchParams();
        if (filtros.estado) params.set('estado', filtros.estado);
        if (filtros.orden) params.set('orden', filtros.orden);
        if (filtros.categoriaId) params.set('categoriaId', String(filtros.categoriaId));
        params.set('pagina', String(pagina));
        params.set('tamanoPagina', String(TAMANO_PAGINA));

        const queryStr = params.toString();
        const endpoint = `/subastas${queryStr ? `?${queryStr}` : ''}`;
        const resultado = await httpClient.get<ResultadoPaginado<SubastaCard>>(endpoint);

        if (resultado && resultado.items && resultado.items.length > 0) {
          setSubastas(resultado.items);
          setTotalItems(resultado.totalItems);
          setTotalPaginas(resultado.totalPaginas);
          setIndiceActual(0);
        } else {
          setSubastas([]);
          setTotalItems(0);
          setTotalPaginas(1);
          setIndiceActual(0);
        }
      } catch {
        setSubastas([]);
        setTotalItems(0);
        setTotalPaginas(1);
        setIndiceActual(0);
      } finally {
        setCargando(false);
      }
    };

    cargarSubastas();
  }, [filtros, pagina]);

  // Subasta actual visible en el carrusel
  const subastaActual = subastas[indiceActual] || null;

  // Posición absoluta en el catálogo global (ej. subasta 21 de 22, o 350 de 2000)
  const posicionGlobal = totalItems > 0 ? (pagina - 1) * TAMANO_PAGINA + indiceActual + 1 : 0;

  // Cada vez que cambia la subasta seleccionada en el carrusel, cargamos su detalle (GET /api/subastas/{id})
  useEffect(() => {
    if (!subastaActual) {
      setDetalleActivo(null);
      return;
    }

    // 1. Si ya se cargó previamente en la sesión, la mostramos al instante sin parpadeos (0 ms)
    if (cacheDetalles.current[subastaActual.id]) {
      setDetalleActivo(cacheDetalles.current[subastaActual.id]);
      setCargandoDetalle(false);
      return;
    }

    // Limpiamos el detalle de la tarjeta previa para evitar datos residuales durante la primera carga de red
    setDetalleActivo(null);

    const cargarDetalle = async () => {
      setCargandoDetalle(true);
      try {
        const detalle = await httpClient.get<SubastaDetalle>(`/subastas/${subastaActual.id}`);
        cacheDetalles.current[subastaActual.id] = detalle;
        setDetalleActivo(detalle);
      } catch {
        // Fallback defensivo con los datos que ya tenemos del card
        const fallback: SubastaDetalle = {
          ...subastaActual,
          descripcion: 'Descripción no disponible.',
          incrementoMinimo: 1000,
          fechaInicio: new Date().toISOString(),
          vendedorId: 1,
          vendedorNombre: 'Vendedor',
          ultimasPujas: [],
        };
        cacheDetalles.current[subastaActual.id] = fallback;
        setDetalleActivo(fallback);
      } finally {
        setCargandoDetalle(false);
      }
    };

    cargarDetalle();
  }, [subastaActual?.id]);

  /*
    Transición reactiva cuando el reloj llega a cero:
    - Si el usuario filtra específicamente por 'ACTIVA', expulsa la subasta de la lista
      para mantener la consistencia con el filtro aplicado.
    - Actualiza inmediatamente el estado en memoria de la subasta a 'FINALIZADA'
      para que el badge de estado, el botón de acción y la descripción cambien de inmediato.
    - Si no es demo, consulta al backend para traer la liquidación final consolidada por el Worker.
  */
  const handleSubastaFinalizada = () => {
    if (!subastaActual || subastaActual.estado === 'FINALIZADA') return;

    // Si el usuario está filtrando exclusivamente por subastas ACTIVAS, al finalizar se remueve de la lista
    if (filtros.estado === 'ACTIVA') {
      setSubastas((prev) => {
        const nuevaLista = prev.filter((s) => s.id !== subastaActual.id);
        setIndiceActual((prevIndice) =>
          prevIndice >= nuevaLista.length ? Math.max(0, nuevaLista.length - 1) : prevIndice
        );
        return nuevaLista;
      });
      return;
    }

    setSubastas((prevSubastas) =>
      prevSubastas.map((s) =>
        s.id === subastaActual.id ? { ...s, estado: 'FINALIZADA' } : s
      )
    );

    setDetalleActivo((prevDetalle) =>
      prevDetalle && prevDetalle.id === subastaActual.id
        ? { ...prevDetalle, estado: 'FINALIZADA' }
        : prevDetalle
    );

    httpClient
      .get<SubastaDetalle>(`/subastas/${subastaActual.id}`)
      .then((detalle) => setDetalleActivo(detalle))
      .catch(() => {
        // El estado visual local ya se encuentra protegido en FINALIZADA
      });
  };

  /*
    Transición reactiva cuando la cuenta regresiva de apertura llega a cero:
    - Si el usuario filtra específicamente por 'PROGRAMADA', expulsa la subasta de la lista
      para mantener la consistencia con el filtro aplicado.
    - Pasa el estado de 'PROGRAMADA' a 'ACTIVA' en tiempo real.
    - Habilita de inmediato el botón '¡PUJAR!' y cambia el badge a verde.
    - El reloj automáticamente comienza a descontar el tiempo restante hasta fechaFin.
  */
  const handleSubastaIniciada = () => {
    if (!subastaActual || subastaActual.estado !== 'PROGRAMADA') return;

    // Si el usuario está filtrando exclusivamente por subastas PROGRAMADAS, al activarse se remueve de la lista
    if (filtros.estado === 'PROGRAMADA') {
      setSubastas((prev) => {
        const nuevaLista = prev.filter((s) => s.id !== subastaActual.id);
        setIndiceActual((prevIndice) =>
          prevIndice >= nuevaLista.length ? Math.max(0, nuevaLista.length - 1) : prevIndice
        );
        return nuevaLista;
      });
      return;
    }

    setSubastas((prevSubastas) =>
      prevSubastas.map((s) =>
        s.id === subastaActual.id ? { ...s, estado: 'ACTIVA' } : s
      )
    );

    setDetalleActivo((prevDetalle) =>
      prevDetalle && prevDetalle.id === subastaActual.id
        ? { ...prevDetalle, estado: 'ACTIVA' }
        : prevDetalle
    );
  };

  // Navegación del Carrusel
  const anteriorSubasta = () => {
    if (subastas.length === 0) return;
    setIndiceActual((prev) => (prev > 0 ? prev - 1 : subastas.length - 1));
  };

  const siguienteSubasta = () => {
    if (subastas.length === 0) return;
    setIndiceActual((prev) => (prev < subastas.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="space-y-6">
      {/* Contenedor Principal estilo Draw.io (Azul profundo con marco elegante) */}
      <div className="bg-gradient-to-br from-blue-950/70 via-slate-900 to-slate-950 border-2 border-blue-900/50 rounded-3xl p-6 sm:p-8 shadow-2xl">
        
        {cargando ? (
          <div className="py-24 text-center text-slate-400">
            <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold">Cargando catálogo en vivo...</p>
          </div>
        ) : subastas.length === 0 ? (
          <div className="py-20 text-center space-y-4 max-w-md mx-auto">
            <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">No se encontraron subastas</h3>
            <p className="text-xs text-slate-400">
              No hay artículos que coincidan con los filtros aplicados actualmente.
            </p>
            <button
              onClick={() => setFiltros({ estado: null, orden: null, categoriaId: null, categoriaNombre: null })}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors"
            >
              Restablecer Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ============================================================ */}
            {/* COLUMNA IZQUIERDA: Filtros + Caja de Descripción             */}
            {/* ============================================================ */}
            <div className="lg:col-span-3 space-y-5">
              {/* Panel de Filtros con Chips removibles */}
              <AuctionFilters
                filtros={filtros}
                onCambiarFiltro={setFiltros}
                categorias={categorias}
              />

              {/* Recuadro de DESCRIPCIÓN (exacto a la caja inferior de draw.io) */}
              <div className="bg-white text-slate-900 rounded-2xl p-5 shadow-lg border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">
                    DESCRIPCIÓN DEL PRODUCTO
                  </h4>
                  {subastaActual.estado === 'FINALIZADA' && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      Cerrada
                    </span>
                  )}
                </div>

                <h5 className="font-bold text-sm text-slate-950 line-clamp-2 leading-tight">
                  {detalleActivo?.titulo || subastaActual?.titulo}
                </h5>

                <p className="text-xs text-slate-600 mt-2 leading-relaxed max-h-36 overflow-y-auto pr-1">
                  {detalleActivo?.descripcion || 'Cargando descripción técnica del artículo...'}
                </p>

                {/* Panel informativo si la subasta ya concluyó */}
                {subastaActual.estado === 'FINALIZADA' && (
                  <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                    {detalleActivo?.ultimasPujas && detalleActivo.ultimasPujas.length > 0 ? (
                      <>
                        <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                          <Trophy className="w-3.5 h-3.5 text-amber-500" />
                          <span>Subasta Adjudicada</span>
                        </div>
                        <div className="text-slate-700">
                          Ganador: <span className="font-semibold text-slate-900">{detalleActivo.ultimasPujas[0].compradorNombre}</span>
                        </div>
                        <div className="text-slate-700">
                          Monto final: <span className="font-mono font-bold text-emerald-700">$ {detalleActivo.ultimasPujas[0].monto.toLocaleString('es-AR')}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                        <span>Subasta Desierta (sin ofertas registradas)</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Ficha de datos adicionales del DTO con tipografía jerarquizada */}
                <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-2 gap-2.5">
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
                    <span className="text-xs font-semibold text-slate-500 block mb-0.5">Precio Base</span>
                    <span className="font-mono font-bold text-sm sm:text-base text-slate-900 block">
                      $ {(detalleActivo?.precioBase || subastaActual.precioBase).toLocaleString('es-AR')}
                    </span>
                  </div>
                  <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2.5">
                    <span className="text-xs font-semibold text-emerald-700 block mb-0.5">Incremento</span>
                    <span className="font-mono font-bold text-sm sm:text-base text-emerald-700 block">
                      + $ {(detalleActivo?.incrementoMinimo || 1000).toLocaleString('es-AR')}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-700">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Tag className="w-3.5 h-3.5 text-blue-600" />
                      {subastaActual.categoriaNombre}
                    </span>
                    <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                      {subastaActual.cantidadPujas} {subastaActual.cantidadPujas === 1 ? 'oferta' : 'ofertas'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* COLUMNA CENTRAL: Carrusel Showcase + Botón PUJAR!            */}
            {/* ============================================================ */}
            <div className="lg:col-span-6 flex flex-col items-center justify-between space-y-5">
              
              {/* Encabezado del artículo en carrusel */}
              <div className="w-full flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                    Subasta {posicionGlobal} de {totalItems}
                  </span>
                  {totalPaginas > 1 && (
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 border border-slate-700/60 px-2.5 py-0.5 rounded-full hidden sm:inline-block">
                      Pág. {pagina}/{totalPaginas}
                    </span>
                  )}
                </div>

                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    subastaActual.estado === 'ACTIVA'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : subastaActual.estado === 'PROGRAMADA'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-700/80 text-slate-300 border border-slate-600'
                  }`}
                >
                  {subastaActual.estado}
                </span>
              </div>

              {/* Marco de la Imagen Central con Controles del Carrusel */}
              <div className="relative w-full bg-slate-950/80 border-2 border-slate-800 rounded-3xl p-4 flex flex-col items-center justify-center min-h-[380px] shadow-2xl group">
                
                {/* Flecha Izquierda (Anterior) */}
                <button
                  onClick={anteriorSubasta}
                  title="Subasta anterior"
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2.5 bg-slate-900/90 hover:bg-blue-600 text-white rounded-full border border-slate-700 transition-all shadow-xl hover:scale-110"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                {/* Imagen del Producto */}
                <div className="w-full h-72 sm:h-80 flex items-center justify-center overflow-hidden rounded-2xl bg-slate-900/40">
                  <img
                    src={subastaActual.urlImagen || '/placeholder.png'}
                    alt={subastaActual.titulo}
                    onError={(e) => {
                      // Si la imagen falla o no existe en public/imagenes, muestra un fallback limpio
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80';
                    }}
                    className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105 drop-shadow-2xl"
                  />
                </div>

                {/* Flecha Derecha (Siguiente) */}
                <button
                  onClick={siguienteSubasta}
                  title="Siguiente subasta"
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2.5 bg-slate-900/90 hover:bg-blue-600 text-white rounded-full border border-slate-700 transition-all shadow-xl hover:scale-110"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* Indicadores circulares (Puntos o o o) */}
                <div className="flex items-center gap-2 mt-4">
                  {subastas.slice(0, 10).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setIndiceActual(idx)}
                      className={`h-2.5 rounded-full transition-all ${
                        idx === indiceActual
                          ? 'w-6 bg-blue-500 shadow-md'
                          : 'w-2.5 bg-slate-700 hover:bg-slate-500'
                      }`}
                      title={`Ir a subasta ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Botón de Acción Principal: ¡PUJAR! */}
              <div className="w-full flex flex-col items-center">
                <button
                  disabled={subastaActual.estado !== 'ACTIVA'}
                  onClick={() => navigate(`/subastas/${subastaActual.id}`)}
                  className={`w-full sm:w-3/4 py-4 px-8 text-xl sm:text-2xl font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-3 border ${
                    subastaActual.estado === 'ACTIVA'
                      ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white shadow-xl shadow-red-900/40 hover:shadow-red-700/60 transform hover:-translate-y-1 active:translate-y-0 cursor-pointer border-red-400/40'
                      : subastaActual.estado === 'PROGRAMADA'
                      ? 'bg-slate-800/90 text-amber-400/80 border-amber-500/30 cursor-not-allowed shadow-none'
                      : 'bg-slate-800 text-slate-500 border-slate-700/80 cursor-not-allowed shadow-none'
                  }`}
                >
                  {subastaActual.estado === 'ACTIVA' && <Gavel className="w-7 h-7 animate-bounce" />}
                  <span>
                    {subastaActual.estado === 'ACTIVA'
                      ? '¡PUJAR!'
                      : subastaActual.estado === 'PROGRAMADA'
                      ? 'PRÓXIMAMENTE (PROGRAMADA)'
                      : subastaActual.cantidadPujas === 0
                      ? 'FINALIZADA (DESIERTA)'
                      : 'SUBASTA FINALIZADA'}
                  </span>
                </button>
                <span className="text-[11px] text-slate-400 mt-2 text-center">
                  {subastaActual.estado === 'ACTIVA'
                    ? 'Entrar a la Sala de Bidding en Vivo para ofertar en tiempo real.'
                    : subastaActual.estado === 'PROGRAMADA'
                    ? 'Esta subasta aún no ha comenzado. Próximamente se habilitarán las ofertas.'
                    : 'Esta subasta ya concluyó y no admite nuevas ofertas.'}
                </span>
              </div>

              {/* Controles de Paginación de Lotes (homogéneo con Billetera) */}
              {totalPaginas > 1 && (
                <div className="w-full sm:w-3/4 flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 text-xs shadow-lg">
                  <button
                    onClick={() => setPagina((p) => Math.max(1, p - 1))}
                    disabled={pagina <= 1 || cargando}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-slate-300 font-semibold transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> Anterior
                  </button>
                  <span className="text-slate-400 font-mono text-xs">
                    Página <strong className="text-white">{pagina}</strong> de <strong className="text-white">{totalPaginas}</strong>
                  </span>
                  <button
                    onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                    disabled={pagina >= totalPaginas || cargando}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-slate-300 font-semibold transition-colors cursor-pointer"
                  >
                    Siguiente <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

            </div>

            {/* ============================================================ */}
            {/* COLUMNA DERECHA: Reloj Digital LED + Historial de Pujas      */}
            {/* ============================================================ */}
            <div className="lg:col-span-3 flex flex-col gap-5 h-full">
              
              {/* Reloj LED (Fondo negro / Letras blancas / Rojas < 1 min) */}
              <div className="flex justify-center w-full">
                <DigitalCountdown
                  fechaFin={(detalleActivo?.id === subastaActual.id ? detalleActivo.fechaFin : null) || subastaActual.fechaFin}
                  fechaInicio={detalleActivo?.id === subastaActual.id ? detalleActivo.fechaInicio : undefined}
                  estado={subastaActual.estado}
                  onFinalizada={handleSubastaFinalizada}
                  onIniciada={handleSubastaIniciada}
                />
              </div>

              {/* Panel de Últimas Ofertas en Tiempo Real */}
              <div className="flex-1">
                <PujaHistoryList
                  pujas={detalleActivo?.ultimasPujas || []}
                  cargando={cargandoDetalle}
                />
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
};

export default CatalogPage;
