import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Gavel, Wallet, PlusCircle, Activity, LogOut, LogIn, UserPlus, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const { usuarioActual, isAuthenticated, saldos, logout } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive 
        ? 'bg-blue-600 text-white' 
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link to={isAuthenticated ? '/catalogo' : '/login'} className="flex items-center gap-2.5 group">
              <div className="p-2 bg-blue-600 rounded-lg text-white group-hover:bg-blue-500 transition-colors">
                <Gavel className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-white leading-tight">SubastaYa</span>
                <span className="text-[10px] text-slate-400 font-mono hidden sm:block">v1.0 • TP Software</span>
              </div>
            </Link>

            {/* Menú Desktop */}
            {isAuthenticated && (
              <nav className="hidden lg:flex items-center gap-1.5">
                <NavLink to="/catalogo" className={navLinkClass}>
                  <Gavel className="w-4 h-4 text-blue-400" />
                  <span>Catálogo</span>
                </NavLink>
                <NavLink to="/billetera" className={navLinkClass}>
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <span>Billetera</span>
                </NavLink>
                <NavLink to="/publicar" className={navLinkClass}>
                  <PlusCircle className="w-4 h-4 text-amber-400" />
                  <span>Publicar</span>
                </NavLink>
                <NavLink to="/actividades" className={navLinkClass}>
                  <Activity className="w-4 h-4 text-purple-400" />
                  <span>Mis Actividades</span>
                </NavLink>
              </nav>
            )}
          </div>

          {/* Estado de Sesión y Acciones */}
          <div className="flex items-center gap-3">
            {isAuthenticated && usuarioActual ? (
              <>
                {/* Saldo con tooltip "Saldo disponible" y puntero estándar */}
                <div
                  title="Saldo disponible"
                  className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 px-3 py-1.5 rounded-lg cursor-default transition-colors hover:bg-slate-800"
                >
                  <Wallet className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-mono font-bold text-emerald-400 text-xs sm:text-sm">
                    {saldos !== null
                      ? `$ ${saldos.saldoDisponible.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                      : '$ 0,00'}
                  </span>
                </div>

                {/* Tarjeta Usuario y Cerrar Sesión */}
                <div className="hidden sm:flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg">
                  <span className="text-xs font-semibold text-white max-w-[120px] truncate">
                    {usuarioActual.nombre}
                  </span>
                  <button
                    onClick={handleLogout}
                    title="Cerrar sesión"
                    className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>

                {/* Botón Hamburguesa */}
                <button
                  onClick={() => setMenuAbierto(!menuAbierto)}
                  className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                >
                  {menuAbierto ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
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
                  className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white font-medium px-3.5 py-1.5 rounded-lg transition"
                >
                  <UserPlus className="w-4 h-4" />
                  Registrarse
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Menú Desplegable Móvil Limpio */}
      {isAuthenticated && menuAbierto && (
        <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2">
          <NavLink
            to="/catalogo"
            onClick={() => setMenuAbierto(false)}
            className={navLinkClass}
          >
            <Gavel className="w-4 h-4 text-blue-400" />
            <span>Catálogo</span>
          </NavLink>
          <NavLink
            to="/billetera"
            onClick={() => setMenuAbierto(false)}
            className={navLinkClass}
          >
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>Billetera</span>
          </NavLink>
          <NavLink
            to="/publicar"
            onClick={() => setMenuAbierto(false)}
            className={navLinkClass}
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <span>Publicar Subasta</span>
          </NavLink>
          <NavLink
            to="/actividades"
            onClick={() => setMenuAbierto(false)}
            className={navLinkClass}
          >
            <Activity className="w-4 h-4 text-purple-400" />
            <span>Mis Actividades</span>
          </NavLink>
        </div>
      )}
    </header>
  );
};