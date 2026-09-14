/*
  Contexto de autenticación y sesión de usuario para SubastaYa.
  Gestiona el usuario activo en memoria y consulta sus saldos en el backend.
*/

import React, { createContext, useContext, useState, useEffect } from 'react';
import { httpClient } from '../API/httpClient';

// Interfaz para el usuario activo en la sesión
export interface UsuarioSesion {
  id: number;
  nombre: string;
  email: string;
  rol: 'COMPRADOR' | 'VENDEDOR';
}

// DTO de saldos de billetera según el contrato del backend (BilleteraSaldosDto)
export interface BilleteraSaldos {
  id: number;
  usuarioId: number;
  saldoTotal: number;
  saldoRetenido: number;
  saldoDisponible: number;
}

interface AuthContextType {
  usuarioActual: UsuarioSesion;
  usuariosDisponibles: UsuarioSesion[];
  saldos: BilleteraSaldos | null;
  cargandoSaldos: boolean;
  cambiarUsuario: (id: number) => void;
  actualizarSaldos: () => Promise<void>;
}

// Usuarios mock iniciales para pruebas ágiles de compra y venta
const USUARIOS_PRUEBA: UsuarioSesion[] = [
  { id: 1, nombre: 'Vendedor Demo', email: 'vendedor@subastaya.com', rol: 'VENDEDOR' },
  { id: 2, nombre: 'Comprador Demo', email: 'comprador@subastaya.com', rol: 'COMPRADOR' },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuarioActual, setUsuarioActual] = useState<UsuarioSesion>(USUARIOS_PRUEBA[1]); // Iniciamos como comprador
  const [saldos, setSaldos] = useState<BilleteraSaldos | null>(null);
  const [cargandoSaldos, setCargandoSaldos] = useState<boolean>(false);

  // Consulta el saldo en el backend GET /api/billeteras/{usuarioId}/saldos
  const actualizarSaldos = async () => {
    try {
      setCargandoSaldos(true);
      const data = await httpClient.get<BilleteraSaldos>(`/billeteras/${usuarioActual.id}/saldos`);
      setSaldos(data);
    } catch {
      // Si el backend no está encendido o la billetera aún no existe, mantenemos saldos en null de forma segura
      setSaldos(null);
    } finally {
      setCargandoSaldos(false);
    }
  };

  // Cada vez que se cambia de usuario, refrescamos los saldos de su billetera
  useEffect(() => {
    actualizarSaldos();
  }, [usuarioActual.id]);

  const cambiarUsuario = (id: number) => {
    const seleccionado = USUARIOS_PRUEBA.find((u) => u.id === id);
    if (seleccionado) {
      setUsuarioActual(seleccionado);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        usuarioActual,
        usuariosDisponibles: USUARIOS_PRUEBA,
        saldos,
        cargandoSaldos,
        cambiarUsuario,
        actualizarSaldos,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para consumir el contexto de forma segura
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
