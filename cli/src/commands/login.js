import axios from "axios";
import open from "open";
import { writeConfig } from "../services/config.js";

const BACKEND_URL =
  process.env.ORIONPULSE_API_URL || "http://localhost:8080/api";
const FRONTEND_URL = process.env.ORIONPULSE_WEB_URL || "http://localhost:5173";

export async function loginCommand() {
  try {
    console.log("Initiating terminal authorization flow...");

    // 1. Get device authorization code
    const res = await axios.post(`${BACKEND_URL}/auth/device/code`);
    const { deviceCode, userCode, verificationUri } = res.data.data;

    // Use verificationUri from backend if available, otherwise build it
    const hasValidUri =
      verificationUri && !verificationUri.startsWith("undefined");
    const loginUrl = hasValidUri
      ? verificationUri
      : `${FRONTEND_URL}/cli-login?device_code=${userCode}`;

    console.log(`\n==================================================`);
    console.log(`Open the following link in your browser to login:`);
    console.log(`👉 ${loginUrl}`);
    console.log(`==================================================\n`);

    console.log("Opening browser automatically...");
    await open(loginUrl).catch(() => {
      console.log(
        "(Failed to open browser automatically. Please copy and paste the link above manually).",
      );
    });

    console.log("\nWaiting for authorization approval in browser...");

    // 2. Poll for token
    let isAuthorized = false;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max (polling every 5 seconds)

    while (!isAuthorized && attempts < maxAttempts) {
      attempts++;
      // Print dot to show active polling
      process.stdout.write(".");

      await new Promise((resolve) => setTimeout(resolve, 5000));

      try {
        const tokenRes = await axios.post(`${BACKEND_URL}/auth/device/token`, {
          deviceCode,
        });
        const { status, token, user } = tokenRes.data.data;

        if (status === "authorized") {
          writeConfig({ token });
          console.log(
            `\n\n✔ Success! Logged in as ${user.username} (${user.email})`,
          );
          console.log("Credentials saved securely in ~/.orionpulse.json");
          isAuthorized = true;
          process.exit(0);
        } else if (status === "expired") {
          console.log(
            "\n\n❌ Sorry, your session has expired. Please try logging in again.",
          );
          process.exit(1);
        } else if (status === "invalid") {
          console.log("\n\n❌ Invalid credentials.");
          process.exit(1);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          console.log(
            "\n\n❌ Session not found or expired. Please run the login command again.",
          );
          process.exit(1);
        }
        // Network errors or other issues are ignored during polling to continue attempts
      }
    }

    if (!isAuthorized) {
      console.log("\n\n❌ Login timeout. Please try again.");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Failed to Login:", error.message);
    process.exit(1);
  }
}
