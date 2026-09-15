import { httpClient } from './httpClient';

export interface BilleteraSaldosDto {
  id: number;
  usuarioId: number;
  saldoTotal: number;
  saldoRetenido: number;
  saldoDisponible: number;
}

export interface CargarSaldoDto {
  monto: number;
}

export interface TransaccionLedgerDTO {
  id: number;
  billeteraId: number;
  tipo: 'DEPOSITO' | 'RETENCION_OFERTA' | 'LIBERACION_OFERTA' | 'PAGO' | 'COBRO';
  monto: number;
  fecha: string;
  subastaId?: number | null;
}

export interface ResultadoPaginadoDTO<T> {
  items: T[];
  totalItems: number;
  pagina: number;
  tamanoPagina: number;
  totalPaginas: number;
  tienePaginaPrevia: boolean;
  tienePaginaSiguiente: boolean;
}

export const billeteraApi = {
  obtenerSaldos: (usuarioId: number) =>
    httpClient.get<BilleteraSaldosDto>(`/billeteras/${usuarioId}/saldos`),

  depositar: (usuarioId: number, monto: number) =>
    httpClient.post<BilleteraSaldosDto>(`/billeteras/${usuarioId}/depositos`, { monto }),

  obtenerTransacciones: (usuarioId: number, pagina: number = 1, tamanoPagina: number = 10) =>
    httpClient.get<ResultadoPaginadoDTO<TransaccionLedgerDTO>>(
      `/billeteras/${usuarioId}/transacciones?pagina=${pagina}&tamanoPagina=${tamanoPagina}`
    ),
};