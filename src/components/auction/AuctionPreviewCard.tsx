/*
  Componente visual: AuctionPreviewCard.
  Principio SRP (Single Responsibility Principle): Este componente tiene la única
  responsabilidad de renderizar la tarjeta de previsualización en tiempo real de la subasta,
  mostrando cómo la verán los postores en el catálogo antes de que sea publicada.
*/

import React from 'react';
import { Tag, DollarSign, TrendingUp, Clock, Image as ImageIcon, Sparkles } from 'lucide-react';

export interface AuctionPreviewProps {
  titulo: string;
  categoriaNombre?: string;
  descripcion: string;
  precioBase: number;
  incrementoMinimo: number;
  fechaInicio: string;
  fechaFin: string;
  urlImagen?: string | null;
  esInmediata: boolean;
}

export const AuctionPreviewCard: React.FC<AuctionPreviewProps> = ({
  titulo,
  categoriaNombre,
  descripcion,
  precioBase,
  incrementoMinimo,
  fechaFin,
  urlImagen,
  esInmediata,
}) => {
  // Cálculo amigable del tiempo estimado de duración para la vista previa
  const calcularDuracionTexto = () => {
    if (!fechaFin) return 'Sin fecha límite definida';
    const fin = new Date(fechaFin).getTime();
    const ahora = Date.now();
    const diffMs = fin - ahora;

    if (isNaN(diffMs) || diffMs <= 0) return 'Finaliza de inmediato';

    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDias = Math.floor(diffHoras / 24);

    if (diffDias > 0) {
      const horasRestantes = diffHoras % 24;
      return `${diffDias}d ${horasRestantes}h restantes`;
    }
    const diffMin = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHoras}h ${diffMin}m restantes`;
  };

  const estadoBadge = esInmediata ? 'ACTIVA' : 'PROGRAMADA';

  return (
    <div className="sticky top-24 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-sm flex flex-col justify-between space-y-5">
      {/* Cabecera del Preview con indicador en vivo */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
          <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
          <span>Vista Previa en Vivo</span>
        </div>
        <span
          className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${
            esInmediata
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}
        >
          {estadoBadge}
        </span>
      </div>

      {/* Contenedor de la Imagen con fallback estético */}
      <div className="relative w-full h-56 sm:h-64 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-center overflow-hidden group">
        {urlImagen ? (
          <img
            src={urlImagen}
            alt={titulo || 'Foto del artículo'}
            className="w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-600 space-y-2 p-6 text-center">
            <ImageIcon className="w-12 h-12 stroke-1 text-slate-700" />
            <span className="text-xs text-slate-500">Sin foto seleccionada aún</span>
            <span className="text-[10px] text-slate-600">Subí una imagen para ver la previsualización</span>
          </div>
        )}

        {/* Categoría sobreimpresa en la imagen */}
        {categoriaNombre && (
          <div className="absolute top-3 left-3 bg-slate-900/90 border border-slate-700/80 px-2.5 py-1 rounded-lg text-[11px] text-slate-300 font-medium flex items-center gap-1.5 shadow">
            <Tag className="w-3 h-3 text-blue-400" />
            <span>{categoriaNombre}</span>
          </div>
        )}
      </div>

      {/* Título y descripción */}
      <div className="space-y-1.5">
        <h3 className="text-lg font-bold text-white line-clamp-1">
          {titulo.trim() !== '' ? titulo : 'Título del producto'}
        </h3>
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {descripcion.trim() !== ''
            ? descripcion
            : 'Los detalles, estado y especificaciones técnicas de tu artículo aparecerán aquí para los compradores.'}
        </p>
      </div>

      {/* Panel de Precios e Incremento Mínimo */}
      <div className="grid grid-cols-2 gap-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5 flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-emerald-400" /> Precio Base
          </span>
          <span className="text-lg font-bold font-mono text-emerald-400">
            $ {precioBase > 0 ? precioBase.toLocaleString('es-AR', { minimumFractionDigits: 2 }) : '0,00'}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-blue-400" /> Puja Mínima
          </span>
          <span className="text-lg font-bold font-mono text-blue-400">
            +$ {incrementoMinimo > 0 ? incrementoMinimo.toLocaleString('es-AR', { minimumFractionDigits: 2 }) : '0,00'}
          </span>
        </div>
      </div>

      {/* Reloj LED de vista previa */}
      <div className="bg-black/80 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center justify-between font-mono text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <span className="text-slate-400">Cierre estimado:</span>
        </div>
        <span className="font-bold text-white tracking-wide">{calcularDuracionTexto()}</span>
      </div>
    </div>
  );
};
