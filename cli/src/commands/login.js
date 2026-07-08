import { intro, outro, spinner, note, cancel } from "@clack/prompts";
import axios from "axios";
import open from "open";
import { writeConfig } from "../services/config.js";

// ponytail: npm users need prod defaults, devs override with env vars
const BACKEND_URL = process.env.ORIONPULSE_API_URL || "";
const FRONTEND_URL = process.env.ORIONPULSE_WEB_URL || "";

export async function loginCommand() {
  intro(
    "Welcome to Orionpulse, Your Local Agent Port Manager - Terminal Authorization",
  );

  const s = spinner();
  s.start("Generating authorization code...");

  try {
    // 1. Get device authorization code
    const res = await axios.post(`${BACKEND_URL}/auth/device/code`);
    const { deviceCode, userCode, verificationUri } = res.data.data;

    s.stop("Authorization code generated!");

    const hasValidUri =
      verificationUri && !verificationUri.startsWith("undefined");
    const loginUrl = hasValidUri
      ? verificationUri
      : `${FRONTEND_URL}/cli-login?device_code=${userCode}`;

    note(
      `Open this link in your browser to authorize:\n\n👉 ${loginUrl}`,
      "Authorize Terminal Access",
    );

    s.start("Opening your web browser automatically...");
    await open(loginUrl).catch(() => {
      // Keep going even if automatic open fails
    });
    s.stop(
      "Browser opened! (If it did not open, please copy/paste the link above).",
    );

    s.start("Waiting for authorization approval in browser...");

    // 2. Poll for token
    let isAuthorized = false;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max (polling every 5 seconds)

    while (!isAuthorized && attempts < maxAttempts) {
      attempts++;

      await new Promise((resolve) => setTimeout(resolve, 5000));

      try {
        const tokenRes = await axios.post(`${BACKEND_URL}/auth/device/token`, {
          deviceCode,
        });
        const { status, token, user } = tokenRes.data.data;

        if (status === "authorized") {
          writeConfig({ token });
          s.stop(`Success! Connected as ${user.username} (${user.email})`);
          outro("Credentials saved securely in ~/.orionpulse.json");
          isAuthorized = true;
          process.exit(0);
        } else if (status === "expired") {
          s.stop("Failed");
          cancel("Session expired. Please run the login command again.");
          process.exit(1);
        } else if (status === "invalid") {
          s.stop("Failed");
          cancel("Invalid credentials.");
          process.exit(1);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          s.stop("Failed");
          cancel("Authorization session not found or expired.");
          process.exit(1);
        }
        // Network errors or other issues are ignored during polling to continue attempts
      }
    }

    if (!isAuthorized) {
      s.stop("Failed");
      cancel("Login timeout. Please try again.");
      process.exit(1);
    }
  } catch (error) {
    s.stop("Failed");
    cancel(`Failed to initialize login: ${error.message}`);
    process.exit(1);
  }
}
