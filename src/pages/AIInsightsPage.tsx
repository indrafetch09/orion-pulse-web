import { useState, useMemo } from 'react'
import { Brain, Search, Database, Clock, Sparkles } from 'lucide-react'
import { cn, formatRelativeTime } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import type { AISolution } from '@/types'

const mockSolutions: AISolution[] = [
  {
    id: 'ai-1',
    portLogId: 'log-3',
    portNumber: 5432,
    analysis: 'Port 5432 (PostgreSQL) has been consistently returning "Connection refused" errors for the past 15 minutes. This typically indicates the PostgreSQL service is not running or has crashed.',
    solution: '1. Check if PostgreSQL service is running: sudo systemctl status postgresql\n2. If stopped, restart it: sudo systemctl restart postgresql\n3. Check PostgreSQL logs: sudo tail -f /var/log/postgresql/postgresql-14-main.log\n4. Verify port binding: sudo netstat -tlnp | grep 5432',
    confidence: 92,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    isFromCache: false,
  },
  {
    id: 'ai-2',
    portLogId: 'log-5',
    portNumber: 3306,
    analysis: 'Port 3306 (MySQL) is showing "filtered" status which suggests a firewall rule is blocking incoming connections to the MySQL service.',
    solution: '1. Check firewall rules: sudo iptables -L -n | grep 3306\n2. Allow MySQL port: sudo ufw allow 3306/tcp\n3. Verify MySQL is listening: sudo ss -tlnp | grep 3306\n4. Check MySQL bind-address in /etc/mysql/mysql.conf.d/mysqld.cnf',
    confidence: 87,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    isFromCache: false,
  },
  {
    id: 'ai-3',
    portLogId: 'log-8',
    portNumber: 8080,
    analysis: 'Port 8080 (Express API) experienced intermittent timeouts. Response times spiked from average 35ms to over 500ms, indicating possible resource exhaustion or memory leak.',
    solution: '1. Monitor Node.js memory usage: node --inspect your-app.js\n2. Check for memory leaks using clinic.js: npx clinic doctor -- node server.js\n3. Review recent deployments for performance regressions\n4. Consider implementing connection pooling if not already in place',
    confidence: 78,
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    isFromCache: true,
  },
  {
    id: 'ai-4',
    portLogId: 'log-12',
    portNumber: 3000,
    analysis: 'Port 3000 (React Dev Server) went offline briefly. This is common during hot module replacement (HMR) recompilation and is expected behavior during development.',
    solution: 'No action required. This is normal behavior for Vite/React development servers during code changes. If the port remains down for extended periods:\n1. Check terminal for compilation errors\n2. Restart dev server: npm run dev\n3. Clear node_modules/.vite cache',
    confidence: 95,
    createdAt: new Date(Date.now() - 28800000).toISOString(),
    isFromCache: true,
  },
]

const portPills = ['All', 3000, 3306, 5432, 8080] as const

function getConfidenceColor(confidence: number): string {
  if (confidence >= 90) return 'text-success'
  if (confidence >= 70) return 'text-primary'
  return 'text-warning'
}

function getConfidenceBg(confidence: number): string {
  if (confidence >= 90) return 'bg-success/10 border-success/20'
  if (confidence >= 70) return 'bg-primary/10 border-primary/20'
  return 'bg-warning/10 border-warning/20'
}

export default function AIInsightsPage() {
  const [search, setSearch] = useState('')
  const [portFilter, setPortFilter] = useState<number | 'All'>('All')

  const filteredSolutions = useMemo(() => {
    return mockSolutions.filter((sol) => {
      const matchesPort = portFilter === 'All' || sol.portNumber === portFilter
      const matchesSearch =
        search === '' ||
        sol.analysis.toLowerCase().includes(search.toLowerCase()) ||
        sol.solution.toLowerCase().includes(search.toLowerCase()) ||
        sol.portNumber.toString().includes(search)
      return matchesPort && matchesSearch
    })
  }, [search, portFilter])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
        <h1 className="flex items-center gap-3 text-2xl font-bold text-foreground">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-primary">
            <Brain className="h-5 w-5 text-white" />
          </div>
          AI Insights
        </h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search analyses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pl-9"
          />
        </div>
      </div>

      {/* Port Filter Pills */}
      <div className="flex gap-2 animate-fade-in" style={{ animationDelay: '50ms' }}>
        {portPills.map((p) => (
          <button
            key={p}
            onClick={() => setPortFilter(p)}
            className={cn(
              'rounded-full px-4 py-1.5 text-xs font-medium transition-all cursor-pointer font-mono',
              portFilter === p
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            {p === 'All' ? 'All Ports' : `:${p}`}
          </button>
        ))}
      </div>

      {/* Solution Cards */}
      {filteredSolutions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-fade-in">
          <Brain className="mb-4 h-16 w-16 opacity-20" />
          <p className="text-lg font-medium">No AI analyses yet</p>
          <p className="text-sm">AI insights will appear here when port issues are detected.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSolutions.map((sol, idx) => (
            <Card
              key={sol.id}
              className="animate-fade-in overflow-hidden"
              style={{ animationDelay: `${100 + idx * 50}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="default" className="font-mono">
                    <Database className="mr-1 h-3 w-3" />
                    :{sol.portNumber}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatRelativeTime(sol.createdAt)}
                  </div>
                  <div
                    className={cn(
                      'flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                      getConfidenceBg(sol.confidence),
                      getConfidenceColor(sol.confidence)
                    )}
                  >
                    <Sparkles className="h-3 w-3" />
                    {sol.confidence}% confidence
                  </div>
                  {sol.isFromCache && (
                    <Badge variant="secondary" className="text-[10px]">
                      Cached
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Analysis */}
                <div>
                  <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Analysis
                  </span>
                  <p className="text-sm leading-relaxed text-foreground">
                    {sol.analysis}
                  </p>
                </div>

                <Separator />

                {/* Solution */}
                <div>
                  <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Solution
                  </span>
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <pre className="whitespace-pre-line font-mono text-xs leading-relaxed text-foreground">
                      {sol.solution}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
