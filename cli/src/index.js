#!/usr/bin/env bun
import { Command } from "commander";
import { loginCommand } from "./commands/login.js";
import { writeConfig, readConfig, clearConfig } from "./services/config.js";
import { intro, outro, spinner, note, cancel, log } from "@clack/prompts";
import axios from "axios";

const BACKEND_URL =
  process.env.ORIONPULSE_API_URL || "http://localhost:8080/api";

const program = new Command();

program
  .name("orionpulse")
  .description(
    "Welcome to OrionPulse, Your Local Agent Port Monitoring System.",
  )
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
      intro("OrionPulse - Direct Token Authorization");
      const s = spinner();
      s.start("Verifying token with server...");

      try {
        const res = await axios.get(`${BACKEND_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = res.data.data;
        writeConfig({ token });

        s.stop(`Success! Connected as ${user.username} (${user.email})`);
        outro("Credentials saved securely in ~/.orionpulse.json");
        process.exit(0);
      } catch (err) {
        s.stop("Failed");
        cancel(`Invalid token or failed to connect to server: ${err.message}`);
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
    intro("OrionPulse - Logout");
    clearConfig();
    outro("Successfully logged out. Local configuration cleared.");
    process.exit(0);
  });

// Profile status check command
program
  .command("status")
  .description("Check current login status and configuration details")
  .action(async () => {
    intro("OrionPulse - Connection Status");
    const config = readConfig();
    if (!config.token) {
      cancel("Status: Not Logged In. Please run 'orionpulse login' first.");
      process.exit(0);
    }

    const s = spinner();
    s.start("Fetching status from server...");

    try {
      const res = await axios.get(`${BACKEND_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${config.token}` },
      });
      const user = res.data.data;
      s.stop("Status fetched!");

      note(
        `User: ${user.username} (${user.email})\nAssociated Server ID: ${config.serverId || "Not linked (Run start daemon)"}`,
        "Status: Connected",
      );
      outro("OrionPulse LNMS is active and ready.");
    } catch {
      s.stop("Failed");
      cancel(
        "Status: Token stored but failed to authenticate with server (possibly expired).",
      );
    }
  });

// Placeholder start command (will be fully coded in telemetry task)
program
  .command("start")
  .description("Start the background monitoring telemetry daemon agent")
  .action(() => {
    intro("OrionPulse - Telemetry Daemon");
    log.info("Running telemetry agent...");
    note(
      "Coming soon: Dispatching port status logs every 10s and heartbeats every 30s.",
      "Daemon Status",
    );
    outro("Press Ctrl+C to stop.");
  });

// Placeholder scan command (will be fully coded in scanning task)
program
  .command("scan")
  .description("Perform instant manual scan of local ports")
  .action(() => {
    intro("OrionPulse - Manual Port Scan");
    log.step("Performing quick manual scan...");
    note(
      "Coming soon: Instant local socket connection scanning.",
      "Scan Results",
    );
    outro("Scan completed.");
  });

program.parse(process.argv);
