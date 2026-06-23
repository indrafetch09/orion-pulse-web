import { io, type Socket } from 'socket.io-client'
import type { HeartbeatPayload, PortScanResult } from '@/types'

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080'

let socket: Socket | null = null

export function getSocket(): Socket | null {
  return socket
}

export function connectSocket(token: string): Socket {
  if (socket?.connected) {
    return socket
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 3000,
  })

  socket.on('connect', () => {
    console.log('[OrionPulse] Socket connected')
  })

  socket.on('disconnect', (reason) => {
    console.log('[OrionPulse] Socket disconnected:', reason)
  })

  socket.on('connect_error', (error) => {
    console.error('[OrionPulse] Socket connection error:', error.message)
  })

  return socket
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function onHeartbeat(callback: (payload: HeartbeatPayload) => void): () => void {
  socket?.on('heartbeat', callback)
  return () => {
    socket?.off('heartbeat', callback)
  }
}

export function onPortStatusChange(
  callback: (payload: { portId: string; result: PortScanResult }) => void
): () => void {
  socket?.on('port:status', callback)
  return () => {
    socket?.off('port:status', callback)
  }
}

export function onAlert(
  callback: (payload: { type: string; message: string; severity: 'info' | 'warning' | 'critical' }) => void
): () => void {
  socket?.on('alert', callback)
  return () => {
    socket?.off('alert', callback)
  }
}
