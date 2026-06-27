import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http";
import { Server } from "./models/Server";

let io: SocketIOServer | null = null;

// Keep track of active server agent connections: socketId -> serverId
const activeAgents = new Map<string, string>();

export function initSocket(httpServer: HttpServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*", // Allow all origins in development
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join room for dashboard clients
    socket.on("join-dashboard", () => {
      socket.join("dashboards");
      console.log(`Socket ${socket.id} joined dashboards room`);
    });

    // Agent registration
    socket.on("register-agent", async (data: { serverId: string }) => {
      const { serverId } = data;
      if (!serverId) return;

      activeAgents.set(socket.id, serverId);
      socket.join(`agent-${serverId}`);
      console.log(
        `Agent registered for server: ${serverId} (Socket: ${socket.id})`,
      );

      try {
        const serverObj = await Server.findById(serverId);
        if (serverObj) {
          serverObj.status = "online";
          serverObj.lastHeartbeat = new Date();
          await serverObj.save();

          // Broadcast to all dashboards
          io?.to("dashboards").emit("server-status-updated", {
            serverId,
            status: "online",
            lastHeartbeat:
              serverObj.lastHeartbeat?.toISOString() ||
              new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error("Error registering agent:", error);
      }
    });

    // Agent Heartbeat
    socket.on("agent-heartbeat", async (data: { serverId: string }) => {
      const { serverId } = data;
      if (!serverId) return;

      try {
        const serverObj = await Server.findById(serverId);
        if (serverObj) {
          serverObj.status = "online";
          serverObj.lastHeartbeat = new Date();
          await serverObj.save();

          io?.to("dashboards").emit("server-status-updated", {
            serverId,
            status: "online",
            lastHeartbeat:
              serverObj.lastHeartbeat?.toISOString() ||
              new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error("Error handling heartbeat:", error);
      }
    });

    // Handle manual scan request completion from agent
    socket.on(
      "scan-completed",
      (data: { serverId: string; portId: string; result: any }) => {
        // Broadcast log update to dashboards
        io?.to("dashboards").emit("port-scan-completed", data);
      },
    );

    // Disconnect
    socket.on("disconnect", async () => {
      console.log(`Socket disconnected: ${socket.id}`);
      const serverId = activeAgents.get(socket.id);
      if (serverId) {
        activeAgents.delete(socket.id);

        // Wait briefly (grace period) in case of instant reconnect
        setTimeout(async () => {
          // Check if server reconnected with a different socket
          const stillConnected = Array.from(activeAgents.values()).includes(
            serverId,
          );
          if (!stillConnected) {
            try {
              const serverObj = await Server.findById(serverId);
              if (serverObj) {
                serverObj.status = "offline";
                await serverObj.save();

                io?.to("dashboards").emit("server-status-updated", {
                  serverId,
                  status: "offline",
                  lastHeartbeat:
                    serverObj.lastHeartbeat?.toISOString() ||
                    new Date().toISOString(),
                });
              }
            } catch (error) {
              console.error("Error updating status on disconnect:", error);
            }
          }
        }, 5000);
      }
    });
  });

  // Run periodic check for dead heartbeats (e.g. check every 30 seconds)
  setInterval(async () => {
    try {
      const threshold = new Date(Date.now() - 45 * 1000); // 45 seconds ago
      const inactiveServers = await Server.find({
        status: { $ne: "offline" },
        lastHeartbeat: { $lt: threshold },
      });

      for (const serverObj of inactiveServers) {
        serverObj.status = "offline";
        await serverObj.save();

        io?.to("dashboards").emit("server-status-updated", {
          serverId: serverObj._id.toString(),
          status: "offline",
          lastHeartbeat:
            serverObj.lastHeartbeat?.toISOString() || new Date().toISOString(),
        });
        console.log(
          `Marked server ${serverObj.name} offline due to missing heartbeat.`,
        );
      }
    } catch (error) {
      console.error("Error checking inactive servers:", error);
    }
  }, 30000);

  return io;
}

// Helpers to trigger real-time updates from REST controllers
export function broadcastPortUpdate(serverId: string, portData: any) {
  if (io) {
    io.to("dashboards").emit("port-updated", { serverId, port: portData });
  }
}

export function broadcastNewLog(portId: string, logData: any) {
  if (io) {
    io.to("dashboards").emit("new-port-log", { portId, log: logData });
  }
}

export function requestAgentScan(
  serverId: string,
  portData: { id: string; portNumber: number; protocol: string },
) {
  if (io) {
    // Send message to the specific agent room
    io.to(`agent-${serverId}`).emit("trigger-scan", portData);
    return true;
  }
  return false;
}
