/*
  Componente de Historial de Ofertas (PujaHistoryList.tsx).
  Responsabilidad Única (SRP):
  - Renderiza el panel derecho del catálogo ("HISTORIAL DE PUJAS").
  - Muestra las últimas ofertas con montos formateados, fecha exacta y 
    anonimización de postores conforme a las pautas de seguridad del TP.
*/

import React from 'react';
import { History, TrendingUp, UserCheck } from 'lucide-react';

export interface PujaItem {
  id: number;
  monto: number;
  fechaPuja: string | Date;
  compradorId: number;
  compradorNombre: string;
}

interface PujaHistoryListProps {
  pujas: PujaItem[];
  cargando?: boolean;
}

export const PujaHistoryList: React.FC<PujaHistoryListProps> = ({ pujas, cargando = false }) => {
  // Función helper para anonimizar el nombre del postor (ej. "Comprador D***")
  const anonimizarNombre = (nombre: string, id: number) => {
    if (!nombre) return `Postor #${id}`;
    const partes = nombre.trim().split(' ');
    if (partes.length >= 2) {
      return `${partes[0]} ${partes[1][0]}***`;
    }
    return nombre.length > 3 ? `${nombre.substring(0, 3)}***` : `Postor #${id}`;
  };

  // Formato de hora exacta (HH:mm:ss)
  const formatearHora = (fecha: string | Date) => {
    try {
      const d = new Date(fecha);
      return d.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return '--:--:--';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col h-full shadow-lg">
      {/* Cabecera del panel */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <History className="w-4 h-4 text-blue-400" />
          Historial de Pujas
        </h3>
        <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
          {pujas.length} {pujas.length === 1 ? 'oferta' : 'ofertas'}
        </span>
      </div>

      {/* Lista de ofertas recibidas */}
      <div className="flex-1 space-y-3 overflow-y-auto max-h-[380px] pr-1">
        {cargando ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Cargando ofertas en tiempo real...
          </div>
        ) : pujas.length === 0 ? (
          <div className="text-center py-10 px-4 bg-slate-950/40 border border-slate-800/60 rounded-xl">
            <TrendingUp className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-400">Sin ofertas aún</p>
            <p className="text-xs text-slate-500 mt-1">¡Sé el primer postor en abrir la subasta!</p>
          </div>
        ) : (
          pujas.map((puja, index) => {
            const esLiderando = index === 0; // La primera del array es la puja ganadora actual
            return (
              <div
                key={puja.id || index}
                className={`p-3 rounded-xl border transition-all ${
                  esLiderando
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold flex items-center gap-1.5 text-slate-300">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    {anonimizarNombre(puja.compradorNombre, puja.compradorId)}
                  </span>
                  {esLiderando && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                      Líder Actual
                    </span>
                  )}
                </div>

                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-lg font-mono font-bold text-emerald-400">
                    $ {puja.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {formatearHora(puja.fechaPuja)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
