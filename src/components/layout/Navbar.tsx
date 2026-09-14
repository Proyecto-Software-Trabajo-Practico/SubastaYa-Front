/*
  Barra de navegación principal (Navbar) para SubastaYa.
  Gestiona la navegación SPA, la visualización del saldo en vivo y el cambio de usuario de prueba.
*/

import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Gavel, Wallet, PlusCircle, RefreshCw, UserCheck, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const { usuarioActual, usuariosDisponibles, saldos, cargandoSaldos, cambiarUsuario, actualizarSaldos } = useAuth();

  // Clase helper para estilizar los enlaces activos en la navegación
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive 
        ? 'bg-blue-600 text-white' 
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo institucional */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="p-2 bg-blue-600 rounded-lg text-white group-hover:bg-blue-500 transition-colors">
                <Gavel className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-white">SubastaYa</span>
                <span className="text-xs block text-slate-400 font-mono">v1.0 • TP Software</span>
              </div>
            </Link>

            {/* Enlaces de navegación */}
            <nav className="hidden md:flex items-center gap-2">
              <NavLink to="/" className={navLinkClass} end>
                <Gavel className="w-4 h-4" />
                Catálogo
              </NavLink>
              <NavLink to="/billetera" className={navLinkClass}>
                <Wallet className="w-4 h-4" />
                Billetera
              </NavLink>
              <NavLink to="/publicar" className={navLinkClass}>
                <PlusCircle className="w-4 h-4" />
                Publicar Subasta
              </NavLink>
              <NavLink to="/actividades" className={navLinkClass}>
                <Activity className="w-4 h-4" />
                Mis Actividades
              </NavLink>
            </nav>
          </div>

          {/* Área de Usuario y Saldo */}
          <div className="flex items-center gap-4">
            
            {/* Widget de Saldo en Billetera */}
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-lg text-sm">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <div className="flex flex-col text-right">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold leading-none">
                  Disponible
                </span>
                <span className="font-mono font-bold text-emerald-400 leading-tight">
                  {saldos !== null
                    ? `$ ${saldos.saldoDisponible.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                    : '$ 0,00'}
                </span>
              </div>

              {/* Botón para refrescar saldo manualmente */}
              <button
                onClick={() => actualizarSaldos()}
                disabled={cargandoSaldos}
                title="Actualizar saldo desde el backend"
                className="ml-1 p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${cargandoSaldos ? 'animate-spin text-blue-400' : ''}`} />
              </button>
            </div>

            {/* Selector de Usuario Activo para Testing Ágil */}
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg">
              <UserCheck className="w-4 h-4 text-blue-400" />
              <div className="flex flex-col">
                <select
                  value={usuarioActual.id}
                  onChange={(e) => cambiarUsuario(Number(e.target.value))}
                  className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
                >
                  {usuariosDisponibles.map((u) => (
                    <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                      {u.nombre} ({u.rol})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 leading-none">
                  ID: {usuarioActual.id}
                </span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
