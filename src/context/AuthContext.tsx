import React, { createContext, useContext, useState, useEffect } from 'react';
import { httpClient } from '../API/httpClient';
import { authApi, type IniciarSesionDto, type RegistrarUsuarioDto, type LoginRespuestaDto } from '../API/authApi';

export interface UsuarioSesion {
  id: number;
  nombre: string;
  email: string;
}

export interface BilleteraSaldos {
  id: number;
  usuarioId: number;
  saldoTotal: number;
  saldoRetenido: number;
  saldoDisponible: number;
}

interface AuthContextType {
  token: string | null;
  usuarioActual: UsuarioSesion | null;
  isAuthenticated: boolean;
  saldos: BilleteraSaldos | null;
  cargandoSaldos: boolean;
  login: (dto: IniciarSesionDto) => Promise<void>;
  register: (dto: RegistrarUsuarioDto) => Promise<any>;
  logout: () => void;
  actualizarSaldos: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('jwt_token'));
  const [usuarioActual, setUsuarioActual] = useState<UsuarioSesion | null>(() => {
    const savedUser = localStorage.getItem('usuario_data');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [saldos, setSaldos] = useState<BilleteraSaldos | null>(null);
  const [cargandoSaldos, setCargandoSaldos] = useState<boolean>(false);

  // Escuchador para reevaluar la sesión cuando el navegador retrocede usando memoria caché (bfcache)
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        const tokenStorage = localStorage.getItem('jwt_token');
        if (!tokenStorage) {
          setToken(null);
          setUsuarioActual(null);
          setSaldos(null);
        }
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  const actualizarSaldos = async () => {
    if (!usuarioActual) {
      setSaldos(null);
      return;
    }

    try {
      setCargandoSaldos(true);
      const data = await httpClient.get<BilleteraSaldos>(`/billeteras/${usuarioActual.id}/saldos`);
      setSaldos(data);
    } catch {
      setSaldos(null);
    } finally {
      setCargandoSaldos(false);
    }
  };

  useEffect(() => {
    if (usuarioActual) {
      actualizarSaldos();
    } else {
      setSaldos(null);
    }
  }, [usuarioActual?.id]);

  const guardarSesion = (tokenJWT: string, usuario: UsuarioSesion) => {
    setToken(tokenJWT);
    setUsuarioActual(usuario);
    localStorage.setItem('jwt_token', tokenJWT);
    localStorage.setItem('usuario_data', JSON.stringify(usuario));
  };

  const login = async (dto: IniciarSesionDto) => {
    const respuesta: LoginRespuestaDto = await authApi.login(dto);
    const usuario: UsuarioSesion = {
      id: respuesta.id,
      nombre: respuesta.nombre,
      email: respuesta.email,
    };
    guardarSesion(respuesta.token, usuario);
  };

  const register = async (dto: RegistrarUsuarioDto) => {
    const respuesta = await authApi.registrar(dto);
    return respuesta;
  };

  const logout = () => {
    setToken(null);
    setUsuarioActual(null);
    setSaldos(null);
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('usuario_data');
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        usuarioActual,
        isAuthenticated: !!token,
        saldos,
        cargandoSaldos,
        login,
        register,
        logout,
        actualizarSaldos,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};