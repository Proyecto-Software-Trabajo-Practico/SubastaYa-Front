import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { CatalogPage } from './pages/CatalogPage';
import { ActivitiesPage } from './pages/ActivitiesPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { WalletPage } from './pages/WalletPage';
import { CreateAuctionPage } from './pages/CreateAuctionPage';
import { LiveAuctionPage } from './pages/LiveAuctionPage';

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
                    <WalletPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/publicar"
                element={
                  <PrivateRoute>
                    <CreateAuctionPage />
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
                    <LiveAuctionPage />
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