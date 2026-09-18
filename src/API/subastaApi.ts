/*
  Cliente de servicio para el módulo de Subastas.
  Aplica el principio de Responsabilidad Única (SRP): encapsula todas las peticiones
  HTTP hacia los endpoints /api/subastas y /api/categorias.
*/

import { httpClient } from './httpClient';

export interface CrearSubastaDto {
  titulo: string;
  descripcion: string;
  urlImagen?: string | null;
  precioBase: number;
  incrementoMinimo: number;
  fechaInicio: string;
  fechaFin: string;
  categoriaId: number;
}

export interface CategoriaDto {
  id: number;
  nombre: string;
  urlIcono?: string | null;
}

export interface SubastaCreadaRespuestaDto {
  id: number;
}

export interface SubastaCardDto {
  id: number;
  titulo: string;
  urlImagen?: string;
  estado: string;
  precioBase: number;
  precioActual: number;
  cantidadPujas: number;
  fechaFin: string;
  categoriaId: number;
  categoriaNombre: string;
  compradorGanadorId?: number;
}

export interface ResultadoPaginadoDto<T> {
  items: T[];
  totalItems: number;
  pagina: number;
  tamanoPagina: number;
  totalPaginas: number;
}

export interface OfertaDetalleDto {
  id: number;
  subastaId: number;
  monto: number;
  fechaPuja?: string;
  fechaHora?: string;
  compradorId?: number;
  usuarioId?: number;
  nombreUsuario?: string;
}

export interface SubastaDetalleDto extends SubastaCardDto {
  descripcion: string;
  incrementoMinimo: number;
  fechaInicio: string;
  vendedorId: number;
  vendedorNombre?: string;
  ultimasPujas?: OfertaDetalleDto[];
  pujas?: OfertaDetalleDto[];
}

export const subastaApi = {
  crearSubasta: async (dto: CrearSubastaDto): Promise<SubastaCreadaRespuestaDto> => {
    return await httpClient.post<SubastaCreadaRespuestaDto>('/subastas', dto);
  },

  obtenerCategorias: async (): Promise<CategoriaDto[]> => {
    return await httpClient.get<CategoriaDto[]>('/categorias');
  },

  // Mis Publicaciones (Rol Vendedor) -> GET /api/usuarios/{vendedorId}/subastas
  obtenerMisPublicaciones: async (vendedorId: number, pagina = 1, tamanoPagina = 10) => {
    return await httpClient.get<ResultadoPaginadoDto<SubastaCardDto>>(
      `/usuarios/${vendedorId}/subastas?pagina=${pagina}&tamanoPagina=${tamanoPagina}`
    );
  },

  // Mis Ofertas (Rol Comprador) -> GET /api/usuarios/{compradorId}/ofertas
  obtenerMisOfertas: async (compradorId: number, pagina = 1, tamanoPagina = 15) => {
    return await httpClient.get<ResultadoPaginadoDto<SubastaCardDto>>(
      `/usuarios/${compradorId}/ofertas?pagina=${pagina}&tamanoPagina=${tamanoPagina}`
    );
  },

  obtenerDetalleSubasta: async (id: number): Promise<SubastaDetalleDto> => {
    return await httpClient.get<SubastaDetalleDto>(`/subastas/${id}`);
  },

  /*
    Soporta filtrado por estado (e.g. 'ACTIVA', 'FINALIZADA') enviando la query string a C#.
  */
  obtenerCatalogoGeneral: async (
    pagina: number = 1, 
    tamanoPagina: number = 100, 
    estado?: string
  ): Promise<ResultadoPaginadoDto<SubastaCardDto>> => {
    const params = new URLSearchParams({
      pagina: pagina.toString(),
      tamanoPagina: tamanoPagina.toString(),
    });
    if (estado) params.append('estado', estado);

    return await httpClient.get<ResultadoPaginadoDto<SubastaCardDto>>(
      `/subastas?${params.toString()}`
    );
  }
};