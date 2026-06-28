#!/usr/bin/env bun
import { Command } from "commander";
import { loginCommand } from "./commands/login.js";
import { writeConfig, readConfig, clearConfig } from "./services/config.js";
import axios from "axios";

const BACKEND_URL =
  process.env.ORIONPULSE_API_URL || "http://localhost:8080/api";

const program = new Command();

program
  .name("orionpulse")
  .description("Welcome to OrionPulse! Your CLI Agent for Managing Local Port.")
  .version("1.0.0");

// Login command: supports both dynamic token input and OAuth device code flow
program
  .command("login")
  .description("Connect this terminal to your OrionPulse account")
  .argument(
    "[token]",
    "API Access Token (optional; triggers browser login if omitted)",
  )
  .action(async (token) => {
    if (token) {
      try {
        console.log("Verifying token with server...");
        const res = await axios.get(`${BACKEND_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = res.data.data;
        writeConfig({ token });
        console.log(`✔ Success! Connected as ${user.username} (${user.email})`);
        process.exit(0);
      } catch (err) {
        console.error(
          "❌ Invalid token or failed to connect to server:",
          err.message,
        );
        process.exit(1);
      }
    } else {
      // Run browser OAuth Device Flow
      await loginCommand();
    }
  });

// Logout command
program
  .command("logout")
  .description("Log out from your OrionPulse account and clear local config")
  .action(() => {
    clearConfig();
    console.log("✔ Successfully logged out. Local configuration cleared.");
    process.exit(0);
  });

// Profile status check command
program
  .command("status")
  .description("Check current login status and configuration details")
  .action(async () => {
    const config = readConfig();
    if (!config.token) {
      console.log(
        "Status: Not Logged In. Please run 'orionpulse login' first.",
      );
      process.exit(0);
    }

    try {
      const res = await axios.get(`${BACKEND_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${config.token}` },
      });
      const user = res.data.data;
      console.log(`Status: Connected`);
      console.log(`User: ${user.username} (${user.email})`);
      console.log(
        `Associated Server ID: ${config.serverId || "Not linked (Run start daemon)"}`,
      );
    } catch {
      console.log(
        "Status: Token stored but failed to authenticate with server (possibly expired).",
      );
    }
  });

// Placeholder start command (will be fully coded in telemetry task)
program
  .command("start")
  .description("Start the background monitoring telemetry daemon agent")
  .action(() => {
    console.log("Running telemetry agent...");
    console.log(
      "(Coming soon: Dispatching port status logs every 10s and heartbeats every 30s).",
    );
  });

// Placeholder scan command (will be fully coded in scanning task)
program
  .command("scan")
  .description("Perform instant manual scan of local ports")
  .action(() => {
    console.log("Performing quick manual scan...");
    console.log("(Coming soon: Instant local socket scan).");
  });

program.parse(process.argv);
