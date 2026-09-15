/*
  Pie de página institucional (Footer) para SubastaYa.
  Muestra créditos y arquitectura de la solución académica.
*/

import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 text-xs mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-300">
            SubastaYa &copy; 2026 • Proyecto de Software
          </p>
          <p className="text-slate-500 mt-0.5">
            Clean Architecture • CQRS • Concurrencia Optimista • RESTful Nivel 2
          </p>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span>Backend: ASP.NET Core 8</span>
          <span>•</span>
          <span>Frontend: React 19 + Tailwind CSS</span>
        </div>
      </div>
    </footer>
  );
};
