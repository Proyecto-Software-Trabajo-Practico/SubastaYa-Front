/*
  Página de Mis Actividades (ActivitiesPage).
  Corresponde al Módulo 5 del TP.
  Permite al usuario consultar:
  1. "Mis Publicaciones" (como Vendedor): GET /api/subastas?vendedorId={id}
  2. "Mis Ofertas" (como Comprador): historial de subastas donde el usuario ofertó.
*/

import React, { useState } from 'react';
import { Activity, Package, History } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ActivitiesPage: React.FC = () => {
  const { usuarioActual } = useAuth();
  const [tabActiva, setTabActiva] = useState<'publicaciones' | 'pujas'>('publicaciones');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Cabecera de la sección */}
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

        {/* Pestañas de alternancia (Vendedor vs Comprador) */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setTabActiva('publicaciones')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              tabActiva === 'publicaciones'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            Mis Publicaciones
          </button>
          <button
            onClick={() => setTabActiva('pujas')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              tabActiva === 'pujas'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            Mis Ofertas
          </button>
        </div>
      </div>

      {/* Contenedor de contenido según pestaña activa */}
      {tabActiva === 'publicaciones' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl w-fit mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">Subastas creadas por {usuarioActual.nombre}</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Aquí se listarán las subastas activas y cerradas que publicaste, consumiendo el endpoint{' '}
            <code className="text-blue-300 font-mono text-xs bg-slate-800 px-1.5 py-0.5 rounded">
              GET /api/subastas?vendedorId={usuarioActual.id}
            </code>.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl w-fit mx-auto">
            <History className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">Historial de ofertas de {usuarioActual.nombre}</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Aquí podrás hacer seguimiento de las subastas en las que estás liderando o fuiste superado (*outbid*).
          </p>
        </div>
      )}
    </div>
  );
};
