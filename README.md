# SubastaYa - Frontend Web App (React + TypeScript)

Interfaz web interactiva y altamente reactiva para la plataforma SubastaYa, desarrollada con React, TypeScript, Tailwind CSS y Vite, conectada a la API mediante HTTP asíncrono y WebSockets.

---

* Módulo 1: Catálogo y Búsqueda: Filtros dinámicos por estado (Activa, Próxima, Finalizada), categoría, rangos de precio y contadores regresivos en tiempo real.
* Módulo 2: Creación de Subastas: Formulario interactivo con validaciones temporales y paramétricas.
* Módulo 3: Sala en Vivo (Live Bidding Room): Sincronización en vivo vía SignalR (WebSockets), reloj crítico anti-sniping, historial cronológico e indicadores dinámicos (`LIDERANDO` / `SUPERADO`).
* Módulo 4: Billetera Virtual: Visualización atómica de Saldo Total, Retenido en Garantía (Escrow) y Disponible, junto a la simulación de recargas.
* Módulo 5: Mis Actividades: Pestaña unificada de "Mis Publicaciones" y "Mis Ofertas" optimizada mediante caché en `sessionStorage` e IDs paginados en dos pasos.

---

## Tecnologías Utilizadas

* Framework: React 18
* **Lenguaje: TypeScript
* Tooling & Build: Vite
* Estilos: Tailwind CSS
* Iconografía: Lucide React
* Comunicación en Tiempo Real: signalr

---

1. Requisitos Previos
* Node.js

2. Instalación de Dependencias
Abrir la terminal en la raíz del proyecto frontend y ejecutar:

npm install
npm.cmd install @microsoft/signalr
npm.cmd install react-router-dom lucide-react

3. Ejecutar la aplicación con: npm.cmd run build 
                               npm.cmd run dev
                               o + intro (para lanzar en el navegador)