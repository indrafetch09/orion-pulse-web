import { io, type Socket } from "socket.io-client";
import type { HeartbeatPayload, PortScanResult } from "@/types";

// ponytail: same-origin in prod, env var only for local dev
const SOCKET_URL = import.meta.env.VITE_WS_URL || "";

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
    console.log("[Orionpulse] Socket connected");
    // Join the dashboards room to receive real-time port/log/server broadcasts
    socket?.emit("join-dashboard");
  });

  socket.on("disconnect", (reason) => {
    console.log("[Orionpulse] Socket disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("[Orionpulse] Socket connection error:", error.message);
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
    const portId = payload.port?.id || payload.port?._id;
    if (!portId) return;
    callback({
      portId,
      result: {
        portNumber: payload.port.portNumber,
        status: payload.port.status,
        responseTime: payload.port.responseTime || 0,
        protocol: payload.port.protocol || "TCP",
      },
    });
  };

  const logListener = (payload: { portId: string; log: any }) => {
    const portId =
      payload.portId || payload.log?.portId || payload.log?.portId?._id;
    if (!portId) return;
    callback({
      portId,
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

export function onNewPortLog(
  callback: (payload: { portId: string; log: any }) => void,
): () => void {
  const listener = (payload: any) => {
    callback({
      portId: payload.portId,
      log: {
        id: payload.log?.id || payload.log?._id,
        portId: payload.log?.portId,
        portNumber: payload.log?.portNumber,
        status: payload.log?.status,
        responseTime: payload.log?.responseTime || 0,
        checkedAt: payload.log?.checkedAt,
        errorMessage: payload.log?.errorMessage || "",
      },
    });
  };
  socket?.on("new-port-log", listener);
  return () => {
    socket?.off("new-port-log", listener);
  };
}
