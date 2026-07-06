import { intro, outro, spinner, log } from "@clack/prompts";
import { probeLocalPort } from "../utils/ping.js";

const DEFAULT_PORTS = [22, 80, 443, 3000, 3306, 5173, 5432, 8080, 27017, 8081];

/**
 * Executes a manual quick scan against default local ports.
 *
 * @param {string} [host="127.0.0.1"] - Host to target scan
 */
export async function scanCommand(host = "127.0.0.1") {
  intro("Orionpulse - Local Socket Scanner");
  log.info(`Target Host: ${host}`);

  const s = spinner();
  s.start(`Scanning ${DEFAULT_PORTS.length} standard ports...`);

  const results = [];
  // Execute all probes in parallel
  const probes = DEFAULT_PORTS.map(async (port) => {
    const res = await probeLocalPort(port, 1500);
    results.push(res);
  });

  await Promise.all(probes);

  // Sort results by port number ascending
  results.sort((a, b) => a.port - b.port);

  s.stop("Scan completed!");

  // Print results table
  console.log("");
  console.log("  Port     Status       Latency");
  console.log("  ─────────────────────────────");
  for (const res of results) {
    let statusText = "";
    if (res.status === "open") {
      statusText = "🟢 OPEN  ";
    } else if (res.status === "closed") {
      statusText = "🔴 CLOSED";
    } else {
      statusText = "🟡 FILTER";
    }

    const latencyText = res.status === "open" ? `${res.responseTime}ms` : "-";
    console.log(
      `  ${res.port.toString().padEnd(8)} ${statusText}    ${latencyText}`,
    );
  }
  console.log("");

  outro("Local scan completed successfully.");
}
