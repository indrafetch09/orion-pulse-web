import { useState, useMemo } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { PortLog } from "@/types";

const mockLogs: PortLog[] = Array.from({ length: 20 }, (_, i) => ({
  id: `log-${i}`,
  portId: `p${(i % 4) + 1}`,
  portNumber: [3000, 8080, 5432, 3306][i % 4],
  status: (["open", "open", "closed", "open", "filtered", "open"] as const)[
    i % 6
  ],
  responseTime: Math.floor(Math.random() * 50) + 5,
  checkedAt: new Date(Date.now() - i * 30000).toISOString(),
  errorMessage: i % 5 === 0 ? "Connection timeout" : undefined,
}));

const statusConfig = {
  open: { variant: "success" as const, label: "Open" },
  closed: { variant: "destructive" as const, label: "Closed" },
  filtered: { variant: "warning" as const, label: "Filtered" },
};

const statusFilters = ["All", "Open", "Closed", "Filtered"] as const;
const portFilters = ["All", 3000, 8080, 5432, 3306] as const;

const ITEMS_PER_PAGE = 10;

export default function LogsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [portFilter, setPortFilter] = useState<number | "All">("All");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [page, setPage] = useState(1);

  const filteredLogs = useMemo(() => {
    return mockLogs.filter((log) => {
      const matchesStatus =
        statusFilter === "All" || log.status === statusFilter.toLowerCase();
      const matchesPort = portFilter === "All" || log.portNumber === portFilter;
      return matchesStatus && matchesPort;
    });
  }, [statusFilter, portFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredLogs.length / ITEMS_PER_PAGE),
  );
  const paginatedLogs = filteredLogs.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Scan Logs</h1>
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
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear Logs
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div
        className="flex flex-wrap gap-4 animate-fade-in"
        style={{ animationDelay: "50ms" }}
      >
        <div className="space-y-1.5">
          <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Status
          </label>
          <div className="flex gap-1.5">
            {statusFilters.map((f) => (
              <button
                key={f}
                onClick={() => {
                  setStatusFilter(f);
                  setPage(1);
                }}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer",
                  statusFilter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Port
          </label>
          <div className="flex gap-1.5">
            {portFilters.map((f) => (
              <button
                key={f}
                onClick={() => {
                  setPortFilter(f);
                  setPage(1);
                }}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer font-mono",
                  portFilter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                {f === "All" ? "All" : f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Log Table */}
      <Card className="animate-fade-in" style={{ animationDelay: "100ms" }}>
        <CardContent className="p-0">
          {paginatedLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <AlertCircle className="mb-3 h-10 w-10 opacity-40" />
              <p className="text-lg font-medium">No logs found</p>
              <p className="text-sm">No scan logs match the current filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="px-5 py-3">Time</th>
                    <th className="px-5 py-3">Port</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Response Time</th>
                    <th className="px-5 py-3">Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedLogs.map((log) => {
                    const cfg = statusConfig[log.status];
                    return (
                      <tr
                        key={log.id}
                        className={cn(
                          "transition-colors hover:bg-muted/30",
                          (log.status === "closed" ||
                            log.status === "filtered") &&
                            "border-l-2",
                          log.status === "closed" && "border-l-destructive/50",
                          log.status === "filtered" && "border-l-warning/50",
                        )}
                      >
                        <td className="px-5 py-3 text-muted-foreground">
                          {formatRelativeTime(log.checkedAt)}
                        </td>
                        <td className="px-5 py-3 font-mono font-medium text-foreground">
                          {log.portNumber}
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        </td>
                        <td className="px-5 py-3 font-mono text-muted-foreground">
                          {log.responseTime > 0 ? `${log.responseTime}ms` : "—"}
                        </td>
                        <td className="px-5 py-3 text-xs text-destructive">
                          {log.errorMessage ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
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
            <DialogTitle>Clear All Logs</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All scan logs will be permanently
              deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => setClearDialogOpen(false)}
            >
              <Trash2 className="h-4 w-4" />
              Delete All Logs
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
