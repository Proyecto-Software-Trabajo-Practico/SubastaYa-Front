import { httpClient } from './httpClient';

export interface UsuarioDTO {
  id: number;
  nombre: string;
  email: string;
}

export interface RegistrarUsuarioDto {
  nombre: string;
  email: string;
  password: string;
}

export interface IniciarSesionDto {
  email: string;
  password: string;
}

export interface LoginRespuestaDto {
  id: number;
  nombre: string;
  email: string;
  token: string;
  mensaje: string;
}

export const authApi = {
  registrar: (dto: RegistrarUsuarioDto) =>
    httpClient.post<UsuarioDTO>('/usuarios', dto),
  login: (dto: IniciarSesionDto) =>
    httpClient.post<LoginRespuestaDto>('/usuarios/login', dto),
};