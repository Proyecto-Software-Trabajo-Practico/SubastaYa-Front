/*
  Hook personalizado useAuctionHub (src/hooks/useAuctionHub.ts).
  Responsabilidad Única (SRP):
  - Administra el ciclo de vida completo de la conexión WebSocket con SignalR (/hubs/subastas).
  - Suscribe y desuscribe la conexión al grupo 'subasta-{id}' para aislar el tráfico.
  - Expone el estado de conexión ('conectado') y despacha las ofertas recibidas a través de un callback.
*/

import { useEffect, useState, useRef } from 'react';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import type { NuevaPujaEvent } from '../types/auction';

const HUB_URL = 'https://localhost:7127/hubs/subastas';

interface UseAuctionHubProps {
  subastaId: number | null;
  onNuevaPuja?: (evento: NuevaPujaEvent) => void;
}

export const useAuctionHub = ({ subastaId, onNuevaPuja }: UseAuctionHubProps) => {
  const [conectado, setConectado] = useState<boolean>(false);
  const [errorConexion, setErrorConexion] = useState<string | null>(null);

  // Mantenemos una referencia mutable a la conexión para poder limpiarla al desmontar el componente
  const connectionRef = useRef<HubConnection | null>(null);
  const onNuevaPujaRef = useRef(onNuevaPuja);

  // Mantenemos el callback siempre actualizado sin provocar reconexiones innecesarias del efecto
  useEffect(() => {
    onNuevaPujaRef.current = onNuevaPuja;
  }, [onNuevaPuja]);

  useEffect(() => {
    // Si no hay un ID de subasta válido, no iniciamos conexión
    if (!subastaId) return;

    let cancelado = false;

    // Construcción del cliente SignalR con reconexión automática ante microcortes
    const connection = new HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect([0, 2000, 5000, 10000]) // Reintentos escalonados: inmediato, 2s, 5s y 10s
      .configureLogging(LogLevel.Warning)
      .build();

    connectionRef.current = connection;

    // Escuchador del evento emitido desde el Handler de CrearPuja en el backend
    connection.on('NuevaPujaRecibida', (data: NuevaPujaEvent) => {
      if (onNuevaPujaRef.current) {
        onNuevaPujaRef.current(data);
      }
    });

    // Monitoreo de eventos de estado de la conexión
    connection.onreconnecting(() => setConectado(false));
    connection.onreconnected(async () => {
      setConectado(true);
      // Al reconectar volvemos a unirnos al grupo de la sala
      try {
        await connection.invoke('UnirseASubasta', subastaId.toString());
      } catch (err) {
        console.error('Error al reincorporarse a la sala de subasta:', err);
      }
    });
    connection.onclose(() => setConectado(false));

    // Inicio del handshake de conexión y unión al grupo
    const iniciarConexion = async () => {
      try {
        await connection.start();
        if (cancelado) {
          await connection.stop();
          return;
        }

        // Unirse al grupo específico de la subasta (subasta-{id})
        await connection.invoke('UnirseASubasta', subastaId.toString());
        setConectado(true);
        setErrorConexion(null);
      } catch (err) {
        if (!cancelado) {
          setErrorConexion('No se pudo establecer conexión en tiempo real con la subasta.');
          setConectado(false);
        }
      }
    };

    iniciarConexion();

    // Limpieza al salir de la pantalla (evita conexiones zombies en el servidor)
    return () => {
      cancelado = true;
      if (connection.state === HubConnectionState.Connected) {
        connection.invoke('SalirDeSubasta', subastaId.toString()).catch(() => {});
      }
      connection.off('NuevaPujaRecibida');
      connection.stop().catch(() => {});
    };
  }, [subastaId]);

  return { conectado, errorConexion };
};
