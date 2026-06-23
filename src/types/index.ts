export interface User {
  id: string
  email: string
  username: string
  createdAt: string
}

export interface Server {
  id: string
  name: string
  hostname: string
  status: 'online' | 'offline' | 'warning'
  lastHeartbeat: string
  userId: string
}

export interface Port {
  id: string
  portNumber: number
  protocol: 'TCP' | 'UDP'
  label: string
  status: 'open' | 'closed' | 'filtered'
  serverId: string
  lastChecked: string
  responseTime?: number
}

export interface PortLog {
  id: string
  portId: string
  portNumber: number
  status: 'open' | 'closed' | 'filtered'
  responseTime: number
  checkedAt: string
  errorMessage?: string
}

export interface AISolution {
  id: string
  portLogId: string
  portNumber: number
  analysis: string
  solution: string
  confidence: number
  createdAt: string
  isFromCache: boolean
}

export interface AuthResponse {
  token: string
  user: User
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface HeartbeatPayload {
  serverId: string
  status: 'online' | 'offline' | 'warning'
  timestamp: string
}

export interface PortScanResult {
  portNumber: number
  status: 'open' | 'closed' | 'filtered'
  responseTime: number
  protocol: 'TCP' | 'UDP'
}
