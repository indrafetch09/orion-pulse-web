import { Server, Network, CircleDot, Brain, TrendingUp, ArrowUpRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn, formatRelativeTime } from '@/lib/utils'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

const mockStats = [
  { label: 'Total Servers', value: 4, icon: Server, trend: '+1 this week', color: 'text-primary' },
  { label: 'Active Ports', value: 12, icon: Network, trend: '3 added today', color: 'text-chart-3' },
  { label: 'Open Ports', value: 9, icon: CircleDot, trend: '75% uptime', color: 'text-success' },
  { label: 'AI Analyses', value: 23, icon: Brain, trend: '5 today', color: 'text-accent' },
]

const mockServers = [
  { id: '1', name: 'Web Frontend', hostname: 'localhost', status: 'online' as const, lastHeartbeat: new Date(Date.now() - 5000).toISOString(), userId: '1' },
  { id: '2', name: 'API Backend', hostname: 'localhost', status: 'online' as const, lastHeartbeat: new Date(Date.now() - 12000).toISOString(), userId: '1' },
  { id: '3', name: 'Database Server', hostname: 'localhost', status: 'warning' as const, lastHeartbeat: new Date(Date.now() - 45000).toISOString(), userId: '1' },
  { id: '4', name: 'Dev Environment', hostname: '192.168.1.100', status: 'offline' as const, lastHeartbeat: new Date(Date.now() - 300000).toISOString(), userId: '1' },
]

const mockChartData = [
  { time: '00:00', port3000: 12, port8080: 18, port5432: 8 },
  { time: '04:00', port3000: 15, port8080: 22, port5432: 10 },
  { time: '08:00', port3000: 8, port8080: 45, port5432: 12 },
  { time: '12:00', port3000: 25, port8080: 38, port5432: 15 },
  { time: '16:00', port3000: 18, port8080: 32, port5432: 9 },
  { time: '20:00', port3000: 22, port8080: 28, port5432: 11 },
  { time: 'Now', port3000: 14, port8080: 35, port5432: 13 },
]

const mockRecentLogs = [
  { id: '1', portId: 'p1', portNumber: 3000, status: 'open' as const, responseTime: 12, checkedAt: new Date(Date.now() - 10000).toISOString() },
  { id: '2', portId: 'p2', portNumber: 8080, status: 'open' as const, responseTime: 35, checkedAt: new Date(Date.now() - 20000).toISOString() },
  { id: '3', portId: 'p3', portNumber: 5432, status: 'closed' as const, responseTime: 0, checkedAt: new Date(Date.now() - 30000).toISOString(), errorMessage: 'Connection refused' },
  { id: '4', portId: 'p1', portNumber: 3000, status: 'open' as const, responseTime: 14, checkedAt: new Date(Date.now() - 40000).toISOString() },
  { id: '5', portId: 'p4', portNumber: 3306, status: 'filtered' as const, responseTime: 0, checkedAt: new Date(Date.now() - 50000).toISOString(), errorMessage: 'Firewall blocking' },
]

const statusConfig = {
  online: { variant: 'success' as const, label: 'Online' },
  warning: { variant: 'warning' as const, label: 'Warning' },
  offline: { variant: 'destructive' as const, label: 'Offline' },
}

const logStatusConfig = {
  open: { variant: 'success' as const, label: 'Open' },
  closed: { variant: 'destructive' as const, label: 'Closed' },
  filtered: { variant: 'warning' as const, label: 'Filtered' },
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 animate-fade-in">
        {mockStats.map((stat) => (
          <Card key={stat.label} className="group relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ArrowUpRight className="h-3 w-3 text-success" />
                    <span>{stat.trend}</span>
                  </div>
                </div>
                <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl bg-muted/80', stat.color)}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Live Servers */}
      <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
        <h2 className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
          </span>
          Live Servers
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {mockServers.map((server) => {
            const cfg = statusConfig[server.status]
            return (
              <Card
                key={server.id}
                className={cn(
                  'relative',
                  server.status === 'online' && 'shadow-success/5 hover:shadow-success/10'
                )}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{server.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{server.hostname}</p>
                    </div>
                    <Badge variant={cfg.variant} pulse={server.status === 'online'}>
                      {cfg.label}
                    </Badge>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Last heartbeat: {formatRelativeTime(server.lastHeartbeat)}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Response Time Chart */}
      <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Response Time (ms)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="grad3000" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="grad8080" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="grad5432" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'oklch(0.17 0.02 270)',
                    border: '1px solid oklch(0.3 0.02 270)',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="port3000"
                  name="Port 3000"
                  stroke="#38bdf8"
                  fill="url(#grad3000)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="port8080"
                  name="Port 8080"
                  stroke="#a855f7"
                  fill="url(#grad8080)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="port5432"
                  name="Port 5432"
                  stroke="#4ade80"
                  fill="url(#grad5432)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Logs */}
      <Card className="animate-fade-in" style={{ animationDelay: '300ms' }}>
        <CardHeader>
          <CardTitle>Recent Scan Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="pb-3 pr-4">Time</th>
                  <th className="pb-3 pr-4">Port</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Response</th>
                  <th className="pb-3">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mockRecentLogs.map((log) => {
                  const cfg = logStatusConfig[log.status]
                  return (
                    <tr key={log.id} className="group">
                      <td className="py-3 pr-4 text-muted-foreground">
                        {formatRelativeTime(log.checkedAt)}
                      </td>
                      <td className="py-3 pr-4 font-mono font-medium text-foreground">
                        {log.portNumber}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {log.responseTime > 0 ? `${log.responseTime}ms` : '—'}
                      </td>
                      <td className="py-3 text-xs text-destructive">
                        {log.errorMessage ?? '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
