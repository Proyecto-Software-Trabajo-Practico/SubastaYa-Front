/*
  Componente Toast y gestor de notificaciones flotantes (src/components/common/Toast.tsx).
  Responsabilidad Única (SRP):
  - Renderiza mensajes contextuales temporales que se auto-desvanecen a los 3.5 segundos.
  - Aplica paletas cromáticas según el tipo de evento: éxito (verde), error/conflicto 409 (rojo),
    bloqueo de fair play (violeta) y extensión anti-sniping (azul).
*/

import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, ShieldAlert, X } from 'lucide-react';

export type ToastTipo = 'exito' | 'error' | 'advertencia' | 'info' | 'bloqueo';

export interface ToastItem {
  id: string;
  mensaje: string;
  tipo: ToastTipo;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onCerrar: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onCerrar }) => {
  if (toasts.length === 0) return null;

  return (
    <aside
      aria-label="Notificaciones del sistema"
      className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        // Estilos y paletas según el tipo de alerta acordada
        let estilos = 'bg-slate-900 border-slate-700 text-white';
        let Icono = Info;

        switch (toast.tipo) {
          case 'exito':
            estilos = 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200 shadow-emerald-950/50';
            Icono = CheckCircle2;
            break;
          case 'error':
            estilos = 'bg-rose-950/90 border-rose-500/50 text-rose-200 shadow-rose-950/50';
            Icono = AlertCircle;
            break;
          case 'advertencia':
            estilos = 'bg-amber-950/90 border-amber-500/50 text-amber-200 shadow-amber-950/50';
            Icono = AlertTriangle;
            break;
          case 'info':
            estilos = 'bg-blue-950/90 border-blue-500/50 text-blue-200 shadow-blue-950/50';
            Icono = Info;
            break;
          case 'bloqueo':
            // Alerta especial en color violeta para fair-play (líder / vendedor)
            estilos = 'bg-purple-950/90 border-purple-500/50 text-purple-200 shadow-purple-950/50';
            Icono = ShieldAlert;
            break;
        }

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border backdrop-blur-md shadow-xl transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${estilos}`}
          >
            <Icono className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm font-medium flex-1 leading-snug">{toast.mensaje}</p>
            <button
              onClick={() => onCerrar(toast.id)}
              className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
              aria-label="Cerrar notificación"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </aside>
  );
};
