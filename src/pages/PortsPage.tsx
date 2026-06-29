import { useState, useEffect } from "react";
import { RefreshCw, Trash2, Plus, Search } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useMonitorStore } from "@/stores/monitorStore";
import { portsAPI } from "@/lib/api";
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

const filters = ["All", "Open", "Closed", "Filtered"] as const;

export default function PortsPage() {
  const {
    servers,
    ports,
    fetchPorts,
    addPort,
    removePort,
    selectedServerId,
    setSelectedServer,
    fetchServers,
  } = useMonitorStore();

  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [newPort, setNewPort] = useState({
    portNumber: "",
    protocol: "TCP" as "TCP" | "UDP",
    label: "",
  });

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
    }
  }, [selectedServerId, fetchPorts]);

  const filteredPorts = ports.filter((port) => {
    const matchesFilter =
      activeFilter === "All" || port.status === activeFilter.toLowerCase();
    const matchesSearch =
      search === "" ||
      port.label.toLowerCase().includes(search.toLowerCase()) ||
      port.portNumber.toString().includes(search);
    return matchesFilter && matchesSearch;
  });

  const handleAddPort = async () => {
    if (!selectedServerId) return;
    const portNum = parseInt(newPort.portNumber);
    if (isNaN(portNum) || !newPort.label) return;

    try {
      await addPort(selectedServerId, {
        portNumber: portNum,
        protocol: newPort.protocol,
        label: newPort.label,
      });
      setDialogOpen(false);
      setNewPort({ portNumber: "", protocol: "TCP", label: "" });
    } catch (err) {
      console.error(err);
    }
  };

  const handleScanPort = async (id: string) => {
    setScanningId(id);
    try {
      await portsAPI.scan(id);
      // Briefly show scan active state, socket events will trigger data refresh
      setTimeout(() => setScanningId(null), 1000);
    } catch (err) {
      console.error("Failed to trigger instant scan", err);
      setScanningId(null);
    }
  };

  const handleDeletePort = async (id: string) => {
    if (confirm("Are you sure you want to stop monitoring this port?")) {
      try {
        await removePort(id);
      } catch (err) {
        console.error("Failed to delete port", err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold text-foreground">Port Monitoring Center</h1>
          {servers.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Select Active Server:</span>
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search ports..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56 pl-9"
            />
          </div>
          <Button onClick={() => setDialogOpen(true)} disabled={!selectedServerId}>
            <Plus className="h-4 w-4" />
            Add Port
          </Button>
        </div>
      </div>

      {/* Filter Pills */}
      <div
        className="flex gap-2 animate-fade-in"
        style={{ animationDelay: "50ms" }}
      >
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer",
              activeFilter === filter
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Port Cards Grid */}
      <div
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 animate-fade-in"
        style={{ animationDelay: "100ms" }}
      >
        {filteredPorts.map((port) => {
          const cfg = statusConfig[port.status as keyof typeof statusConfig] || {
            variant: "outline" as const,
            label: port.status || "Offline",
          };
          const isScanning = scanningId === port.id;
          return (
            <Card key={port.id} className="group relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-foreground">
                        {port.portNumber}
                      </span>
                      <Badge
                        variant={
                          port.protocol === "TCP" ? "default" : "outline"
                        }
                        className="text-[10px]"
                      >
                        {port.protocol}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {port.label}
                    </p>
                  </div>
                  <Badge variant={cfg.variant} pulse={port.status === "open"}>
                    {cfg.label}
                  </Badge>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Response:{" "}
                      <span className="font-mono text-foreground">
                        {port.responseTime !== undefined && port.responseTime > 0 ? `${port.responseTime}ms` : "—"}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Checked: {formatRelativeTime(port.lastChecked)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleScanPort(port.id)}
                      disabled={isScanning}
                    >
                      <RefreshCw className={cn("h-3.5 w-3.5", isScanning && "animate-spin")} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeletePort(port.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredPorts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Search className="mb-3 h-10 w-10 opacity-40" />
          <p className="text-lg font-medium">No ports found</p>
          <p className="text-sm">Try adjusting your search or check that your agent is running.</p>
        </div>
      )}

      {/* Add Port Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Port</DialogTitle>
            <DialogDescription>
              Add a port to monitor on your local network.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Port Number
              </label>
              <Input
                type="number"
                placeholder="3000"
                value={newPort.portNumber}
                onChange={(e) =>
                  setNewPort({ ...newPort, portNumber: e.target.value })
                }
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Protocol
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={cn(
                    "flex-1 rounded-md py-2 text-sm font-medium transition-all duration-200 cursor-pointer border",
                    newPort.protocol === "TCP"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-transparent text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => setNewPort({ ...newPort, protocol: "TCP" })}
                >
                  TCP
                </button>
                <button
                  type="button"
                  className={cn(
                    "flex-1 rounded-md py-2 text-sm font-medium transition-all duration-200 cursor-pointer border",
                    newPort.protocol === "UDP"
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border bg-transparent text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => setNewPort({ ...newPort, protocol: "UDP" })}
                >
                  UDP
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Label
              </label>
              <Input
                placeholder="My Service"
                value={newPort.label}
                onChange={(e) =>
                  setNewPort({ ...newPort, label: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPort}>Add Port</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
