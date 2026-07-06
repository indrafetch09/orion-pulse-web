import { intro, outro, spinner, log, note, cancel } from "@clack/prompts";
import axios from "axios";
import os from "os";
import { io } from "socket.io-client";
import { readConfig, writeConfig } from "../services/config.js";
import { probeLocalPort } from "../utils/ping.js";

const BACKEND_URL =
  process.env.ORIONPULSE_API_URL || "http://localhost:8080/api";
const SOCKET_URL = process.env.ORIONPULSE_SOCKET_URL || "http://localhost:8080";

const DEFAULT_PORTS = [22, 80, 443, 3000, 5173, 8080];

export async function startCommand() {
  intro("Orionpulse - Telemetry Daemon");

  const config = readConfig();
  if (!config.token) {
    cancel("Status: Not Logged In. Please run 'orionpulse login' first.");
    process.exit(1);
  }

  const headers = { Authorization: `Bearer ${config.token}` };
  let serverId = config.serverId;

  const s = spinner();

  // 1. Auto-register or verify server node
  if (!serverId) {
    s.start("Registering this host as a server node...");
    try {
      const hostname = os.hostname();
      const res = await axios.post(
        `${BACKEND_URL}/servers`,
        { name: `${hostname} (CLI Agent)`, hostname },
        { headers },
      );
      serverId = res.data.data.id || res.data.data._id;
      writeConfig({ serverId });
      s.stop(`Server registered! Hostname: ${hostname} (ID: ${serverId})`);
    } catch (error) {
      s.stop("Failed to register server");
      cancel(`Error: ${error.response?.data?.message || error.message}`);
      process.exit(1);
    }
  } else {
    // Verify server still exists
    s.start("Verifying server node status with backend...");
    try {
      await axios.get(`${BACKEND_URL}/servers/${serverId}`, { headers });
      s.stop("Server node verified!");
    } catch (error) {
      s.stop("Verification failed");
      log.warn(
        "Server ID stored in config seems invalid. Registering a new server node...",
      );

      s.start("Registering new server node...");
      try {
        const hostname = os.hostname();
        const res = await axios.post(
          `${BACKEND_URL}/servers`,
          { name: `${hostname} (CLI Agent)`, hostname },
          { headers },
        );
        serverId = res.data.data.id || res.data.data._id;
        writeConfig({ serverId });
        s.stop(`Server registered! (ID: ${serverId})`);
      } catch (err) {
        s.stop("Failed to register server");
        cancel(`Error: ${err.message}`);
        process.exit(1);
      }
    }
  }

  // 2. Establish Socket.io Connection
  s.start("Connecting to Socket.io server...");
  const socket = io(SOCKET_URL, {
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  socket.on("connect", () => {
    s.stop("Connected to Socket.io server successfully!");
    log.step(`Registered agent for Server ID: ${serverId}`);

    // Register agent room
    socket.emit("register-agent", { serverId });
  });

  socket.on("connect_error", (error) => {
    s.stop("Socket.io connection failed");
    log.error(`Connection error: ${error.message}`);
  });

  // Heartbeat loop every 30 seconds
  const heartbeatInterval = setInterval(() => {
    if (socket.connected) {
      socket.emit("agent-heartbeat", { serverId });
    }
  }, 30000);

  // Listen to on-demand trigger-scan requests
  socket.on("trigger-scan", async (data) => {
    const { id, portNumber, protocol } = data;
    log.info(
      `Received on-demand scan request: Port ${portNumber} (${protocol})`,
    );

    const result = await probeLocalPort(portNumber, 2000);

    // 1. Post single scan log to backend
    try {
      await axios.post(`${BACKEND_URL}/ports/agent/logs`, {
        serverId,
        logs: [
          {
            portNumber,
            protocol,
            status: result.status,
            responseTime: result.responseTime,
            errorMessage:
              result.status !== "open"
                ? `Port state reported as: ${result.status}`
                : "",
          },
        ],
      });
    } catch (err) {
      log.error(`Failed to submit instant scan log: ${err.message}`);
    }

    // 2. Send scan-completed event back to socket
    socket.emit("scan-completed", {
      serverId,
      portId: id,
      result: result.status,
    });
    log.step(
      `Scan completed for Port ${portNumber} -> Status: ${result.status.toUpperCase()}`,
    );
  });

  // 3. Setup periodic 10-second port status check
  log.info("Starting periodic telemetry monitoring...");
  const telemetryInterval = setInterval(async () => {
    try {
      // A. Fetch monitored ports from backend
      const res = await axios.get(`${BACKEND_URL}/servers/${serverId}/ports`, {
        headers,
      });
      const monitoredPorts = res.data.data;

      let portsToScan = [];
      if (Array.isArray(monitoredPorts) && monitoredPorts.length > 0) {
        portsToScan = monitoredPorts.map((p) => ({
          portNumber: p.portNumber,
          protocol: p.protocol || "TCP",
        }));
      } else {
        // Fallback: if no ports are defined on dashboard, monitor default ones
        portsToScan = DEFAULT_PORTS.map((p) => ({
          portNumber: p,
          protocol: "TCP",
        }));
      }

      // B. Scan all ports in parallel
      const scanResults = await Promise.all(
        portsToScan.map(async (p) => {
          const check = await probeLocalPort(p.portNumber, 1500);
          return {
            portNumber: p.portNumber,
            protocol: p.protocol,
            status: check.status,
            responseTime: check.responseTime,
            errorMessage:
              check.status !== "open" ? `State reported: ${check.status}` : "",
          };
        }),
      );

      // C. Submit logs to backend agent endpoint
      await axios.post(`${BACKEND_URL}/ports/agent/logs`, {
        serverId,
        logs: scanResults,
      });

      // Simple stdout status indicator
      const activeCount = scanResults.filter((r) => r.status === "open").length;
      process.stdout.write(
        `\r[Orionpulse Telemetry] Scanned ${scanResults.length} ports (Open: ${activeCount}) at ${new Date().toLocaleTimeString()}`,
      );
    } catch (err) {
      process.stdout.write(
        `\r[Orionpulse Telemetry] Scanning failed: ${err.message}`,
      );
    }
  }, 10000);

  // Graceful shutdown
  const shutdown = () => {
    clearInterval(heartbeatInterval);
    clearInterval(telemetryInterval);
    socket.disconnect();
    console.log("\n");
    outro("Orionpulse Telemetry Daemon stopped.");
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  note(
    `Daemon is running in your terminal.\nPress Ctrl+C to shutdown telemetry agent.`,
    "Telemetry Active",
  );
}
