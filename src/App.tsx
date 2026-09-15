import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { CatalogPage } from './pages/CatalogPage';
import { ActivitiesPage } from './pages/ActivitiesPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

// Guard 1: Permite el acceso solo si hay sesión activa en estado y storage.
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const tokenStorage = localStorage.getItem('jwt_token');

  if (!isAuthenticated || !tokenStorage) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Guard 2: Solo permite el paso a invitados. Si está autenticado rebota a /catalogo.
const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const tokenStorage = localStorage.getItem('jwt_token');

  return !isAuthenticated && !tokenStorage ? <>{children}</> : <Navigate to="/catalogo" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
          <Navbar />

          <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              {/* Rutas exclusivas para invitados */}
              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <LoginPage />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/registro"
                element={
                  <PublicOnlyRoute>
                    <RegisterPage />
                  </PublicOnlyRoute>
                }
              />

              {/* Redirección de la raíz */}
              <Route path="/" element={<Navigate to="/catalogo" replace />} />

              {/* Rutas Protegidas (requieren token) */}
              <Route
                path="/catalogo"
                element={
                  <PrivateRoute>
                    <CatalogPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/billetera"
                element={
                  <PrivateRoute>
                    <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center max-w-lg mx-auto mt-12">
                      <h2 className="text-xl font-bold text-white mb-2">Módulo 4: Billetera Virtual</h2>
                      <p className="text-sm text-slate-400">
                        Esta sección se conectará con los endpoints de depósitos y transacciones del ledger.
                      </p>
                    </div>
                  </PrivateRoute>
                }
              />
              <Route
                path="/publicar"
                element={
                  <PrivateRoute>
                    <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center max-w-lg mx-auto mt-12">
                      <h2 className="text-xl font-bold text-white mb-2">Módulo 2: Publicar Subasta</h2>
                      <p className="text-sm text-slate-400">
                        Formulario para dar de alta subastas con validaciones de negocio.
                      </p>
                    </div>
                  </PrivateRoute>
                }
              />
              <Route
                path="/actividades"
                element={
                  <PrivateRoute>
                    <ActivitiesPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/subastas/:id"
                element={
                  <PrivateRoute>
                    <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center max-w-lg mx-auto mt-12 space-y-3">
                      <h2 className="text-xl font-bold text-white">Módulo 3: Sala de Subasta en Vivo</h2>
                      <button
                        onClick={() => window.history.back()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors mt-2"
                      >
                        ← Volver al Catálogo
                      </button>
                    </div>
                  </PrivateRoute>
                }
              />

              {/* Catch-all: Redirige cualquier URL inexistente al catálogo */}
              <Route path="*" element={<Navigate to="/catalogo" replace />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;