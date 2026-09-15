/*
  Componente de Filtros Laterales (AuctionFilters.tsx).
  Responsabilidad Única (SRP):
  - Permite filtrar por Estado, Criterio de Precio y Tiempo Restante.
  - Muestra la sección "Filtros aplicados" con Chips/Badges interactivos que 
    contienen una 'X' para remover individualmente cada filtro seleccionado.
  - Conecta directamente con los parámetros query de GET /api/subastas.
*/

import React, { useState } from 'react';
import { Filter, X, ChevronDown, Check } from 'lucide-react';

export interface FiltrosSubasta {
  estado: string | null;
  orden: 'tiempo' | 'precio_asc' | 'precio_desc' | null;
  categoriaId: number | null;
  categoriaNombre?: string | null;
}

interface AuctionFiltersProps {
  filtros: FiltrosSubasta;
  onCambiarFiltro: (nuevosFiltros: FiltrosSubasta) => void;
  categorias?: { id: number; nombre: string }[];
}

export const AuctionFilters: React.FC<AuctionFiltersProps> = ({
  filtros,
  onCambiarFiltro,
  categorias = [],
}) => {
  // Estados para abrir/cerrar los menús desplegables
  const [abrirMenu, setAbrirMenu] = useState<'estado' | 'precio' | 'tiempo' | 'categoria' | null>(null);

  const alternarMenu = (menu: 'estado' | 'precio' | 'tiempo' | 'categoria') => {
    setAbrirMenu(abrirMenu === menu ? null : menu);
  };

  // Handlers para aplicar cada filtro individual
  const seleccionarEstado = (estado: string | null) => {
    /*
      Regla de Negocio:
      Si el usuario selecciona un estado diferente a 'ACTIVA' (o limpia el estado)
      y tenía activo el orden 'tiempo' (finalizan pronto), se resetea ese orden
      porque solo es aplicable a subastas en curso.
    */
    const nuevoOrden = estado !== 'ACTIVA' && filtros.orden === 'tiempo' ? null : filtros.orden;
    onCambiarFiltro({ ...filtros, estado, orden: nuevoOrden });
    setAbrirMenu(null);
  };

  const seleccionarOrden = (orden: 'tiempo' | 'precio_asc' | 'precio_desc' | null) => {
    /*
      Regla de Negocio:
      El criterio 'tiempo' (finalizan pronto) solo aplica lógicamente a subastas 'ACTIVA'.
      Las subastas programadas aún no iniciaron y las finalizadas ya concluyeron.
      Por ende, al ordenar por tiempo forzamos automáticamente el filtro de estado en 'ACTIVA'.
    */
    const nuevoEstado = orden === 'tiempo' ? 'ACTIVA' : filtros.estado;
    onCambiarFiltro({ ...filtros, orden, estado: nuevoEstado });
    setAbrirMenu(null);
  };

  const seleccionarCategoria = (id: number | null, nombre?: string | null) => {
    onCambiarFiltro({ ...filtros, categoriaId: id, categoriaNombre: nombre });
    setAbrirMenu(null);
  };

  // Contar cuántos filtros activos tenemos
  const tieneFiltros = Boolean(filtros.estado || filtros.orden || filtros.categoriaId);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-lg">
      
      {/* Título de la sección */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-400" />
          Filtros
        </h3>
        {tieneFiltros && (
          <button
            onClick={() => onCambiarFiltro({ estado: null, orden: null, categoriaId: null, categoriaNombre: null })}
            className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold transition-colors"
          >
            Limpiar todo
          </button>
        )}
      </div>

      {/* Botones selectores con desplegables */}
      <div className="space-y-2.5">
        
        {/* 1. Selector de ESTADO */}
        <div className="relative">
          <button
            onClick={() => alternarMenu('estado')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-colors ${
              filtros.estado
                ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span>Estado</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${abrirMenu === 'estado' ? 'rotate-180' : ''}`} />
          </button>

          {abrirMenu === 'estado' && (
            <div className="absolute left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden py-1">
              <button
                onClick={() => seleccionarEstado(null)}
                className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 flex items-center justify-between"
              >
                <span>Todos los estados</span>
                {!filtros.estado && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </button>
              <button
                onClick={() => seleccionarEstado('ACTIVA')}
                className="w-full text-left px-3 py-2 text-xs text-emerald-400 hover:bg-slate-700 flex items-center justify-between"
              >
                <span>Activa</span>
                {filtros.estado === 'ACTIVA' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
              <button
                onClick={() => seleccionarEstado('PROGRAMADA')}
                className="w-full text-left px-3 py-2 text-xs text-amber-400 hover:bg-slate-700 flex items-center justify-between"
              >
                <span>Programada</span>
                {filtros.estado === 'PROGRAMADA' && <Check className="w-3.5 h-3.5 text-amber-400" />}
              </button>
              <button
                onClick={() => seleccionarEstado('FINALIZADA')}
                className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-slate-700 flex items-center justify-between"
              >
                <span>Finalizada</span>
                {filtros.estado === 'FINALIZADA' && <Check className="w-3.5 h-3.5 text-slate-400" />}
              </button>
            </div>
          )}
        </div>

        {/* 2. Selector de PRECIO */}
        <div className="relative">
          <button
            onClick={() => alternarMenu('precio')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-colors ${
              filtros.orden === 'precio_asc' || filtros.orden === 'precio_desc'
                ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span>Precio</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${abrirMenu === 'precio' ? 'rotate-180' : ''}`} />
          </button>

          {abrirMenu === 'precio' && (
            <div className="absolute left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden py-1">
              <button
                onClick={() => seleccionarOrden('precio_asc')}
                className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 flex items-center justify-between"
              >
                <span>Menor precio primero (Ascendente)</span>
                {filtros.orden === 'precio_asc' && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </button>
              <button
                onClick={() => seleccionarOrden('precio_desc')}
                className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 flex items-center justify-between"
              >
                <span>Mayor precio primero (Descendente)</span>
                {filtros.orden === 'precio_desc' && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </button>
            </div>
          )}
        </div>

        {/* 3. Selector de TIEMPO RESTANTE */}
        <div className="relative">
          <button
            onClick={() => alternarMenu('tiempo')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-colors ${
              filtros.orden === 'tiempo'
                ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span>Tiempo Restante</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${abrirMenu === 'tiempo' ? 'rotate-180' : ''}`} />
          </button>

          {abrirMenu === 'tiempo' && (
            <div className="absolute left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden py-1">
              <button
                onClick={() => seleccionarOrden('tiempo')}
                className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 flex items-center justify-between"
              >
                <span>Finalizan pronto (Solo Activas)</span>
                {filtros.orden === 'tiempo' && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </button>
            </div>
          )}
        </div>

        {/* 4. Selector opcional de CATEGORÍA */}
        {categorias.length > 0 && (
          <div className="relative">
            <button
              onClick={() => alternarMenu('categoria')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-colors ${
                filtros.categoriaId
                  ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                  : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>Categoría</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${abrirMenu === 'categoria' ? 'rotate-180' : ''}`} />
            </button>

            {abrirMenu === 'categoria' && (
              <div className="absolute left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden py-1 max-h-48 overflow-y-auto">
                <button
                  onClick={() => seleccionarCategoria(null, null)}
                  className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 flex items-center justify-between"
                >
                  <span>Todas las categorías</span>
                  {!filtros.categoriaId && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </button>
                {categorias.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => seleccionarCategoria(cat.id, cat.nombre)}
                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 flex items-center justify-between"
                  >
                    <span>{cat.nombre}</span>
                    {filtros.categoriaId === cat.id && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Sección "Filtros aplicados" con Chips y botón 'X' para remover */}
      <div className="pt-3 border-t border-slate-800/80">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
          Filtros aplicados
        </h4>

        {!tieneFiltros ? (
          <p className="text-[11px] text-slate-500 italic">
            Ningún filtro activo (mostrando todas las subastas).
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            
            {/* Chip de Estado */}
            {filtros.estado && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-white text-slate-900 border border-slate-200 shadow-sm">
                <span>{filtros.estado}</span>
                <button
                  onClick={() => seleccionarEstado(null)}
                  title="Quitar filtro de estado"
                  className="p-0.5 hover:bg-slate-200 rounded-full transition-colors text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {/* Chip de Precio */}
            {filtros.orden === 'precio_asc' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-white text-slate-900 border border-slate-200 shadow-sm">
                <span>PRECIO ASCENDENTE</span>
                <button
                  onClick={() => seleccionarOrden(null)}
                  title="Quitar filtro de precio ascendente"
                  className="p-0.5 hover:bg-slate-200 rounded-full transition-colors text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {filtros.orden === 'precio_desc' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-white text-slate-900 border border-slate-200 shadow-sm">
                <span>PRECIO DESCENDENTE</span>
                <button
                  onClick={() => seleccionarOrden(null)}
                  title="Quitar filtro de precio descendente"
                  className="p-0.5 hover:bg-slate-200 rounded-full transition-colors text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {/* Chip de Tiempo Restante */}
            {filtros.orden === 'tiempo' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-white text-slate-900 border border-slate-200 shadow-sm">
                <span>FINALIZAN PRONTO (ACTIVAS)</span>
                <button
                  onClick={() => seleccionarOrden(null)}
                  title="Quitar filtro de tiempo restante"
                  className="p-0.5 hover:bg-slate-200 rounded-full transition-colors text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {/* Chip de Categoría */}
            {filtros.categoriaNombre && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-white text-slate-900 border border-slate-200 shadow-sm">
                <span>{filtros.categoriaNombre.toUpperCase()}</span>
                <button
                  onClick={() => seleccionarCategoria(null, null)}
                  title="Quitar filtro de categoría"
                  className="p-0.5 hover:bg-slate-200 rounded-full transition-colors text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

          </div>
        )}
      </div>

    </div>
  );
};
