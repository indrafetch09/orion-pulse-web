#!/usr/bin/env node
import { Command } from "commander";
import { loginCommand } from "./commands/login.js";
import { scanCommand } from "./commands/scan.js";
import { startCommand } from "./commands/start.js";
import { writeConfig, readConfig, clearConfig } from "./services/config.js";
import { intro, outro, spinner, note, cancel, log } from "@clack/prompts";
import axios from "axios";

// ponytail: npm users need prod defaults, devs override with env var
const BACKEND_URL = process.env.ORIONPULSE_API_URL || "";

const program = new Command();

program
  .name("orionpulse")
  .description(
    "Welcome to Orionpulse, Your Local Agent Port Monitoring System.",
  )
  .version("1.0.1");

// Login command: supports both dynamic token input and OAuth device code flow
program
  .command("login")
  .description("Connect this terminal to your Orionpulse account")
  .argument(
    "[token]",
    "API Access Token (optional; triggers browser login if omitted)",
  )
  .action(async (token) => {
    if (token) {
      intro("Orionpulse - Direct Token Authorization");
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
  .description("Log out from your Orionpulse account and clear local config")
  .action(() => {
    intro("Orionpulse - Logout");
    clearConfig();
    outro("Successfully logged out. Local configuration cleared.");
    process.exit(0);
  });

// Profile status check command
program
  .command("status")
  .description("Check current login status and configuration details")
  .action(async () => {
    intro("Orionpulse - Connection Status");
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
      outro("Orionpulse LNMS is active and ready.");
    } catch {
      s.stop("Failed");
      cancel(
        "Status: Token stored but failed to authenticate with server (possibly expired).",
      );
    }
  });

program
  .command("start")
  .description("Start the background monitoring telemetry daemon agent")
  .action(async () => {
    await startCommand();
  });

program
  .command("scan")
  .description("Perform instant manual scan of local ports")
  .argument("[host]", "Target host to scan (default: 127.0.0.1)")
  .action(async (host) => {
    await scanCommand(host);
  });

program.parse(process.argv);
