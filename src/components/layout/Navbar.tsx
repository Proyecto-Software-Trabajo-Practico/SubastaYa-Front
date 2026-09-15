import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Gavel, Wallet, PlusCircle, RefreshCw, Activity, LogOut, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const { usuarioActual, isAuthenticated, saldos, cargandoSaldos, logout, actualizarSaldos } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
          
          {/* Logo e Ítemes navegables solo para usuarios autenticados */}
          <div className="flex items-center gap-8">
            <Link to={isAuthenticated ? '/catalogo' : '/login'} className="flex items-center gap-2 group">
              <div className="p-2 bg-blue-600 rounded-lg text-white group-hover:bg-blue-500 transition-colors">
                <Gavel className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-white">SubastaYa</span>
                <span className="text-xs block text-slate-400 font-mono">v1.0 • TP Software</span>
              </div>
            </Link>

            {/* Los botones solo aparecen si el usuario inició sesión */}
            {isAuthenticated && (
              <nav className="hidden md:flex items-center gap-2">
                <NavLink to="/catalogo" className={navLinkClass}>
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
            )}
          </div>

          {/* Estado de Sesión */}
          <div className="flex items-center gap-4">
            {isAuthenticated && usuarioActual ? (
              <>
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

                  <button
                    onClick={() => actualizarSaldos()}
                    disabled={cargandoSaldos}
                    title="Actualizar saldo desde el backend"
                    className="ml-1 p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${cargandoSaldos ? 'animate-spin text-blue-400' : ''}`} />
                  </button>
                </div>

                <div className="flex items-center gap-3 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg">
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-white leading-tight">
                      {usuarioActual.nombre}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono leading-none">
                      {usuarioActual.email}
                    </span>
                  </div>

                  <button
                    onClick={handleLogout}
                    title="Cerrar sesión"
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded transition-colors ml-1"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition"
                >
                  <LogIn className="w-4 h-4 text-blue-400" />
                  Ingresar
                </Link>
                <Link
                  to="/registro"
                  className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white font-medium px-3.5 py-1.5 rounded-lg transition shadow-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  Registrarse
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};