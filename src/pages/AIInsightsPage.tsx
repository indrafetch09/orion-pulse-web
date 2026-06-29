import { useState, useEffect, useMemo } from "react";
import {
  Brain,
  Search,
  Database,
  Clock,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useMonitorStore } from "@/stores/monitorStore";
import { aiAPI } from "@/lib/api";
import type { AISolution } from "@/types";

function getConfidenceColor(confidence: number): string {
  if (confidence >= 90) return "text-success";
  if (confidence >= 70) return "text-primary";
  return "text-warning";
}

function getConfidenceBg(confidence: number): string {
  if (confidence >= 90) return "bg-success/10 border-success/20";
  if (confidence >= 70) return "bg-primary/10 border-primary/20";
  return "bg-warning/10 border-warning/20";
}

export default function AIInsightsPage() {
  const {
    servers,
    ports,
    fetchPorts,
    selectedServerId,
    setSelectedServer,
    fetchServers,
  } = useMonitorStore();

  const [search, setSearch] = useState("");
  const [portFilter, setPortFilter] = useState<string>("All"); // "All" or portId string
  const [solutions, setSolutions] = useState<AISolution[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Fetch servers on load
  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  // 2. Default to select first server if none selected
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
    }
  }, [selectedServerId, fetchPorts]);

  // 4. Fetch AI Solutions
  useEffect(() => {
    const loadSolutions = async () => {
      if (!selectedServerId) return;
      setLoading(true);
      try {
        const params: any = {};
        if (portFilter !== "All") {
          params.portId = portFilter;
        }
        const res = await aiAPI.getSolutions(params);
        setSolutions(res.data.data);
      } catch (err) {
        console.error("Failed to load AI solutions", err);
      } finally {
        setLoading(false);
      }
    };
    loadSolutions();
  }, [selectedServerId, portFilter]);

  const filteredSolutions = useMemo(() => {
    return solutions.filter((sol) => {
      const matchesSearch =
        search === "" ||
        sol.analysis.toLowerCase().includes(search.toLowerCase()) ||
        sol.solution.toLowerCase().includes(search.toLowerCase()) ||
        sol.portNumber.toString().includes(search);
      return matchesSearch;
    });
  }, [solutions, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
        <div className="flex flex-col gap-1.5">
          <h1 className="flex items-center gap-3 text-2xl font-bold text-foreground">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Brain className="h-5 w-5 text-white" />
            </div>
            AI Insights Center
          </h1>
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search diagnostic insights..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-9"
            />
          </div>
          <select
            value={portFilter}
            onChange={(e) => setPortFilter(e.target.value)}
            className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
          >
            <option value="All">All Ports</option>
            {ports.map((port) => (
              <option key={port.id} value={port.id}>
                Port {port.portNumber}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* AI Solutions Grid */}
      <div className="space-y-4">
        {filteredSolutions.map((sol) => (
          <Card
            key={sol.id}
            className="overflow-hidden border border-border bg-card"
          >
            <CardHeader className="border-b border-border bg-muted/20 px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="font-mono text-xs text-primary"
                  >
                    Port {sol.portNumber}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatRelativeTime(sol.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {sol.isFromCache && (
                    <Badge
                      variant="outline"
                      className="text-[10px] text-muted-foreground"
                    >
                      <Database className="mr-1 h-3 w-3" /> Cached
                    </Badge>
                  )}
                  {sol.analysis.includes("Fallback") && (
                    <Badge variant="warning" className="text-[10px]">
                      Offline Fallback
                    </Badge>
                  )}
                  <div
                    className={cn(
                      "flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                      getConfidenceBg(sol.confidence),
                      getConfidenceColor(sol.confidence),
                    )}
                  >
                    <Sparkles className="h-3 w-3" />
                    {sol.confidence}% Confidence
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="mb-1 text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Brain className="h-4 w-4 text-primary" /> Anomaly Analysis
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {sol.analysis}
                </p>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <h3 className="mb-2 text-sm font-semibold text-foreground flex items-center gap-1.5">
                  🔧 Recommended Troubleshooting Steps
                </h3>
                <div className="whitespace-pre-line font-mono text-xs leading-relaxed text-foreground/95">
                  {sol.solution}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredSolutions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-card rounded-lg border border-border">
            <AlertCircle className="mb-3 h-10 w-10 opacity-40" />
            <p className="text-lg font-medium">No diagnostics found</p>
            <p className="text-sm">
              {loading
                ? "Loading insights..."
                : "Ensure your ports have failed tests to trigger Gemini diagnostics."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
