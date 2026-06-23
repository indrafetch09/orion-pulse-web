import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";
import { useMonitorStore } from "@/stores/monitorStore";
import { onHeartbeat, onPortStatusChange, onAlert } from "@/lib/socket";

export interface AlertNotification {
  type: string;
  message: string;
  severity: "info" | "warning" | "critical";
  timestamp: string;
}

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const { updateServerStatus, updatePortStatus } = useMonitorStore();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    setIsConnected(socket.connected);

    const unsubHeartbeat = onHeartbeat((payload) => {
      updateServerStatus(payload.serverId, payload.status);
    });

    const unsubPortStatus = onPortStatusChange((payload) => {
      updatePortStatus(
        payload.portId,
        payload.result.status,
        payload.result.responseTime,
      );
    });

    const unsubAlert = onAlert((payload) => {
      setAlerts((prev) => [
        { ...payload, timestamp: new Date().toISOString() },
        ...prev.slice(0, 49),
      ]);
    });

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      unsubHeartbeat();
      unsubPortStatus();
      unsubAlert();
    };
  }, [updateServerStatus, updatePortStatus]);

  const clearAlerts = () => setAlerts([]);

  return { isConnected, alerts, clearAlerts };
}
