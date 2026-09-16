/*
  Cliente de servicio para el módulo de Subastas.
  Aplica el principio de Responsabilidad Única (SRP): encapsula todas las peticiones
  HTTP hacia los endpoints /api/subastas y /api/categorias, desacoplando la capa
  de presentación (React) de la implementación concreta de transporte (fetch/httpClient).
*/

import { httpClient } from './httpClient';

// Contrato DTO para solicitar la creación de una subasta en el backend
export interface CrearSubastaDto {
  titulo: string;
  descripcion: string;
  urlImagen?: string | null;
  precioBase: number;
  incrementoMinimo: number;
  fechaInicio: string; // Formato ISO 8601 UTC
  fechaFin: string;    // Formato ISO 8601 UTC
  categoriaId: number;
}

// Contrato DTO para la lista de categorías del sistema
export interface CategoriaDto {
  id: number;
  nombre: string;
  urlIcono?: string | null;
}

// Respuesta devuelta por el backend ante HTTP 201 Created
export interface SubastaCreadaRespuestaDto {
  id: number;
}

// DTO reducido para tarjetas e ítems de catálogo y listas de actividades
export interface SubastaCardDto {
  id: number;
  titulo: string;
  urlImagen?: string | null;
  estado: 'PROGRAMADA' | 'ACTIVA' | 'FINALIZADA' | 'CANCELADA';
  precioBase: number;
  precioActual: number;
  cantidadPujas: number;
  fechaFin: string;
  categoriaId: number;
  categoriaNombre?: string;
  ganadorId?: number | null;
}

// DTO para paginación estándar de la API
export interface ResultadoPaginadoDto<T> {
  items: T[];
  totalItems: number;
  pagina: number;
  tamanoPagina: number;
  totalPaginas: number;
}

// DTO con las ofertas individuales para la vista de comprador
export interface OfertaDetalleDto {
  id: number;
  subastaId: number;
  monto: number;
  fechaHora: string;
  usuarioId: number;
  nombreUsuario?: string;
}

// DTO detallado de una subasta específica
export interface SubastaDetalleDto extends SubastaCardDto {
  descripcion: string;
  incrementoMinimo: number;
  fechaInicio: string;
  vendedorId: number;
  vendedorNombre?: string;
  pujas: OfertaDetalleDto[];
}

export const subastaApi = {
  /*
    Envía la solicitud de alta de subasta al backend vía POST /api/subastas.
    El backend extrae automáticamente el VendedorId a partir del token JWT (Bearer).
  */
  crearSubasta: async (dto: CrearSubastaDto): Promise<SubastaCreadaRespuestaDto> => {
    return await httpClient.post<SubastaCreadaRespuestaDto>('/subastas', dto);
  },

  /*
    Consulta el catálogo de categorías disponibles vía GET /api/categorias
    para alimentar el selector del formulario de creación.
  */
  obtenerCategorias: async (): Promise<CategoriaDto[]> => {
    return await httpClient.get<CategoriaDto[]>('/categorias');
  },

  /*
    Obtiene las subastas publicadas por un vendedor específico.
  */
  obtenerMisPublicaciones: async (
    vendedorId: number,
    pagina: number = 1,
    tamanoPagina: number = 50
  ): Promise<ResultadoPaginadoDto<SubastaCardDto>> => {
    return await httpClient.get<ResultadoPaginadoDto<SubastaCardDto>>(
      `/subastas?vendedorId=${vendedorId}&pagina=${pagina}&tamanoPagina=${tamanoPagina}`
    );
  },

  /*
    Obtiene el detalle completo de una subasta por su ID.
  */
  obtenerDetalleSubasta: async (id: number): Promise<SubastaDetalleDto> => {
    return await httpClient.get<SubastaDetalleDto>(`/subastas/${id}`);
  },

  /*
    Obtiene el listado general de subastas activas o finalizadas para contrastar ofertas del comprador.
  */
  obtenerCatalogoGeneral: async (pagina: number = 1, tamanoPagina: number = 50): Promise<ResultadoPaginadoDto<SubastaCardDto>> => {
    return await httpClient.get<ResultadoPaginadoDto<SubastaCardDto>>(
      `/subastas?pagina=${pagina}&tamanoPagina=${tamanoPagina}`
    );
  }
};