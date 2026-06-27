import express from "express";
import { createServer } from "http";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// Route imports
import authRoutes from "./routes/authRoutes";
import serverRoutes from "./routes/serverRoutes";
import portRoutes from "./routes/portRoutes";
import aiRoutes from "./routes/aiRoutes";

// Socket imports
import { initSocket } from "./socket";

// Initialize configuration
dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 8080;

// Middleware
app.use(
  cors({
    origin: "*", // Allow all origins for development ease; configure for prod as needed
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());

// API Base Route Verification
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", time: new Date().toISOString() });
});

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/servers", serverRoutes);
app.use("/api/ports", portRoutes);
app.use("/api/ai", aiRoutes);

// Database Connection and Server Initialization
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/orionpulse";

console.log("Connecting to MongoDB...");
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Successfully connected to MongoDB.");

    // Initialize Socket.io
    initSocket(httpServer);
    console.log("Socket.io server initialized.");

    // Start HTTP Server
    httpServer.listen(PORT, () => {
      console.log(`===================================================`);
      console.log(`OrionPulse Backend Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`Health Check: http://localhost:${PORT}/health`);
      console.log(`===================================================`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed! Exiting now...", err.message);
    process.exit(1);
  });
