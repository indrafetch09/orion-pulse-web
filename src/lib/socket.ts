import { io, type Socket } from "socket.io-client";
import type { HeartbeatPayload, PortScanResult } from "@/types";

const SOCKET_URL = import.meta.env.VITE_WS_URL || "http://localhost:8080";

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(token: string): Socket {
  if (socket?.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 3000,
  });

  socket.on("connect", () => {
    console.log("[OrionPulse] Socket connected");
  });

  socket.on("disconnect", (reason) => {
    console.log("[OrionPulse] Socket disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("[OrionPulse] Socket connection error:", error.message);
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function onHeartbeat(
  callback: (payload: HeartbeatPayload) => void,
): () => void {
  const listener = (payload: any) => {
    callback({
      serverId: payload.serverId,
      status: payload.status,
      timestamp: payload.lastHeartbeat || new Date().toISOString(),
    });
  };
  socket?.on("server-status-updated", listener);
  return () => {
    socket?.off("server-status-updated", listener);
  };
}

export function onPortStatusChange(
  callback: (payload: { portId: string; result: PortScanResult }) => void,
): () => void {
  const updateListener = (payload: { serverId: string; port: any }) => {
    callback({
      portId: payload.port.id,
      result: {
        portNumber: payload.port.portNumber,
        status: payload.port.status,
        responseTime: payload.port.responseTime || 0,
        protocol: payload.port.protocol || "TCP",
      },
    });
  };

  const logListener = (payload: { portId: string; log: any }) => {
    callback({
      portId: payload.portId,
      result: {
        portNumber: payload.log.portNumber,
        status: payload.log.status,
        responseTime: payload.log.responseTime || 0,
        protocol: payload.log.protocol || "TCP",
      },
    });
  };

  socket?.on("port-updated", updateListener);
  socket?.on("new-port-log", logListener);
  return () => {
    socket?.off("port-updated", updateListener);
    socket?.off("new-port-log", logListener);
  };
}

export function onAlert(
  callback: (payload: {
    type: string;
    message: string;
    severity: "info" | "warning" | "critical";
  }) => void,
): () => void {
  socket?.on("alert", callback);
  return () => {
    socket?.off("alert", callback);
  };
}
