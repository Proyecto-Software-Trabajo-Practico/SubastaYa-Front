/*
  Definición centralizada de interfaces y contratos tipados para el Módulo de Subastas.
  Asegura coherencia entre los DTOs de la API REST de .NET y los eventos en tiempo real de SignalR.
*/

// Modelo correspondiente al SubastaDetalleDTO retornado por GET /api/subastas/{id}
export interface SubastaDetalle {
  id: number;
  titulo: string;
  descripcion: string;
  urlImagen: string | null;
  estado: 'PROGRAMADA' | 'ACTIVA' | 'FINALIZADA' | 'CANCELADA' | 'DESIERTA' | string;
  precioBase: number;
  incrementoMinimo: number;
  precioActual: number;
  cantidadPujas: number;
  fechaInicio: string;
  fechaFin: string;
  categoriaId: number;
  categoriaNombre: string;
  vendedorId: number;
  vendedorNombre: string;
  ultimasPujas: PujaItem[];
}

import type { PujaItem } from '../components/auction/PujaHistoryList';
export type { PujaItem };

// Payload exacto emitido por SignalR en el evento "NuevaPujaRecibida" desde CrearPujaCommandHandler
export interface NuevaPujaEvent {
  subastaId: number;
  compradorId: number;
  monto: number;
  fechaPuja: string;
  postor: string;
  nuevaFechaFin: string;
  seAplicoAntiSniping: boolean;
}

// DTO para el cuerpo del comando HTTP POST /api/pujas
export interface CrearPujaRequest {
  subastaId: number;
  monto: number;
}
