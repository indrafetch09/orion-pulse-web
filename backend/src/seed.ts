import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { User } from "./models/User";
import { Server } from "./models/Server";
import { Port } from "./models/Port";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/orionpulse";

async function seed() {
  console.log("Connecting to database for seeding...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected successfully!");

  try {
    // 1. Seed Admin User
    const adminEmail = "admin@orionpulse.io";
    let admin = await User.findOne({ email: adminEmail });

    if (!admin) {
      const hashedPassword = await bcrypt.hash("admin1234", 10);
      admin = await User.create({
        username: "admin",
        email: adminEmail,
        password: hashedPassword,
      });
      console.log(`Created admin account: ${adminEmail} (password: admin1234)`);
    } else {
      console.log(`Admin account ${adminEmail} already exists.`);
    }

    // 2. Seed Server Nodes
    const serverCount = await Server.countDocuments({ userId: admin._id });
    if (serverCount === 0) {
      const server1 = await Server.create({
        name: "Web Frontend Server",
        hostname: "127.0.0.1",
        status: "online",
        lastHeartbeat: new Date(),
        userId: admin._id,
      });

      const server2 = await Server.create({
        name: "Production Database Server",
        hostname: "192.168.1.15",
        status: "warning",
        lastHeartbeat: new Date(),
        userId: admin._id,
      });

      console.log("Created demo servers!");

      // 3. Seed Ports
      await Port.create([
        {
          portNumber: 3000,
          protocol: "TCP",
          label: "Vite Dev Server",
          status: "open",
          serverId: server1._id,
        },
        {
          portNumber: 80,
          protocol: "TCP",
          label: "HTTP Server",
          status: "open",
          serverId: server1._id,
        },
        {
          portNumber: 443,
          protocol: "TCP",
          label: "HTTPS Server",
          status: "closed",
          serverId: server1._id,
        },
        {
          portNumber: 5432,
          protocol: "TCP",
          label: "PostgreSQL Database",
          status: "open",
          serverId: server2._id,
        },
        {
          portNumber: 6379,
          protocol: "TCP",
          label: "Redis Cache Server",
          status: "closed",
          serverId: server2._id,
        },
        {
          portNumber: 22,
          protocol: "TCP",
          label: "SSH Management",
          status: "filtered",
          serverId: server2._id,
        },
      ]);
      console.log("Created demo ports!");
    } else {
      console.log("Servers and ports already populated for this admin user.");
    }

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database.");
  }
}

seed();
