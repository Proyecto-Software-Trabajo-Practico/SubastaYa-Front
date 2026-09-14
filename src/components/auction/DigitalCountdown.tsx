/*
  Componente de Reloj Digital LED (DigitalCountdown.tsx).
  Responsabilidad Única (SRP):
  - Calcula la cuenta regresiva en segundos a partir de FechaFin.
  - Renderizado estilo display LED: fondo negro con números blancos.
  - Regla de Negocio Anti-Sniping: si resta menos de 1 minuto (< 60s), 
    las letras cambian a rojo parpadeante (alerta visual de zona crítica).
*/

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface DigitalCountdownProps {
  fechaFin: string | Date;
  onFinalizada?: () => void;
}

export const DigitalCountdown: React.FC<DigitalCountdownProps> = ({ fechaFin, onFinalizada }) => {
  const [tiempoRestanteMs, setTiempoRestanteMs] = useState<number>(0);
  const [esFinalizada, setEsFinalizada] = useState<boolean>(false);

  useEffect(() => {
    const calcularRestante = () => {
      const fin = new Date(fechaFin).getTime();
      const ahora = new Date().getTime();
      const diferencia = fin - ahora;

      if (diferencia <= 0) {
        setTiempoRestanteMs(0);
        setEsFinalizada(true);
        if (onFinalizada) onFinalizada();
      } else {
        setTiempoRestanteMs(diferencia);
        setEsFinalizada(false);
      }
    };

    // Cálculo inicial inmediato
    calcularRestante();

    // Ticker que se ejecuta cada 1 segundo (1000ms)
    const intervalo = setInterval(calcularRestante, 1000);

    return () => clearInterval(intervalo);
  }, [fechaFin, onFinalizada]);

  // Conversión matemática de milisegundos a Días, Horas, Minutos y Segundos
  const totalSegundos = Math.floor(tiempoRestanteMs / 1000);
  const dias = Math.floor(totalSegundos / 86400);
  const horas = Math.floor((totalSegundos % 86400) / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  const segundos = totalSegundos % 60;

  // Formato digital con dos dígitos con ceros a la izquierda (ej. 00:01:08)
  const formatearDosDigitos = (valor: number) => String(valor).padStart(2, '0');

  // Si hay días restantes, mostramos "02d 05:12:30". Si falta menos de un día: "05:12:30"
  const textoTiempo = esFinalizada
    ? '00:00:00'
    : dias > 0
    ? `${dias}d ${formatearDosDigitos(horas)}:${formatearDosDigitos(minutos)}:${formatearDosDigitos(segundos)}`
    : `${formatearDosDigitos(horas)}:${formatearDosDigitos(minutos)}:${formatearDosDigitos(segundos)}`;

  // Regla solicitada: Zona crítica cuando resta menos de 1 minuto (< 60 segundos)
  const esZonaCritica = !esFinalizada && totalSegundos < 60;

  return (
    <div className="flex flex-col items-center">
      {/* Etiqueta superior del reloj */}
      <div className="bg-slate-800 border border-slate-700 px-3 py-0.5 rounded-t-md text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
        <Clock className={`w-3.5 h-3.5 ${esZonaCritica ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
        Tiempo Restante
      </div>

      {/* Pantalla digital tipo LED: Fondo negro con bisel */}
      <div className="bg-black border-2 border-slate-800 rounded-lg px-5 py-2.5 shadow-2xl flex items-center justify-center min-w-[200px]">
        <span
          className={`font-mono text-3xl sm:text-4xl font-extrabold tracking-widest transition-colors ${
            esFinalizada
              ? 'text-slate-600'
              : esZonaCritica
              ? 'text-red-500 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]' // Zona crítica < 1min: Letras rojas con brillo
              : 'text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]' // Tiempo normal: Letras blancas
          }`}
        >
          {textoTiempo}
        </span>
      </div>

      {/* Indicador de estado para la cátedra */}
      {esZonaCritica && (
        <span className="text-[10px] font-bold text-red-400 mt-1 uppercase tracking-wider animate-bounce">
          ¡Zona Crítica Anti-Sniping!
        </span>
      )}
      {esFinalizada && (
        <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
          Subasta Cerrada
        </span>
      )}
    </div>
  );
};
