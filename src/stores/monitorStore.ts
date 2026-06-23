import { create } from 'zustand'
import type { Server, Port, PortLog } from '@/types'
import { serversAPI, portsAPI, logsAPI } from '@/lib/api'

interface MonitorState {
  servers: Server[]
  ports: Port[]
  logs: PortLog[]
  selectedServerId: string | null
  isLoading: boolean
  error: string | null
  fetchServers: () => Promise<void>
  fetchPorts: (serverId: string) => Promise<void>
  fetchLogs: (portId: string) => Promise<void>
  addPort: (serverId: string, data: { portNumber: number; protocol: string; label: string }) => Promise<void>
  removePort: (id: string) => Promise<void>
  setSelectedServer: (id: string | null) => void
  updateServerStatus: (serverId: string, status: 'online' | 'offline' | 'warning') => void
  updatePortStatus: (portId: string, status: 'open' | 'closed' | 'filtered', responseTime?: number) => void
}

export const useMonitorStore = create<MonitorState>((set, get) => ({
  servers: [],
  ports: [],
  logs: [],
  selectedServerId: null,
  isLoading: false,
  error: null,

  fetchServers: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await serversAPI.getAll()
      set({ servers: response.data.data, isLoading: false })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch servers'
      set({ error: message, isLoading: false })
    }
  },

  fetchPorts: async (serverId: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await portsAPI.getAll(serverId)
      set({ ports: response.data.data, isLoading: false })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch ports'
      set({ error: message, isLoading: false })
    }
  },

  fetchLogs: async (portId: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await logsAPI.getAll(portId)
      set({ logs: response.data.data, isLoading: false })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch logs'
      set({ error: message, isLoading: false })
    }
  },

  addPort: async (serverId: string, data) => {
    try {
      await portsAPI.add(serverId, data)
      await get().fetchPorts(serverId)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to add port'
      set({ error: message })
    }
  },

  removePort: async (id: string) => {
    try {
      await portsAPI.remove(id)
      const serverId = get().selectedServerId
      if (serverId) await get().fetchPorts(serverId)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to remove port'
      set({ error: message })
    }
  },

  setSelectedServer: (id) => set({ selectedServerId: id }),

  updateServerStatus: (serverId, status) => {
    set((state) => ({
      servers: state.servers.map((s) =>
        s.id === serverId ? { ...s, status, lastHeartbeat: new Date().toISOString() } : s
      ),
    }))
  },

  updatePortStatus: (portId, status, responseTime) => {
    set((state) => ({
      ports: state.ports.map((p) =>
        p.id === portId
          ? { ...p, status, responseTime: responseTime ?? p.responseTime, lastChecked: new Date().toISOString() }
          : p
      ),
    }))
  },
}))
