/*
  Componente Consola de Puja Dinámica (src/components/auction/BidConsole.tsx).
  Responsabilidad Única (SRP):
  - Gestiona la entrada de ofertas numéricas (atajos porcentuales vs personalizada libre).
  - Exhibe indicadores visuales de liderazgo (Liderando / Superado / Vendedor).
  - Permite ofertas agresivas superiores (ej. $1.000.000) sin restricciones artificiales de step.
*/

import React, { useState, useEffect } from 'react';
import { Gavel, TrendingUp, Coins, Lock, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';

interface BidConsoleProps {
  precioActual: number;
  incrementoMinimo: number;
  precioBase: number;
  cantidadPujas: number;
  saldoDisponible: number;
  esLider: boolean;
  fueSuperado: boolean;
  esVendedor: boolean;
  finalizada: boolean;
  enviando: boolean;
  onPujar: (monto: number) => Promise<void>;
  onIntentoBloqueado: (motivo: 'lider' | 'vendedor') => void;
}

export const BidConsole: React.FC<BidConsoleProps> = ({
  precioActual,
  incrementoMinimo,
  precioBase,
  cantidadPujas,
  saldoDisponible,
  esLider,
  fueSuperado,
  esVendedor,
  finalizada,
  enviando,
  onPujar,
  onIntentoBloqueado,
}) => {
  // Próxima oferta mínima obligatoria por regla de negocio
  const proximaPujaMinima = cantidadPujas === 0 ? precioBase : precioActual + incrementoMinimo;

  const [montoPersonalizado, setMontoPersonalizado] = useState<number>(proximaPujaMinima);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  // Sincroniza el monto inicial cuando cambia la subasta o llega una nueva oferta por SignalR
  useEffect(() => {
    setMontoPersonalizado(proximaPujaMinima);
    setErrorLocal(null);
  }, [proximaPujaMinima]);

  // Cálculo de atajos rápidos porcentuales (+5%, +10%, +15%)
  const calcularAtajo = (porcentaje: number) => {
    if (finalizada || esLider || esVendedor) return;

    // Calcula el porcentaje sobre el precio actual redondeado a miles
    const aumentoPorcentual = Math.round((precioActual * porcentaje) / 1000) * 1000;
    // Nos aseguramos de que el aumento sea como mínimo el incremento obligatorio
    const aumentoFinal = Math.max(aumentoPorcentual, incrementoMinimo);
    const nuevoTotal = precioActual + aumentoFinal;

    setMontoPersonalizado(nuevoTotal);
    setErrorLocal(null);
  };

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (finalizada) return;

    if (esLider) {
      onIntentoBloqueado('lider');
      return;
    }

    if (esVendedor) {
      onIntentoBloqueado('vendedor');
      return;
    }

    if (montoPersonalizado < proximaPujaMinima) {
      setErrorLocal(`La oferta mínima debe ser de al menos $ ${proximaPujaMinima.toLocaleString('es-AR')}`);
      return;
    }

    if (montoPersonalizado > saldoDisponible) {
      setErrorLocal('Tu saldo disponible no alcanza para cubrir esta retención Escrow.');
      return;
    }

    setErrorLocal(null);
    await onPujar(montoPersonalizado);
  };

  const botonInhabilitado = esLider || esVendedor || finalizada || enviando;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Cabecera de Estado y Precio Actual */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Precio Actual</span>
          <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-400">
            $ {precioActual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Incremento mínimo: +$ {incrementoMinimo.toLocaleString('es-AR')}
          </span>
        </div>

        {/* Badges de Liderazgo o Fair Play */}
        <div className="flex sm:flex-col items-start sm:items-end gap-2">
          {finalizada ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
              Subasta Finalizada
            </span>
          ) : esLider ? (
            <span className="px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-4 h-4" />
              ¡Estás Liderando!
            </span>
          ) : fueSuperado ? (
            <span className="px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1.5 animate-pulse">
              <AlertCircle className="w-4 h-4" />
              ¡Fuiste Superado!
            </span>
          ) : esVendedor ? (
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1.5">
              <Lock className="w-4 h-4" />
              Eres el Vendedor
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Abierta a ofertas
            </span>
          )}
        </div>
      </div>

      {/* Formulario de Oferta */}
      <form onSubmit={manejarEnvio} className="space-y-4">
        {/* Atajos de Incremento Porcentual */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Atajos Rápidos de Oferta
          </label>
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <button
              type="button"
              disabled={botonInhabilitado}
              onClick={() => calcularAtajo(0.05)}
              className="py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl text-xs sm:text-sm font-bold text-blue-400 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              + 5%
            </button>
            <button
              type="button"
              disabled={botonInhabilitado}
              onClick={() => calcularAtajo(0.10)}
              className="py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl text-xs sm:text-sm font-bold text-emerald-400 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              + 10%
            </button>
            <button
              type="button"
              disabled={botonInhabilitado}
              onClick={() => calcularAtajo(0.15)}
              className="py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl text-xs sm:text-sm font-bold text-amber-400 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              + 15%
            </button>
          </div>
        </div>

        {/* Input de Monto Libre */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Tu Oferta (Monto Total a Pagar)
            </label>
            <span className="text-xs font-mono text-slate-400">
              Mínimo: $ {proximaPujaMinima.toLocaleString('es-AR')}
            </span>
          </div>

          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold font-mono">$</span>
            <input
              type="number"
              disabled={botonInhabilitado}
              value={montoPersonalizado || ''}
              onChange={(e) => {
                const val = Number(e.target.value);
                setMontoPersonalizado(val);
                if (val >= proximaPujaMinima) setErrorLocal(null);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-3 text-white font-mono text-lg font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            />
          </div>

          {errorLocal && (
            <p className="mt-2 text-xs font-semibold text-rose-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errorLocal}
            </p>
          )}
        </div>

        {/* Botón de Acción Principal */}
        <div className="w-full">
          <button
            type={botonInhabilitado ? 'button' : 'submit'}
            onClick={(e) => {
              if (esLider) {
                e.preventDefault();
                onIntentoBloqueado('lider');
              } else if (esVendedor) {
                e.preventDefault();
                onIntentoBloqueado('vendedor');
              }
            }}
            disabled={finalizada || enviando}
            aria-disabled={botonInhabilitado}
            className={`w-full py-4 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all ${
              finalizada || enviando
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                : esLider || esVendedor
                ? 'bg-slate-800/90 text-slate-400 border border-slate-700/80 hover:border-purple-500/50 cursor-pointer'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/30 hover:shadow-blue-900/50 cursor-pointer active:scale-[0.99]'
            }`}
          >
            {enviando ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enviando oferta...
              </>
            ) : esLider ? (
              <>
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Ya eres el postor líder
              </>
            ) : esVendedor ? (
              <>
                <Lock className="w-5 h-5 text-purple-400" />
                No puedes ofertar en tu subasta
              </>
            ) : finalizada ? (
              'Subasta cerrada'
            ) : (
              <>
                <Gavel className="w-5 h-5" />
                Confirmar Puja por $ {montoPersonalizado.toLocaleString('es-AR')}
              </>
            )}
          </button>
        </div>

        {/* Información del Saldo Disponible en Billetera */}
        <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80">
          <span className="flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            Saldo Disponible en Billetera:
          </span>
          <span className="font-mono font-bold text-slate-200">
            $ {saldoDisponible.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </form>
    </div>
  );
};
