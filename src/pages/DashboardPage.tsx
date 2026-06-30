import { useEffect, useState } from "react";
import {
  Server,
  Network,
  CircleDot,
  Brain,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatRelativeTime } from "@/lib/utils";
import { useMonitorStore } from "@/stores/monitorStore";
import { logsAPI, aiAPI, portsAPI } from "@/lib/api";
import { onNewPortLog } from "@/lib/socket";
import type { PortLog } from "@/types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const statusConfig = {
  online: { variant: "success" as const, label: "Online" },
  warning: { variant: "warning" as const, label: "Warning" },
  offline: { variant: "destructive" as const, label: "Offline" },
};

const logStatusConfig = {
  open: { variant: "success" as const, label: "Open" },
  closed: { variant: "destructive" as const, label: "Closed" },
  filtered: { variant: "warning" as const, label: "Filtered" },
};

export default function DashboardPage() {
  const {
    servers,
    ports,
    fetchServers,
    fetchPorts,
    selectedServerId,
    setSelectedServer,
  } = useMonitorStore();

  const [recentLogs, setRecentLogs] = useState<PortLog[]>([]);
  const [aiCount, setAiCount] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);

  // 1. Fetch servers on component mount
  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  // 2. Default to select the first server if none selected
  useEffect(() => {
    if (servers.length > 0 && !selectedServerId) {
      setSelectedServer(servers[0].id);
    }
  }, [servers, selectedServerId, setSelectedServer]);

  // 3. Fetch ports and aggregate logs when selected server changes
  useEffect(() => {
    if (!selectedServerId) return;

    const loadDashboardData = async () => {
      try {
        // A. Trigger store fetch to update sidebar/overall list
        await fetchPorts(selectedServerId);

        // B. Fetch ports directly from API to run synchronous logic
        const portsResponse = await portsAPI.getAll(selectedServerId);
        const activePorts = portsResponse.data.data || [];

        if (activePorts.length > 0) {
          // C. Fetch logs for all ports of the server in parallel
          const logsPromises = activePorts.map((port: any) =>
            logsAPI.getAll(port.id, { limit: 10 }),
          );
          const logsResponses = await Promise.all(logsPromises);
          const allLogs: PortLog[] = logsResponses.flatMap(
            (res) => res.data.data?.logs || [],
          );

          // D. Sort logs descending by checkedAt time
          allLogs.sort(
            (a, b) =>
              new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime(),
          );

          setRecentLogs(allLogs.slice(0, 10));

          // E. Group logs by checkedAt seconds timestamp to align parallel port scan intervals
          const groups: { [key: string]: any } = {};
          allLogs.forEach((logItem) => {
            const timeKey = new Date(logItem.checkedAt)
              .toISOString()
              .slice(0, 19);
            if (!groups[timeKey]) {
              groups[timeKey] = {
                time: new Date(logItem.checkedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                }),
              };
            }
            groups[timeKey][`Port ${logItem.portNumber}`] =
              logItem.responseTime || 0;
          });

          // Sort chronological and take the last 8 entries
          const sortedChartData = Object.keys(groups)
            .sort()
            .map((key) => groups[key])
            .slice(-8);

          setChartData(sortedChartData);
        } else {
          setRecentLogs([]);
          setChartData([]);
        }
      } catch (error) {
        console.error("Failed to load dashboard logs", error);
      }
    };

    loadDashboardData();
  }, [selectedServerId, fetchPorts]);

  // Listen to live socket new-log events to update recentLogs and chartData dynamically
  useEffect(() => {
    if (!selectedServerId) return;

    const unsub = onNewPortLog((payload) => {
      // Check if the log belongs to a port of our currently selected server
      const targetPort = ports.find((p) => p.id === payload.portId);
      if (!targetPort) return;

      // A. Prepend log to recentLogs, keeping max 10
      setRecentLogs((prev) => {
        // Prevent duplicate logs from being added
        if (prev.some((l) => l.id === payload.log.id)) return prev;
        const newRecent = [payload.log, ...prev];
        return newRecent.slice(0, 10);
      });

      // B. Update chartData in real-time
      setChartData((prev) => {
        const timeStr = new Date(payload.log.checkedAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });

        // Check if there is already a node for this timeKey
        const existingNodeIdx = prev.findIndex((node) => node.time === timeStr);

        if (existingNodeIdx > -1) {
          const updated = [...prev];
          updated[existingNodeIdx] = {
            ...updated[existingNodeIdx],
            [`Port ${payload.log.portNumber}`]: payload.log.responseTime || 0,
          };
          return updated;
        } else {
          const newNode = {
            time: timeStr,
            [`Port ${payload.log.portNumber}`]: payload.log.responseTime || 0,
          };
          const newChartData = [...prev, newNode];
          return newChartData.slice(-8); // Keep last 8 entries
        }
      });
    });

    return () => unsub();
  }, [selectedServerId, ports]);

  // 4. Fetch total count of AI solutions
  useEffect(() => {
    const fetchAiCount = async () => {
      try {
        const res = await aiAPI.getSolutions({ limit: 1 });
        setAiCount(res.data.count || res.data.data?.length || 0);
      } catch {
        // Fallback safely
      }
    };
    fetchAiCount();
  }, [recentLogs]);

  const stats = [
    {
      label: "Total Servers",
      value: servers.length,
      icon: Server,
      trend: `${servers.filter((s) => s.status === "online").length} nodes online`,
      color: "text-primary",
    },
    {
      label: "Active Ports",
      value: ports.length,
      icon: Network,
      trend: "Total monitored targets",
      color: "text-chart-3",
    },
    {
      label: "Open Ports",
      value: ports.filter((p) => p.status === "open").length,
      icon: CircleDot,
      trend:
        ports.length > 0
          ? `${Math.round(
              (ports.filter((p) => p.status === "open").length / ports.length) *
                100,
            )}% accessible`
          : "0% uptime",
      color: "text-success",
    },
    {
      label: "AI Analyses",
      value: aiCount,
      icon: Brain,
      trend: "Solutions generated",
      color: "text-accent",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 animate-fade-in">
        {stats.map((stat) => (
          <Card key={stat.label} className="group relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ArrowUpRight className="h-3 w-3 text-success" />
                    <span>{stat.trend}</span>
                  </div>
                </div>
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-xl bg-muted/80",
                    stat.color,
                  )}
                >
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Live Servers */}
      <div className="animate-fade-in" style={{ animationDelay: "100ms" }}>
        <h2 className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
          </span>
          Live Servers (Select one to inspect)
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {servers.map((server) => {
            const isSelected = selectedServerId === server.id;
            const cfg = statusConfig[server.status || "offline"];
            return (
              <Card
                key={server.id}
                onClick={() => setSelectedServer(server.id)}
                className={cn(
                  "relative cursor-pointer transition-all duration-300",
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/35"
                    : "hover:border-muted-foreground/35",
                )}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">
                        {server.name}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {server.hostname}
                      </p>
                    </div>
                    <Badge
                      variant={cfg.variant}
                      pulse={server.status === "online"}
                    >
                      {cfg.label}
                    </Badge>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Last heartbeat: {formatRelativeTime(server.lastHeartbeat)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Response Time Chart */}
      <Card className="animate-fade-in" style={{ animationDelay: "200ms" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Response Latency Timeline (ms)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#10141f",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#e2e8f0",
                      fontSize: "12px",
                    }}
                  />
                  <Legend />
                  {ports.map((port, idx) => {
                    const colors = [
                      "#2496ed",
                      "#1d63ed",
                      "#4ade80",
                      "#facc15",
                      "#f43f5e",
                    ];
                    const color = colors[idx % colors.length];
                    return (
                      <Area
                        key={port.id}
                        type="monotone"
                        dataKey={`Port ${port.portNumber}`}
                        name={`Port ${port.portNumber}`}
                        stroke={color}
                        fill={color}
                        fillOpacity={0.1}
                        strokeWidth={2}
                      />
                    );
                  })}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No telemetry chart data available for the selected server.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Logs */}
      <Card className="animate-fade-in" style={{ animationDelay: "300ms" }}>
        <CardHeader>
          <CardTitle>Recent Scan Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {recentLogs.length > 0 ? (
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
                  {recentLogs.map((log) => {
                    const cfg = logStatusConfig[
                      log.status as keyof typeof logStatusConfig
                    ] || {
                      variant: "outline" as const,
                      label: log.status || "Unknown",
                    };
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
                          {log.responseTime > 0 ? `${log.responseTime}ms` : "—"}
                        </td>
                        <td className="py-3 text-xs text-destructive">
                          {log.errorMessage || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground">
                No recent port scan activity logs.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
