/*
  Componente raíz de SubastaYa (App.tsx).
  Configura el proveedor de autenticación y el enrutador SPA.
*/

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { CatalogPage } from './pages/CatalogPage';
import { ActivitiesPage } from './pages/ActivitiesPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
          {/* Cabecera persistente */}
          <Navbar />

          {/* Área dinámica de contenido */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/" element={<CatalogPage />} />
              <Route path="/catalogo" element={<CatalogPage />} />

              {/* Rutas placeholder que conectaremos en las siguientes sesiones */}
              <Route
                path="/billetera"
                element={
                  <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center max-w-lg mx-auto mt-12">
                    <h2 className="text-xl font-bold text-white mb-2">Módulo 4: Billetera Virtual</h2>
                    <p className="text-sm text-slate-400">
                      Esta sección se conectará mañana con los endpoints de depósitos (<code>POST /api/billeteras/{'{id}'}/depositos</code>) y transacciones del ledger.
                    </p>
                  </div>
                }
              />
              <Route
                path="/publicar"
                element={
                  <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center max-w-lg mx-auto mt-12">
                    <h2 className="text-xl font-bold text-white mb-2">Módulo 2: Publicar Subasta</h2>
                    <p className="text-sm text-slate-400">
                      Formulario para dar de alta subastas con validación de precio base, incremento mínimo y fecha de cierre (<code>POST /api/subastas</code>).
                    </p>
                  </div>
                }
              />
              <Route path="/actividades" element={<ActivitiesPage />} />
              <Route
                path="/subastas/:id"
                element={
                  <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center max-w-lg mx-auto mt-12 space-y-3">
                    <h2 className="text-xl font-bold text-white">Módulo 3: Sala de Subasta en Vivo</h2>
                    <p className="text-sm text-slate-400">
                      ¡Acá se abrirá la consola de oferta interactiva con validación de saldo Escrow, estados <i>Liderando / Superado</i> y toasts!
                    </p>
                    <button
                      onClick={() => window.history.back()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors mt-2"
                    >
                      ← Volver al Catálogo
                    </button>
                  </div>
                }
              />
            </Routes>
          </main>

          {/* Pie de página persistente */}
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
