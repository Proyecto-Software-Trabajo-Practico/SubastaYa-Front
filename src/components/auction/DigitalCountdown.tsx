/*
  Componente de Reloj Digital LED (DigitalCountdown.tsx).
  Responsabilidad Única (SRP):
  - Calcula la cuenta regresiva en segundos a partir de FechaFin (si es ACTIVA) 
    o FechaInicio (si es PROGRAMADA).
  - Renderizado estilo display LED: fondo negro con números blancos en una sola fila.
  - Regla de Negocio Anti-Sniping: si resta menos de 1 minuto (< 60s) en una subasta ACTIVA, 
    las letras cambian a rojo parpadeante (alerta visual de zona crítica).
  - Notifica a través de onFinalizada cuando el tiempo llega a cero para transición reactiva.
*/

import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

interface DigitalCountdownProps {
  fechaFin: string | Date;
  fechaInicio?: string | Date;
  estado?: string;
  onFinalizada?: () => void;
  onIniciada?: () => void;
}

export const DigitalCountdown: React.FC<DigitalCountdownProps> = ({
  fechaFin,
  fechaInicio,
  estado = 'ACTIVA',
  onFinalizada,
  onIniciada,
}) => {
  const [tiempoRestanteMs, setTiempoRestanteMs] = useState<number>(0);
  const [esFinalizada, setEsFinalizada] = useState<boolean>(false);
  const finalizadaNotificadaRef = useRef<boolean>(false);
  const iniciadaNotificadaRef = useRef<boolean>(false);

  // Reiniciamos los flags de notificación cuando cambian las fechas o el estado
  useEffect(() => {
    finalizadaNotificadaRef.current = false;
    iniciadaNotificadaRef.current = false;
  }, [fechaFin, fechaInicio, estado]);

  useEffect(() => {
    // Si la subasta ya viene marcada como FINALIZADA desde el backend, no calculamos cuenta regresiva
    if (estado === 'FINALIZADA') {
      setTiempoRestanteMs(0);
      setEsFinalizada(true);
      return;
    }

    /*
      Determinación de la fecha objetivo:
      - Si la subasta es PROGRAMADA, el objetivo es 'fechaInicio' (cuenta regresiva para su apertura).
      - Si la subasta es ACTIVA, el objetivo es 'fechaFin' (cuenta regresiva para el cierre del remate).
    */
    if (estado === 'PROGRAMADA' && !fechaInicio) {
      // Mientras carga el detalle, evitamos cálculos con fechas residuales o indefinidas
      return;
    }

    const fechaObjetivo = estado === 'PROGRAMADA' ? fechaInicio! : fechaFin;

    // Normaliza fechas ISO que no incluyan 'Z' para interpretarlas siempre como UTC
    const parsearFechaUtc = (fecha: string | Date): number => {
      if (fecha instanceof Date) return fecha.getTime();
      if (!fecha) return 0;
      const str = String(fecha).trim();
      if (str.includes('T') && !str.endsWith('Z') && !str.includes('+') && !str.slice(10).includes('-')) {
        return new Date(`${str}Z`).getTime();
      }
      return new Date(str).getTime();
    };

    const calcularRestante = () => {
      const objetivo = parsearFechaUtc(fechaObjetivo);
      const ahora = Date.now();
      const diferencia = objetivo - ahora;

      if (diferencia <= 0) {
        setTiempoRestanteMs(0);

        if (estado === 'PROGRAMADA') {
          // Transición reactiva de PROGRAMADA a ACTIVA
          if (!iniciadaNotificadaRef.current && onIniciada) {
            iniciadaNotificadaRef.current = true;
            onIniciada();
          }
        } else if (estado === 'ACTIVA') {
          setEsFinalizada(true);
          // Transición reactiva de ACTIVA a FINALIZADA
          if (!finalizadaNotificadaRef.current && onFinalizada) {
            finalizadaNotificadaRef.current = true;
            onFinalizada();
          }
        } else {
          setEsFinalizada(true);
        }
      } else {
        setTiempoRestanteMs(diferencia);
        setEsFinalizada(false);
      }
    };

    // Cálculo inmediato para evitar parpadeo en el primer renderizado
    calcularRestante();

    // Ticker que se ejecuta cada 1 segundo (1000ms)
    const intervalo = setInterval(calcularRestante, 1000);

    return () => clearInterval(intervalo);
  }, [fechaFin, fechaInicio, estado, onFinalizada, onIniciada]);

  // Conversión matemática de milisegundos a Días, Horas, Minutos y Segundos
  const totalSegundos = Math.floor(tiempoRestanteMs / 1000);
  const dias = Math.floor(totalSegundos / 86400);
  const horas = Math.floor((totalSegundos % 86400) / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  const segundos = totalSegundos % 60;

  // Formato digital con dos dígitos con ceros a la izquierda (ej. 02)
  const formatearDosDigitos = (valor: number) => String(valor).padStart(2, '0');

  // Formato solicitado: "02 D 23 h 25 m 15 s"
  const textoTiempo =
    esFinalizada || estado === 'FINALIZADA'
      ? '00 D 00 h 00 m 00 s'
      : `${formatearDosDigitos(dias)} D ${formatearDosDigitos(horas)} h ${formatearDosDigitos(minutos)} m ${formatearDosDigitos(segundos)} s`;

  // Regla solicitada: Zona crítica cuando resta menos de 1 minuto (< 60 segundos) solo en subastas ACTIVAS
  const esZonaCritica = estado === 'ACTIVA' && !esFinalizada && totalSegundos < 60;

  // Etiqueta contextual según el ciclo de vida de la subasta
  const etiquetaReloj =
    estado === 'PROGRAMADA'
      ? 'Comienza en'
      : estado === 'FINALIZADA' || esFinalizada
      ? 'Subasta Finalizada'
      : 'Tiempo Restante';

  return (
    <div className="flex flex-col items-center w-full">
      {/* Etiqueta superior del reloj */}
      <div className="bg-slate-800 border border-slate-700 px-3 py-1 rounded-t-md text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
        <Clock className={`w-3.5 h-3.5 ${esZonaCritica ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
        {etiquetaReloj}
      </div>

      {/* Pantalla digital tipo LED: Fondo negro con bisel, expandido a ancho completo en una fila */}
      <div className="bg-black border-2 border-slate-800 rounded-xl px-3 sm:px-4 py-3 shadow-2xl flex items-center justify-center w-full whitespace-nowrap overflow-hidden">
        <span
          className={`font-mono text-base sm:text-lg md:text-xl font-black tracking-wider transition-colors ${
            esFinalizada || estado === 'FINALIZADA'
              ? 'text-slate-600'
              : esZonaCritica
              ? 'text-red-500 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]' // Zona crítica < 1min: Letras rojas con brillo
              : 'text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]' // Tiempo normal: Letras blancas
          }`}
        >
          {textoTiempo}
        </span>
      </div>

      {/* Indicadores contextuales de pie de reloj */}
      {esZonaCritica && (
        <span className="text-[10px] font-bold text-red-400 mt-1 uppercase tracking-wider animate-bounce">
          ¡Zona Crítica Anti-Sniping!
        </span>
      )}
      {estado !== 'PROGRAMADA' && (esFinalizada || estado === 'FINALIZADA') && (
        <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
          Subasta Cerrada
        </span>
      )}
      {estado === 'PROGRAMADA' && (
        <span className="text-[10px] font-bold text-amber-400 mt-1 uppercase tracking-wider">
          {tiempoRestanteMs <= 0 ? 'Iniciando remate...' : 'Apertura Programada'}
        </span>
      )}
    </div>
  );
};
