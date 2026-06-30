import { useState, useEffect, useMemo } from "react";
import {
  RefreshCw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMonitorStore } from "@/stores/monitorStore";
import { logsAPI } from "@/lib/api";
import { onNewPortLog } from "@/lib/socket";
import type { PortLog } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const statusConfig = {
  open: { variant: "success" as const, label: "Open" },
  closed: { variant: "destructive" as const, label: "Closed" },
  filtered: { variant: "warning" as const, label: "Filtered" },
};

const statusFilters = ["All", "Open", "Closed", "Filtered"] as const;
const ITEMS_PER_PAGE = 10;

export default function LogsPage() {
  const {
    servers,
    ports,
    fetchPorts,
    selectedServerId,
    setSelectedServer,
    fetchServers,
  } = useMonitorStore();

  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [portFilter, setPortFilter] = useState<string>("All"); // "All" or portId string
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [rawLogs, setRawLogs] = useState<PortLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // 1. Fetch servers on load
  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  // 2. Select first server by default if none selected
  useEffect(() => {
    if (servers.length > 0 && !selectedServerId) {
      setSelectedServer(servers[0].id);
    }
  }, [servers, selectedServerId, setSelectedServer]);

  // 3. Fetch ports when selected server changes
  useEffect(() => {
    if (selectedServerId) {
      fetchPorts(selectedServerId);
      setPortFilter("All");
      setPage(1);
    }
  }, [selectedServerId, fetchPorts]);

  // 4. Fetch logs based on server/port filter
  useEffect(() => {
    let active = true;
    const loadLogs = async () => {
      if (!selectedServerId) return;
      setLoading(true);
      try {
        if (portFilter !== "All") {
          // Fetch specifically for this port
          const res = await logsAPI.getAll(portFilter, { limit: 100 });
          if (active) setRawLogs(res.data.data?.logs || []);
        } else {
          // Fetch for all ports of this server and merge
          if (ports.length > 0) {
            const logsPromises = ports.map((port) =>
              logsAPI.getAll(port.id, { limit: 30 })
            );
            const logsResponses = await Promise.all(logsPromises);
            const allLogs: PortLog[] = logsResponses.flatMap(
              (res) => res.data.data?.logs || []
            );
            // Sort combined logs descending
            allLogs.sort(
              (a, b) =>
                new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime()
            );
            if (active) setRawLogs(allLogs);
          } else {
            if (active) setRawLogs([]);
          }
        }
      } catch (err) {
        console.error("Failed to load logs", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadLogs();

    // Setup auto-refresh polling every 5s if enabled
    let pollInterval: any = null;
    if (autoRefresh) {
      pollInterval = setInterval(loadLogs, 5000);
    }

    return () => {
      active = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [selectedServerId, ports, portFilter, autoRefresh, reloadKey]);

  // Listen to live socket logs in real-time
  useEffect(() => {
    if (!selectedServerId) return;

    const unsub = onNewPortLog((payload) => {
      // Check if the log belongs to a port of our currently selected server
      const targetPort = ports.find((p) => p.id === payload.portId);
      if (!targetPort) return;

      // Check if log is already in rawLogs list
      setRawLogs((prev) => {
        if (prev.some((l) => l.id === payload.log.id)) return prev;

        // If filtering for a specific port, check if it matches the current filter
        if (portFilter !== "All" && payload.portId !== portFilter) {
          return prev;
        }

        const newRaw = [payload.log, ...prev];
        return newRaw;
      });
    });

    return () => unsub();
  }, [selectedServerId, ports, portFilter]);

  const filteredLogs = useMemo(() => {
    return rawLogs.filter((log) => {
      return (
        statusFilter === "All" || log.status === statusFilter.toLowerCase()
      );
    });
  }, [rawLogs, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredLogs.length / ITEMS_PER_PAGE),
  );
  const paginatedLogs = filteredLogs.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  const handleClearLogs = async () => {
    try {
      if (portFilter !== "All") {
        await logsAPI.clear(portFilter);
      } else {
        await Promise.all(ports.map((p) => logsAPI.clear(p.id)));
      }
      setClearDialogOpen(false);
      setRawLogs([]);
      setReloadKey((prev) => prev + 1);
    } catch (err) {
      console.error("Failed to clear logs", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold text-foreground">Scan Log History</h1>
          {servers.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Server:</span>
              <select
                value={selectedServerId || ""}
                onChange={(e) => setSelectedServer(e.target.value)}
                className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
              >
                {servers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.hostname})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-all cursor-pointer border",
              autoRefresh
                ? "border-success/30 bg-success/10 text-success"
                : "border-border bg-muted text-muted-foreground",
            )}
          >
            <RefreshCw
              className={cn("h-3 w-3", autoRefresh && "animate-spin")}
              style={autoRefresh ? { animationDuration: "3s" } : undefined}
            />
            Auto-refresh {autoRefresh ? "On" : "Off"}
          </button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setClearDialogOpen(true)}
            disabled={rawLogs.length === 0}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear Logs
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="animate-fade-in" style={{ animationDelay: "50ms" }}>
        <CardContent className="p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setStatusFilter(filter);
                  setPage(1);
                }}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer",
                  statusFilter === filter
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Filter by Port:</span>
            <select
              value={portFilter}
              onChange={(e) => {
                setPortFilter(e.target.value);
                setPage(1);
              }}
              className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
            >
              <option value="All">All Ports</option>
              {ports.map((port) => (
                <option key={port.id} value={port.id}>
                  Port {port.portNumber} ({port.label})
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="animate-fade-in" style={{ animationDelay: "100ms" }}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {paginatedLogs.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="p-4">Time</th>
                    <th className="p-4">Port Number</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Response Latency</th>
                    <th className="p-4">Error / Diagnostic Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedLogs.map((log) => {
                    const cfg = statusConfig[log.status as keyof typeof statusConfig] || {
                      variant: "outline" as const,
                      label: log.status || "Offline",
                    };
                    return (
                      <tr key={log.id} className="hover:bg-muted/30">
                        <td className="p-4 text-muted-foreground">
                          {formatRelativeTime(log.checkedAt)}
                        </td>
                        <td className="p-4 font-mono font-medium text-foreground">
                          {log.portNumber}
                        </td>
                        <td className="p-4">
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {log.responseTime > 0
                            ? `${log.responseTime}ms`
                            : "—"}
                        </td>
                        <td className="p-4 text-xs text-destructive">
                          {log.errorMessage || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <AlertCircle className="mb-3 h-10 w-10 opacity-40" />
                <p className="text-lg font-medium">No logs available</p>
                <p className="text-sm">
                  {loading ? "Loading logs..." : "Ensure your telemetry daemon is running and scanning ports."}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pagination Footer */}
      {filteredLogs.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between animate-fade-in">
          <p className="text-xs text-muted-foreground">
            Showing {(page - 1) * ITEMS_PER_PAGE + 1}–
            {Math.min(page * ITEMS_PER_PAGE, filteredLogs.length)} of{" "}
            {filteredLogs.length} logs
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Clear Logs Confirmation Dialog */}
      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear History Logs</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All port scan history logs will be permanently
              purged from the database.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearLogs}
            >
              <Trash2 className="h-4 w-4" />
              Delete Logs
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
