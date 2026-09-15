/*
  Página principal del Catálogo de Subastas (CatalogPage.tsx).
  Implementa el diseño estilo "Spotlight en Vivo" propuesto en draw.io:
  - Columna Izquierda: Filtros dinámicos con chips descartables y caja de Descripción técnica.
  - Columna Central: Carrusel interactivo para recorrer subastas con botón "PUJAR!" hacia la Sala en Vivo.
  - Columna Derecha: Reloj Digital LED (fondo negro/letras blancas/rojo < 1min) e Historial de Pujas en tiempo real.
*/

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { httpClient } from '../API/httpClient';
import { DigitalCountdown } from '../components/auction/DigitalCountdown';
import { PujaHistoryList, type PujaItem } from '../components/auction/PujaHistoryList';
import { AuctionFilters, type FiltrosSubasta } from '../components/auction/AuctionFilters';
import { ChevronLeft, ChevronRight, Gavel, Tag, DollarSign, Layers, AlertCircle, Sparkles } from 'lucide-react';

// DTO del catálogo resumido (SubastaCardDTO)
interface SubastaCard {
  id: number;
  titulo: string;
  urlImagen: string | null;
  estado: string;
  precioBase: number;
  precioActual: number;
  cantidadPujas: number;
  fechaFin: string;
  categoriaId: number;
  categoriaNombre: string;
}

// DTO de detalle completo (SubastaDetalleDTO)
interface SubastaDetalle extends SubastaCard {
  descripcion: string;
  incrementoMinimo: number;
  fechaInicio: string;
  vendedorId: number;
  vendedorNombre: string;
  ultimasPujas: PujaItem[];
}

interface Categoria {
  id: number;
  nombre: string;
}

interface ResultadoPaginado<T> {
  items: T[];
  totalItems: number;
  pagina: number;
  tamanoPagina: number;
  totalPaginas: number;
}

// Subastas vinculadas directamente a los 14 archivos reales en public/imagenes/
const SUBASTAS_DEMO: SubastaDetalle[] = [
  {
    id: 101,
    titulo: 'Juegos de Mesa Clásicos - Edición Madera',
    descripcion: 'Tablero artesanal plegable con estuche organizador, piezas completas de damas, ajedrez y dominó en excelente estado de conservación.',
    urlImagen: '/imagenes/juegos%20de%20mesa.png',
    estado: 'ACTIVA',
    precioBase: 85000,
    precioActual: 120000,
    incrementoMinimo: 5000,
    cantidadPujas: 3,
    fechaInicio: new Date().toISOString(),
    fechaFin: new Date(Date.now() + 1000 * 60 * 8).toISOString(), // Vence en 8 min
    categoriaId: 1,
    categoriaNombre: 'Juegos y Coleccionables',
    vendedorId: 1,
    vendedorNombre: 'Vendedor Demo',
    ultimasPujas: [
      { id: 1, monto: 120000, fechaPuja: new Date(Date.now() - 1000 * 45).toISOString(), compradorId: 2, compradorNombre: 'Comprador Demo' },
      { id: 2, monto: 105000, fechaPuja: new Date(Date.now() - 1000 * 180).toISOString(), compradorId: 3, compradorNombre: 'Lucas V.' },
    ],
  },
  {
    id: 102,
    titulo: 'Juego de Mesa y Sillas de Roble Macizo',
    descripcion: 'Mesa de comedor de roble para 6 personas con juego de 4 sillas de madera maciza, lustre satinado y ensambles reforzados.',
    urlImagen: '/imagenes/juego%20de%20mesa%20de%20roble.png',
    estado: 'ACTIVA',
    precioBase: 280000,
    precioActual: 340000,
    incrementoMinimo: 10000,
    cantidadPujas: 4,
    fechaInicio: new Date().toISOString(),
    fechaFin: new Date(Date.now() + 1000 * 42).toISOString(), // ¡Vence en 42 segundos! (Zona Crítica Roja)
    categoriaId: 2,
    categoriaNombre: 'Hogar y Muebles',
    vendedorId: 1,
    vendedorNombre: 'Vendedor Demo',
    ultimasPujas: [
      { id: 3, monto: 340000, fechaPuja: new Date(Date.now() - 1000 * 15).toISOString(), compradorId: 4, compradorNombre: 'Ana R.' },
      { id: 4, monto: 320000, fechaPuja: new Date(Date.now() - 1000 * 70).toISOString(), compradorId: 2, compradorNombre: 'Comprador Demo' },
    ],
  },
  {
    id: 103,
    titulo: 'Lote de Herramientas de Mano en Maletín Organizador',
    descripcion: 'Kit completo de taller que incluye martillo, llaves ajustables, destornilladores magnéticos, pinzas y alicates con maletín rígido.',
    urlImagen: '/imagenes/lote%20de%20herramientas%20de%20mano.png',
    estado: 'ACTIVA',
    precioBase: 95000,
    precioActual: 140000,
    incrementoMinimo: 5000,
    cantidadPujas: 5,
    fechaInicio: new Date().toISOString(),
    fechaFin: new Date(Date.now() + 1000 * 60 * 12).toISOString(),
    categoriaId: 4,
    categoriaNombre: 'Herramientas y Taller',
    vendedorId: 1,
    vendedorNombre: 'Vendedor Demo',
    ultimasPujas: [
      { id: 5, monto: 140000, fechaPuja: new Date(Date.now() - 1000 * 25).toISOString(), compradorId: 5, compradorNombre: 'Rodrigo P.' },
    ],
  },
  {
    id: 104,
    titulo: 'Lote de Herramientas Varias y Bocallaves de Precisión',
    descripcion: 'Set profesional de tubos hexagonales, crique de 1/2 pulgada y llaves combinadas en acero cromo vanadio en maletín organizador.',
    urlImagen: '/imagenes/lote%20de%20herramientas%20varias.png',
    estado: 'ACTIVA',
    precioBase: 130000,
    precioActual: 175000,
    incrementoMinimo: 5000,
    cantidadPujas: 2,
    fechaInicio: new Date().toISOString(),
    fechaFin: new Date(Date.now() + 1000 * 60 * 25).toISOString(),
    categoriaId: 4,
    categoriaNombre: 'Herramientas y Taller',
    vendedorId: 1,
    vendedorNombre: 'Vendedor Demo',
    ultimasPujas: [
      { id: 6, monto: 175000, fechaPuja: new Date(Date.now() - 1000 * 50).toISOString(), compradorId: 2, compradorNombre: 'Comprador Demo' },
    ],
  },
  {
    id: 105,
    titulo: 'Lote de Taladros a Batería Inalámbricos con Accesorios',
    descripcion: 'Taladro percutor de 18V con doble batería de litio, cargador rápido de base y valija con brocas para hormigón y metal.',
    urlImagen: '/imagenes/lote%20de%20taladros%20a%20bateria.png',
    estado: 'PROGRAMADA',
    precioBase: 160000,
    precioActual: 160000,
    incrementoMinimo: 10000,
    cantidadPujas: 0,
    fechaInicio: new Date(Date.now() + 1000 * 3600 * 24).toISOString(),
    fechaFin: new Date(Date.now() + 1000 * 3600 * 24 * 3 + 1000 * 3600 * 7 + 1000 * 60 * 14).toISOString(), // 3 días y 7 horas
    categoriaId: 4,
    categoriaNombre: 'Herramientas y Taller',
    vendedorId: 1,
    vendedorNombre: 'Vendedor Demo',
    ultimasPujas: [],
  },
  {
    id: 106,
    titulo: 'Lote de Notebooks Gamer Acer Nitro 5',
    descripcion: 'Equipo portátil gamer con pantalla de 144Hz, procesador de alta potencia, placa de video NVIDIA GeForce y teclado retroiluminado.',
    urlImagen: '/imagenes/lote%20de%20notebooks%20ACER.png',
    estado: 'ACTIVA',
    precioBase: 950000,
    precioActual: 1250000,
    incrementoMinimo: 25000,
    cantidadPujas: 6,
    fechaInicio: new Date().toISOString(),
    fechaFin: new Date(Date.now() + 1000 * 60 * 18).toISOString(),
    categoriaId: 3,
    categoriaNombre: 'Tecnología',
    vendedorId: 1,
    vendedorNombre: 'Vendedor Demo',
    ultimasPujas: [
      { id: 8, monto: 1250000, fechaPuja: new Date(Date.now() - 1000 * 12).toISOString(), compradorId: 2, compradorNombre: 'Comprador Demo' },
    ],
  },
  {
    id: 107,
    titulo: 'Lote de Notebooks Ultralivianas AMD Ryzen 7',
    descripcion: 'Laptop moderna de chasis plateado con microprocesador AMD Ryzen 7, 16GB de memoria RAM y disco SSD NVMe de arranque instantáneo.',
    urlImagen: '/imagenes/lote%20de%20notebooks%20AMD%20R7.png',
    estado: 'ACTIVA',
    precioBase: 780000,
    precioActual: 890000,
    incrementoMinimo: 15000,
    cantidadPujas: 4,
    fechaInicio: new Date().toISOString(),
    fechaFin: new Date(Date.now() + 1000 * 60 * 35).toISOString(),
    categoriaId: 3,
    categoriaNombre: 'Tecnología',
    vendedorId: 1,
    vendedorNombre: 'Vendedor Demo',
    ultimasPujas: [
      { id: 9, monto: 890000, fechaPuja: new Date(Date.now() - 1000 * 60).toISOString(), compradorId: 7, compradorNombre: 'Mariano B.' },
    ],
  },
  {
    id: 108,
    titulo: 'Lote Mueble Bajo Mesada de Cocina en Madera Maciza',
    descripcion: 'Mueble esquinero para cocina con puertas, cajoneras con correderas metálicas y bacha integrada con grifería monocomando.',
    urlImagen: '/imagenes/lote%20de%20mueble%20cocina.png',
    estado: 'ACTIVA',
    precioBase: 190000,
    precioActual: 245000,
    incrementoMinimo: 10000,
    cantidadPujas: 2,
    fechaInicio: new Date().toISOString(),
    fechaFin: new Date(Date.now() + 1000 * 60 * 14).toISOString(),
    categoriaId: 2,
    categoriaNombre: 'Hogar y Muebles',
    vendedorId: 1,
    vendedorNombre: 'Vendedor Demo',
    ultimasPujas: [
      { id: 10, monto: 245000, fechaPuja: new Date(Date.now() - 1000 * 95).toISOString(), compradorId: 8, compradorNombre: 'Silvia M.' },
    ],
  },
  {
    id: 109,
    titulo: 'Lote de Muebles Organizadores MDF Blanco',
    descripcion: 'Ropero placard de dos puertas corredizas en melamina blanca sobre MDF con estantes regulables y barral colgador.',
    urlImagen: '/imagenes/lote%20de%20muebles%20mdf.png',
    estado: 'FINALIZADA',
    precioBase: 110000,
    precioActual: 165000,
    incrementoMinimo: 5000,
    cantidadPujas: 3,
    fechaInicio: new Date().toISOString(),
    fechaFin: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // Ya finalizada
    categoriaId: 2,
    categoriaNombre: 'Hogar y Muebles',
    vendedorId: 1,
    vendedorNombre: 'Vendedor Demo',
    ultimasPujas: [
      { id: 11, monto: 165000, fechaPuja: new Date(Date.now() - 1000 * 60 * 12).toISOString(), compradorId: 2, compradorNombre: 'Comprador Demo' },
    ],
  },
  {
    id: 110,
    titulo: 'Silla de Director Plegable en Madera y Lona Roja',
    descripcion: 'Silla plegable clásica de descanso para estudio o exteriores, estructura de madera barnizada y asiento de lona reforzada.',
    urlImagen: '/imagenes/silla.png',
    estado: 'ACTIVA',
    precioBase: 45000,
    precioActual: 62000,
    incrementoMinimo: 2000,
    cantidadPujas: 4,
    fechaInicio: new Date().toISOString(),
    fechaFin: new Date(Date.now() + 1000 * 50).toISOString(), // ¡Zona crítica roja!
    categoriaId: 2,
    categoriaNombre: 'Hogar y Muebles',
    vendedorId: 1,
    vendedorNombre: 'Vendedor Demo',
    ultimasPujas: [
      { id: 12, monto: 62000, fechaPuja: new Date(Date.now() - 1000 * 18).toISOString(), compradorId: 9, compradorNombre: 'Facundo H.' },
    ],
  },
  {
    id: 111,
    titulo: 'Lote de Focos y Luminarias LED de Exterior',
    descripcion: 'Pack de reflectores LED de 50W y 100W aptos intemperie IP65, luz blanca fría para iluminación de jardín o predio.',
    urlImagen: '/imagenes/lote%20luces%20led.png',
    estado: 'ACTIVA',
    precioBase: 70000,
    precioActual: 98000,
    incrementoMinimo: 4000,
    cantidadPujas: 3,
    fechaInicio: new Date().toISOString(),
    fechaFin: new Date(Date.now() + 1000 * 60 * 22).toISOString(),
    categoriaId: 4,
    categoriaNombre: 'Herramientas y Taller',
    vendedorId: 1,
    vendedorNombre: 'Vendedor Demo',
    ultimasPujas: [
      { id: 13, monto: 98000, fechaPuja: new Date(Date.now() - 1000 * 30).toISOString(), compradorId: 2, compradorNombre: 'Comprador Demo' },
    ],
  },
  {
    id: 112,
    titulo: 'Lote de Guantes de Trabajo y Protección Industrial',
    descripcion: 'Paquete de 50 pares de guantes de vaqueta y nitrilo reforzados para tareas de logística, soldadura y maestranza.',
    urlImagen: '/imagenes/lote%20guantes.png',
    estado: 'ACTIVA',
    precioBase: 35000,
    precioActual: 48000,
    incrementoMinimo: 2000,
    cantidadPujas: 2,
    fechaInicio: new Date().toISOString(),
    fechaFin: new Date(Date.now() + 1000 * 60 * 45).toISOString(),
    categoriaId: 4,
    categoriaNombre: 'Herramientas y Taller',
    vendedorId: 1,
    vendedorNombre: 'Vendedor Demo',
    ultimasPujas: [
      { id: 14, monto: 48000, fechaPuja: new Date(Date.now() - 1000 * 80).toISOString(), compradorId: 10, compradorNombre: 'Claudio Z.' },
    ],
  },
  {
    id: 113,
    titulo: 'Set de Perfumes y Fragancias Importadas',
    descripcion: 'Dúo de fragancias masculinas eau de parfum con notas amaderadas y especiadas en estuches originales con sello de aduana.',
    urlImagen: '/imagenes/perfume.png',
    estado: 'ACTIVA',
    precioBase: 120000,
    precioActual: 155000,
    incrementoMinimo: 5000,
    cantidadPujas: 3,
    fechaInicio: new Date().toISOString(),
    fechaFin: new Date(Date.now() + 1000 * 60 * 16).toISOString(),
    categoriaId: 1,
    categoriaNombre: 'Juegos y Coleccionables',
    vendedorId: 1,
    vendedorNombre: 'Vendedor Demo',
    ultimasPujas: [
      { id: 15, monto: 155000, fechaPuja: new Date(Date.now() - 1000 * 14).toISOString(), compradorId: 2, compradorNombre: 'Comprador Demo' },
    ],
  },
  {
    id: 114,
    titulo: 'Caja con Artículos Varios y Antigüedades de Bazar',
    descripcion: 'Lote surtido de bazar con reloj despertador antiguo de cuerda, vajilla de porcelana inglesa y piezas de orfebrería retro.',
    urlImagen: '/imagenes/caja%20varios.png',
    estado: 'FINALIZADA',
    precioBase: 50000,
    precioActual: 50000,
    incrementoMinimo: 3000,
    cantidadPujas: 0,
    fechaInicio: new Date(Date.now() - 1000 * 3600 * 48).toISOString(),
    fechaFin: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    categoriaId: 1,
    categoriaNombre: 'Juegos y Coleccionables',
    vendedorId: 1,
    vendedorNombre: 'Vendedor Demo',
    ultimasPujas: [],
  },
];

export const CatalogPage: React.FC = () => {
  const navigate = useNavigate();

  // Estados de catálogo y filtros
  const [subastas, setSubastas] = useState<SubastaCard[]>([]);
  const [indiceActual, setIndiceActual] = useState<number>(0);
  const [detalleActivo, setDetalleActivo] = useState<SubastaDetalle | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [cargandoDetalle, setCargandoDetalle] = useState<boolean>(false);
  const [usandoDemo, setUsandoDemo] = useState<boolean>(false);

  const [filtros, setFiltros] = useState<FiltrosSubasta>({
    estado: null,
    orden: null,
    categoriaId: null,
    categoriaNombre: null,
  });

  // Carga inicial de categorías desde GET /api/categorias
  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const data = await httpClient.get<Categoria[]>('/categorias');
        if (data && data.length > 0) {
          setCategorias(data);
        }
      } catch {
        // Categorías por defecto si la BD aún no las tiene cargadas
        setCategorias([
          { id: 1, nombre: 'Juegos y Coleccionables' },
          { id: 2, nombre: 'Hogar y Muebles' },
          { id: 3, nombre: 'Tecnología' },
        ]);
      }
    };
    cargarCategorias();
  }, []);

  // Consulta paginada del catálogo GET /api/subastas con filtros
  useEffect(() => {
    const cargarSubastas = async () => {
      setCargando(true);
      try {
        const params = new URLSearchParams();
        if (filtros.estado) params.set('estado', filtros.estado);
        if (filtros.orden) params.set('orden', filtros.orden);
        if (filtros.categoriaId) params.set('categoriaId', String(filtros.categoriaId));
        params.set('pagina', '1');
        params.set('tamanoPagina', '20');

        const queryStr = params.toString();
        const endpoint = `/subastas${queryStr ? `?${queryStr}` : ''}`;
        const resultado = await httpClient.get<ResultadoPaginado<SubastaCard>>(endpoint);

        if (resultado && resultado.items && resultado.items.length > 0) {
          setSubastas(resultado.items);
          setIndiceActual(0);
          setUsandoDemo(false);
        } else {
          // Si la BD no tiene subastas aún, usamos las demo para probar el diseño
          aplicarFiltrosDemo();
        }
      } catch {
        // En caso de backend apagado o sin datos, activamos demo visual
        aplicarFiltrosDemo();
      } finally {
        setCargando(false);
      }
    };

    cargarSubastas();
  }, [filtros]);

  // Aplica filtros sobre las subastas de prueba
  const aplicarFiltrosDemo = () => {
    let filtradas = [...SUBASTAS_DEMO];
    if (filtros.estado) {
      filtradas = filtradas.filter((s) => s.estado === filtros.estado);
    }
    if (filtros.categoriaId) {
      filtradas = filtradas.filter((s) => s.categoriaId === filtros.categoriaId);
    }
    if (filtros.orden === 'precio_asc') {
      filtradas.sort((a, b) => a.precioActual - b.precioActual);
    } else if (filtros.orden === 'precio_desc') {
      filtradas.sort((a, b) => b.precioActual - a.precioActual);
    } else if (filtros.orden === 'tiempo') {
      filtradas.sort((a, b) => new Date(a.fechaFin).getTime() - new Date(b.fechaFin).getTime());
    }

    setSubastas(filtradas);
    setIndiceActual(0);
    setUsandoDemo(true);
  };

  // Subasta actual visible en el carrusel
  const subastaActual = subastas[indiceActual] || null;

  // Cada vez que cambia la subasta seleccionada en el carrusel, cargamos su detalle (GET /api/subastas/{id})
  useEffect(() => {
    if (!subastaActual) {
      setDetalleActivo(null);
      return;
    }

    if (usandoDemo) {
      const demoEncontrada = SUBASTAS_DEMO.find((s) => s.id === subastaActual.id);
      setDetalleActivo(demoEncontrada || null);
      return;
    }

    const cargarDetalle = async () => {
      setCargandoDetalle(true);
      try {
        const detalle = await httpClient.get<SubastaDetalle>(`/subastas/${subastaActual.id}`);
        setDetalleActivo(detalle);
      } catch {
        // Fallback defensivo con los datos que ya tenemos del card
        setDetalleActivo({
          ...subastaActual,
          descripcion: 'Descripción no disponible.',
          incrementoMinimo: 1000,
          fechaInicio: new Date().toISOString(),
          vendedorId: 1,
          vendedorNombre: 'Vendedor',
          ultimasPujas: [],
        });
      } finally {
        setCargandoDetalle(false);
      }
    };

    cargarDetalle();
  }, [subastaActual?.id, usandoDemo]);

  // Navegación del Carrusel
  const anteriorSubasta = () => {
    if (subastas.length === 0) return;
    setIndiceActual((prev) => (prev > 0 ? prev - 1 : subastas.length - 1));
  };

  const siguienteSubasta = () => {
    if (subastas.length === 0) return;
    setIndiceActual((prev) => (prev < subastas.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="space-y-6">
      
      {/* Banner discreto que avisa el origen de los datos */}
      {usandoDemo && (
        <div className="bg-blue-950/40 border border-blue-800/60 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-blue-300">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              <strong>Modo Demostración Activo:</strong> Mostrando subastas de prueba para que puedas verificar tus imágenes de <code>public/imagenes/</code>, el reloj LED y los filtros.
            </span>
          </div>
          <span className="font-mono text-[11px] text-blue-400 bg-blue-900/50 px-2 py-0.5 rounded">
            {subastas.length} subastas
          </span>
        </div>
      )}

      {/* Contenedor Principal estilo Draw.io (Azul profundo con marco elegante) */}
      <div className="bg-gradient-to-br from-blue-950/70 via-slate-900 to-slate-950 border-2 border-blue-900/50 rounded-3xl p-6 sm:p-8 shadow-2xl">
        
        {cargando ? (
          <div className="py-24 text-center text-slate-400">
            <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold">Cargando catálogo en vivo...</p>
          </div>
        ) : subastas.length === 0 ? (
          <div className="py-20 text-center space-y-4 max-w-md mx-auto">
            <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">No se encontraron subastas</h3>
            <p className="text-xs text-slate-400">
              No hay artículos que coincidan con los filtros aplicados actualmente.
            </p>
            <button
              onClick={() => setFiltros({ estado: null, orden: null, categoriaId: null, categoriaNombre: null })}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors"
            >
              Restablecer Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ============================================================ */}
            {/* COLUMNA IZQUIERDA: Filtros + Caja de Descripción             */}
            {/* ============================================================ */}
            <div className="lg:col-span-3 space-y-5">
              {/* Panel de Filtros con Chips removibles */}
              <AuctionFilters
                filtros={filtros}
                onCambiarFiltro={setFiltros}
                categorias={categorias}
              />

              {/* Recuadro de DESCRIPCIÓN (exacto a la caja inferior de draw.io) */}
              <div className="bg-white text-slate-900 rounded-2xl p-5 shadow-lg border border-slate-200">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 mb-3">
                  DESCRIPCIÓN
                </h4>

                <h5 className="font-bold text-sm text-slate-950 line-clamp-2 leading-tight">
                  {detalleActivo?.titulo || subastaActual?.titulo}
                </h5>

                <p className="text-xs text-slate-600 mt-2 leading-relaxed max-h-36 overflow-y-auto pr-1">
                  {detalleActivo?.descripcion || 'Cargando descripción técnica del artículo...'}
                </p>

                {/* Ficha de datos adicionales del DTO */}
                <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-600 block">Precio Base:</span>
                    <span className="font-mono font-bold text-slate-900">
                      $ {(detalleActivo?.precioBase || subastaActual.precioBase).toLocaleString('es-AR')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600 block">Incremento:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      + $ {(detalleActivo?.incrementoMinimo || 1000).toLocaleString('es-AR')}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center justify-between pt-1 border-t border-slate-100 text-slate-700">
                    <span className="flex items-center gap-1 font-semibold">
                      <Tag className="w-3 h-3 text-blue-600" />
                      {subastaActual.categoriaNombre}
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {subastaActual.cantidadPujas} ofertas
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* COLUMNA CENTRAL: Carrusel Showcase + Botón PUJAR!            */}
            {/* ============================================================ */}
            <div className="lg:col-span-6 flex flex-col items-center justify-between space-y-5">
              
              {/* Encabezado del artículo en carrusel */}
              <div className="w-full flex items-center justify-between px-2">
                <span className="text-xs font-bold font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                  Subasta {indiceActual + 1} de {subastas.length}
                </span>

                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    subastaActual.estado === 'ACTIVA'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : subastaActual.estado === 'PROGRAMADA'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-700/80 text-slate-300 border border-slate-600'
                  }`}
                >
                  {subastaActual.estado}
                </span>
              </div>

              {/* Marco de la Imagen Central con Controles del Carrusel */}
              <div className="relative w-full bg-slate-950/80 border-2 border-slate-800 rounded-3xl p-4 flex flex-col items-center justify-center min-h-[380px] shadow-2xl group">
                
                {/* Flecha Izquierda (Anterior) */}
                <button
                  onClick={anteriorSubasta}
                  title="Subasta anterior"
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2.5 bg-slate-900/90 hover:bg-blue-600 text-white rounded-full border border-slate-700 transition-all shadow-xl hover:scale-110"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                {/* Imagen del Producto */}
                <div className="w-full h-72 sm:h-80 flex items-center justify-center overflow-hidden rounded-2xl bg-slate-900/40">
                  <img
                    src={subastaActual.urlImagen || '/placeholder.png'}
                    alt={subastaActual.titulo}
                    onError={(e) => {
                      // Si la imagen falla o no existe en public/imagenes, muestra un fallback limpio
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80';
                    }}
                    className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105 drop-shadow-2xl"
                  />
                </div>

                {/* Flecha Derecha (Siguiente) */}
                <button
                  onClick={siguienteSubasta}
                  title="Siguiente subasta"
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2.5 bg-slate-900/90 hover:bg-blue-600 text-white rounded-full border border-slate-700 transition-all shadow-xl hover:scale-110"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* Indicadores circulares (Puntos o o o) */}
                <div className="flex items-center gap-2 mt-4">
                  {subastas.slice(0, 10).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setIndiceActual(idx)}
                      className={`h-2.5 rounded-full transition-all ${
                        idx === indiceActual
                          ? 'w-6 bg-blue-500 shadow-md'
                          : 'w-2.5 bg-slate-700 hover:bg-slate-500'
                      }`}
                      title={`Ir a subasta ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Botón de Acción Principal: ¡PUJAR! */}
              <div className="w-full flex flex-col items-center">
                <button
                  disabled={subastaActual.estado !== 'ACTIVA'}
                  onClick={() => navigate(`/subastas/${subastaActual.id}`)}
                  className={`w-full sm:w-3/4 py-4 px-8 text-xl sm:text-2xl font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-3 border ${
                    subastaActual.estado === 'ACTIVA'
                      ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white shadow-xl shadow-red-900/40 hover:shadow-red-700/60 transform hover:-translate-y-1 active:translate-y-0 cursor-pointer border-red-400/40'
                      : subastaActual.estado === 'PROGRAMADA'
                      ? 'bg-slate-800/90 text-amber-400/80 border-amber-500/30 cursor-not-allowed shadow-none'
                      : 'bg-slate-800 text-slate-500 border-slate-700/80 cursor-not-allowed shadow-none'
                  }`}
                >
                  {subastaActual.estado === 'ACTIVA' && <Gavel className="w-7 h-7 animate-bounce" />}
                  <span>
                    {subastaActual.estado === 'ACTIVA'
                      ? '¡PUJAR!'
                      : subastaActual.estado === 'PROGRAMADA'
                      ? 'PRÓXIMAMENTE (PROGRAMADA)'
                      : subastaActual.cantidadPujas === 0
                      ? 'FINALIZADA (DESIERTA)'
                      : 'SUBASTA FINALIZADA'}
                  </span>
                </button>
                <span className="text-[11px] text-slate-400 mt-2 text-center">
                  {subastaActual.estado === 'ACTIVA'
                    ? 'Entrar a la Sala de Bidding en Vivo para ofertar en tiempo real.'
                    : subastaActual.estado === 'PROGRAMADA'
                    ? 'Esta subasta aún no ha comenzado. Próximamente se habilitarán las ofertas.'
                    : 'Esta subasta ya concluyó y no admite nuevas ofertas.'}
                </span>
              </div>

            </div>

            {/* ============================================================ */}
            {/* COLUMNA DERECHA: Reloj Digital LED + Historial de Pujas      */}
            {/* ============================================================ */}
            <div className="lg:col-span-3 flex flex-col gap-5 h-full">
              
              {/* Reloj LED (Fondo negro / Letras blancas / Rojas < 1 min) */}
              <div className="flex justify-center">
                <DigitalCountdown
                  fechaFin={detalleActivo?.fechaFin || subastaActual.fechaFin}
                />
              </div>

              {/* Panel de Últimas Ofertas en Tiempo Real */}
              <div className="flex-1">
                <PujaHistoryList
                  pujas={detalleActivo?.ultimasPujas || []}
                  cargando={cargandoDetalle}
                />
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
};

export default CatalogPage;
