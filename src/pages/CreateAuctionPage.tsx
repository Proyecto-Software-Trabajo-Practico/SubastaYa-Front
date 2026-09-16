/*
  Página principal de creación de subasta: CreateAuctionPage.
  Corresponde al Módulo 2 del proyecto SubastaYa.
  
  Rol Arquitectónico:
  - Orquesta el estado reactivo del formulario de publicación con persistencia en localStorage.
  - Coordina la selección de categoría y la subida de imagen local en memoria (Base64).
  - Delega la comunicación HTTP a subastaApi (principio DIP).
  - Despliega la tarjeta reactiva de previsualización en vivo (AuctionPreviewCard).
  - Al completar la creación, despliega el toast verde animado de "¡Publicación Exitosa!".
*/

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
  Upload, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  ArrowRight,
  Gavel,
  PackageCheck,
  RotateCcw
} from 'lucide-react';
import { subastaApi, type CategoriaDto, type CrearSubastaDto } from '../API/subastaApi';
import { ApiError } from '../API/httpClient';
import { AuctionPreviewCard } from '../components/auction/AuctionPreviewCard';

const DRAFT_KEY = 'subasta_form_draft_data';

export const CreateAuctionPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Formateador de fecha local para el input HTML datetime-local (YYYY-MM-DDTHH:mm)
  const formatearParaInput = (date: Date): string => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const anio = date.getFullYear();
    const mes = pad(date.getMonth() + 1);
    const dia = pad(date.getDate());
    const horas = pad(date.getHours());
    const minutos = pad(date.getMinutes());
    return `${anio}-${mes}-${dia}T${horas}:${minutos}`;
  };

  // 1. Cargar borrador persistido o definir estados iniciales
  const [draftLoaded] = useState(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Ignorar si hay fallo de lectura
      }
    }
    return null;
  });

  // Estados del Formulario (con fallback al borrador o por defecto)
  const [titulo, setTitulo] = useState<string>(draftLoaded?.titulo ?? '');
  const [categoriaId, setCategoriaId] = useState<number | ''>(draftLoaded?.categoriaId ?? '');
  const [descripcion, setDescripcion] = useState<string>(draftLoaded?.descripcion ?? '');
  const [precioBase, setPrecioBase] = useState<number | ''>(draftLoaded?.precioBase ?? '');
  const [incrementoMinimo, setIncrementoMinimo] = useState<number | ''>(draftLoaded?.incrementoMinimo ?? '');
  const [urlImagen, setUrlImagen] = useState<string | null>(draftLoaded?.urlImagen ?? null);
  const [nombreArchivo, setNombreArchivo] = useState<string>(draftLoaded?.nombreArchivo ?? '');

  // Fechas y Cronograma
  const [esInmediata, setEsInmediata] = useState<boolean>(draftLoaded?.esInmediata ?? true);
  const [fechaInicioManual, setFechaInicioManual] = useState<string>(
    draftLoaded?.fechaInicioManual ?? formatearParaInput(new Date())
  );
  const [fechaFinManual, setFechaFinManual] = useState<string>(
    draftLoaded?.fechaFinManual ?? formatearParaInput(new Date(Date.now() + 24 * 60 * 60 * 1000))
  );

  // Categorías cargadas desde el backend
  const [categorias, setCategorias] = useState<CategoriaDto[]>([]);
  const [cargandoCategorias, setCargandoCategorias] = useState<boolean>(true);

  // Estados de control de flujo
  const [enviando, setEnviando] = useState<boolean>(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [errorFechas, setErrorFechas] = useState<string | null>(null);
  const [subastaCreadaId, setSubastaCreadaId] = useState<number | null>(null);

  /*
    Inicialización de categorías desde GET /api/categorias.
  */
  useEffect(() => {
    const inicializar = async () => {
      try {
        const data = await subastaApi.obtenerCategorias();
        setCategorias(data);
        if (data.length > 0 && !categoriaId) {
          setCategoriaId(data[0].id);
        }
      } catch {
        setErrorGeneral('No se pudieron obtener las categorías desde el servidor.');
      } finally {
        setCargandoCategorias(false);
      }
    };

    inicializar();
  }, []);

  /*
    PUNTO 2: Persistencia automática en localStorage ante cambios en los campos.
  */
  useEffect(() => {
    const draft = {
      titulo,
      categoriaId,
      descripcion,
      precioBase,
      incrementoMinimo,
      urlImagen,
      nombreArchivo,
      esInmediata,
      fechaInicioManual,
      fechaFinManual
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [
    titulo, 
    categoriaId, 
    descripcion, 
    precioBase, 
    incrementoMinimo, 
    urlImagen, 
    nombreArchivo, 
    esInmediata, 
    fechaInicioManual, 
    fechaFinManual
  ]);

  /*
    PUNTO 3: Reloj dinámico de 1 minuto para actualizar la fecha de inicio cuando "esInmediata" está activo.
  */
  useEffect(() => {
    if (!esInmediata) return;

    // Actualizar inmediatamente la fecha al seleccionar la opción
    setFechaInicioManual(formatearParaInput(new Date()));

    const interval = setInterval(() => {
      setFechaInicioManual(formatearParaInput(new Date()));
    }, 60000);

    return () => clearInterval(interval);
  }, [esInmediata]);

  /*
    Atajos rápidos para asignar la duración de la subasta con un clic
  */
  const aplicarAtajoDuracion = (horas: number) => {
    const base = esInmediata ? new Date() : (fechaInicioManual ? new Date(fechaInicioManual) : new Date());
    const nuevaFechaFin = new Date(base.getTime() + horas * 60 * 60 * 1000);
    setFechaFinManual(formatearParaInput(nuevaFechaFin));
  };

  /*
    Manejo de precios e incremento
  */
  const handlePrecioBaseChange = (valor: number | '') => {
    setPrecioBase(valor);
  };

  const calcularPorcentaje = (porc: number): number => {
    const base = Number(precioBase) || 0;
    if (base <= 0) return 0;
    return Math.max(1, Math.round(base * (porc / 100)));
  };

  const aplicarPorcentaje = (porc: number) => {
    const monto = calcularPorcentaje(porc);
    if (monto > 0) {
      setIncrementoMinimo(monto);
    }
  };

  /*
    Subida de imagen local a Base64
  */
  const handleSeleccionarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorGeneral('El archivo seleccionado debe ser una imagen válida (PNG, JPG, WEBP).');
      return;
    }

    setNombreArchivo(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setUrlImagen(reader.result as string);
      setErrorGeneral(null);
    };
    reader.onerror = () => {
      setErrorGeneral('Error al leer el archivo de imagen en memoria.');
    };
    reader.readAsDataURL(file);
  };

  const handleQuitarImagen = () => {
    setUrlImagen(null);
    setNombreArchivo('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /*
    Limpieza voluntaria del borrador guardado
  */
  const handleLimpiarBorrador = () => {
    localStorage.removeItem(DRAFT_KEY);
    setTitulo('');
    setDescripcion('');
    setPrecioBase('');
    setIncrementoMinimo('');
    setUrlImagen(null);
    setNombreArchivo('');
    setEsInmediata(true);
    const ahora = new Date();
    setFechaInicioManual(formatearParaInput(ahora));
    setFechaFinManual(formatearParaInput(new Date(ahora.getTime() + 24 * 60 * 60 * 1000)));
    setErrorGeneral(null);
    setErrorFechas(null);
  };

  /*
    Envío del formulario y validaciones previas de negocio
  */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorGeneral(null);
    setErrorFechas(null);

    if (!titulo.trim()) {
      setErrorGeneral('Por favor, indicá un título para tu producto.');
      return;
    }
    if (!categoriaId) {
      setErrorGeneral('Debes seleccionar una categoría válida.');
      return;
    }
    if (!descripcion.trim()) {
      setErrorGeneral('La descripción del producto es obligatoria.');
      return;
    }
    const numPrecio = Number(precioBase);
    if (!numPrecio || numPrecio <= 0) {
      setErrorGeneral('El precio base debe ser un importe mayor a cero.');
      return;
    }
    const numIncremento = Number(incrementoMinimo);
    if (!numIncremento || numIncremento <= 0) {
      setErrorGeneral('El incremento mínimo debe ser un importe mayor a cero.');
      return;
    }

    // PUNTO 4: Validación de Fechas con error focalizado
    const fechaInicioDate = esInmediata ? new Date() : new Date(fechaInicioManual);
    const fechaFinDate = new Date(fechaFinManual);

    if (isNaN(fechaFinDate.getTime())) {
      setErrorFechas('La fecha de finalización no tiene un formato válido.');
      return;
    }
    if (!esInmediata && fechaInicioDate < new Date(Date.now() - 60000)) {
      setErrorFechas('La fecha y hora de inicio programada no puede estar en el pasado.');
      return;
    }
    if (fechaFinDate <= fechaInicioDate) {
      setErrorFechas('La fecha de finalización debe ser estrictamente posterior a la fecha de inicio.');
      return;
    }

    const payload: CrearSubastaDto = {
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      urlImagen: urlImagen,
      precioBase: numPrecio,
      incrementoMinimo: numIncremento,
      fechaInicio: fechaInicioDate.toISOString(),
      fechaFin: fechaFinDate.toISOString(),
      categoriaId: Number(categoriaId)
    };

    setEnviando(true);
    try {
      const resultado = await subastaApi.crearSubasta(payload);
      localStorage.removeItem(DRAFT_KEY);
      setSubastaCreadaId(resultado.id);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorGeneral(err.message);
      } else {
        setErrorGeneral('Ocurrió un error inesperado al publicar la subasta.');
      }
    } finally {
      setEnviando(false);
    }
  };

  const categoriaSeleccionada = categorias.find((c) => c.id === Number(categoriaId));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Cabecera de la sección */}
      <div className="border-b border-slate-800 pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <PlusCircle className="w-8 h-8 text-amber-500" />
            Publicar Nueva Subasta
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Completá los datos del artículo, definí las condiciones económicas y lanzá la subasta al catálogo en vivo.
          </p>
        </div>

        {/* Botón de Limpiar Borrador Persistido */}
        <button
          type="button"
          onClick={handleLimpiarBorrador}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 text-xs font-semibold rounded-xl border border-slate-700 transition"
          title="Borrar los datos guardados del borrador"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Limpiar Borrador</span>
        </button>
      </div>

      {/* Cartel de Error General */}
      {errorGeneral && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorGeneral}</span>
        </div>
      )}

      {/* Disposición en 2 Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ================= COLUMNA IZQUIERDA: FORMULARIO ================= */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
          
          {/* Bloque 1: Información General */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              1. Información General del Producto
            </h2>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Título del Artículo <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="Ej. Reloj Antiguo Suizo de Colección 1945"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                maxLength={100}
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Categoría <span className="text-red-400">*</span>
              </label>
              <select
                value={categoriaId}
                onChange={(e) => setCategoriaId(Number(e.target.value))}
                disabled={cargandoCategorias}
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-2.5 text-sm text-white transition-colors"
              >
                {cargandoCategorias ? (
                  <option>Cargando categorías...</option>
                ) : (
                  categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Descripción y Estado del Artículo <span className="text-red-400">*</span>
              </label>
              <textarea
                placeholder="Describí las características, origen, estado de conservación y cualquier detalle relevante para los compradores..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Bloque 2: Configuración Económica */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              2. Parámetros Económicos
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Precio Base Inicial ($) <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">$</span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    placeholder="50000"
                    value={precioBase}
                    onChange={(e) => handlePrecioBaseChange(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white font-mono placeholder-slate-600 transition-colors"
                  />
                </div>
                {Number(precioBase) > 0 ? (
                  <span className="text-[11px] font-mono text-emerald-400 font-semibold block">
                    Equivale a: $ {Number(precioBase).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500 block">Importe mínimo para abrir la puja.</span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Incremento Mínimo ($) <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">+$</span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    placeholder="5000"
                    value={incrementoMinimo}
                    onChange={(e) => setIncrementoMinimo(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white font-mono placeholder-slate-600 transition-colors"
                  />
                </div>
                {Number(incrementoMinimo) > 0 ? (
                  <span className="text-[11px] font-mono text-blue-400 font-semibold block">
                    Equivale a: +$ {Number(incrementoMinimo).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500 block">Diferencia mínima entre cada puja consecutiva.</span>
                )}
              </div>
            </div>

            <div className="pt-1 flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-slate-400 font-medium">Sugerencia porcentual automática:</span>
              <button
                type="button"
                disabled={!precioBase || Number(precioBase) <= 0}
                onClick={() => aplicarPorcentaje(5)}
                className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 hover:text-white rounded-xl text-xs font-semibold font-mono transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <span>5%</span>
                {Number(precioBase) > 0 && (
                  <span className="text-slate-300 font-normal">
                    (${calcularPorcentaje(5).toLocaleString('es-AR')})
                  </span>
                )}
              </button>

              <button
                type="button"
                disabled={!precioBase || Number(precioBase) <= 0}
                onClick={() => aplicarPorcentaje(10)}
                className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 hover:text-white rounded-xl text-xs font-semibold font-mono transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <span>10%</span>
                {Number(precioBase) > 0 && (
                  <span className="text-slate-300 font-normal">
                    (${calcularPorcentaje(10).toLocaleString('es-AR')})
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Bloque 3: Cronograma y Tiempos */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              3. Tiempos y Duración
            </h2>

            <label className="flex items-center gap-3 bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 cursor-pointer hover:border-slate-700 transition-colors">
              <input
                type="checkbox"
                checked={esInmediata}
                onChange={(e) => setEsInmediata(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700"
              />
              <div>
                <span className="text-xs font-semibold text-white block">Iniciar de forma inmediata</span>
                <span className="text-[11px] text-slate-400 block">
                  La subasta entrará con estado <strong className="text-emerald-400 font-semibold">ACTIVA</strong> de inmediato.
                </span>
              </div>
            </label>

            {/* PUNTO 4: Cartel de Error Focalizado para Fechas */}
            {errorFechas && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-center gap-2.5 text-rose-400 text-xs font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorFechas}</span>
              </div>
            )}

            {!esInmediata && (
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-slate-300 block">
                  Fecha y Hora de Inicio Programada <span className="text-red-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={fechaInicioManual}
                  onChange={(e) => setFechaInicioManual(e.target.value)}
                  required={!esInmediata}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-4 py-2.5 text-sm text-white font-mono transition-colors"
                />
              </div>
            )}

            <div className="space-y-2 pt-1">
              <span className="text-xs font-semibold text-slate-300 block">
                Atajos de duración rápida desde el inicio:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: '1 Hora', horas: 1 },
                  { label: '24 Horas', horas: 24 },
                  { label: '3 Días', horas: 72 },
                  { label: '7 Días', horas: 168 }
                ].map((dur) => (
                  <button
                    key={dur.horas}
                    type="button"
                    onClick={() => aplicarAtajoDuracion(dur.horas)}
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{dur.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-slate-300 block">
                Fecha y Hora de Cierre <span className="text-red-400">*</span>
              </label>
              <input
                type="datetime-local"
                value={fechaFinManual}
                onChange={(e) => setFechaFinManual(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-2.5 text-sm text-white font-mono transition-colors"
              />
            </div>
          </div>

          {/* Bloque 4: Fotografía del Producto */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
              4. Fotografía del Producto
            </h2>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/png, image/jpeg, image/webp"
              onChange={handleSeleccionarArchivo}
              className="hidden"
            />

            {!urlImagen ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-950/40 space-y-3 group"
              >
                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl w-fit mx-auto group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white block">
                    Hacé clic para subir una foto desde tu equipo
                  </span>
                  <span className="text-xs text-slate-400 mt-1 block">
                    Formatos admitidos: PNG, JPG o WEBP. Se convertirá de forma instantánea en Base64.
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-2xl p-3">
                <div className="flex items-center gap-3">
                  <img
                    src={urlImagen}
                    alt="Previsualización miniatura"
                    className="w-14 h-14 object-cover rounded-xl border border-slate-800"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block truncate max-w-[200px]">
                      {nombreArchivo || 'Imagen cargada con éxito'}
                    </span>
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Lista para publicar
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                  >
                    Cambiar
                  </button>
                  <button
                    type="button"
                    onClick={handleQuitarImagen}
                    className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors"
                    title="Quitar imagen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-base rounded-2xl shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {enviando ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Publicando Subasta en el Servidor...</span>
              </>
            ) : (
              <>
                <PackageCheck className="w-5 h-5" />
                <span>Publicar Subasta Ahora</span>
              </>
            )}
          </button>
        </form>

        {/* ================= COLUMNA DERECHA: PREVIEW EN VIVO ================= */}
        <div className="lg:col-span-5 sticky top-24">
          <AuctionPreviewCard
            titulo={titulo}
            categoriaNombre={categoriaSeleccionada?.nombre}
            descripcion={descripcion}
            precioBase={Number(precioBase) || 0}
            incrementoMinimo={Number(incrementoMinimo) || 0}
            fechaInicio={esInmediata ? new Date().toISOString() : fechaInicioManual}
            fechaFin={fechaFinManual}
            urlImagen={urlImagen}
            esInmediata={esInmediata}
          />
        </div>
      </div>

      {/* ================= MODAL / TOAST VERDE DE ÉXITO ================= */}
      {subastaCreadaId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg bg-slate-900 border-2 border-emerald-500/80 rounded-3xl p-8 text-center space-y-6 shadow-2xl shadow-emerald-500/20 transform animate-in zoom-in-95 duration-300">
            
            <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping opacity-75" />
              <div className="relative bg-emerald-500 text-slate-950 p-4 rounded-full shadow-lg shadow-emerald-500/40">
                <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs font-bold uppercase tracking-widest text-emerald-400">
                <Sparkles className="w-3.5 h-3.5" /> ¡Publicación Exitosa!
              </div>
              <h2 className="text-2xl font-black text-white">
                Tu subasta ya está activa
              </h2>
              <p className="text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
                El artículo se registró con el código <strong className="text-emerald-400 font-mono">#{subastaCreadaId}</strong> y ya se encuentra visible en el sistema para recibir ofertas.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={() => navigate(`/subastas/${subastaCreadaId}`)}
                className="w-full py-3.5 px-5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Gavel className="w-4 h-4" />
                <span>Entrar a la Sala en Vivo</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => navigate('/catalogo')}
                  className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition-colors"
                >
                  Ver en Catálogo
                </button>
                <button
                  onClick={() => navigate('/actividades')}
                  className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition-colors"
                >
                  Mis Publicaciones
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};