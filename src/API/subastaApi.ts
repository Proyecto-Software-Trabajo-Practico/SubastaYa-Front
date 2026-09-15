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
};
