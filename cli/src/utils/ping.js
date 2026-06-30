import net from "net";

/**
 * Probes a specific port on a given host using a TCP socket.
 *
 * @param {string} host - The hostname or IP to probe (e.g. "127.0.0.1")
 * @param {number} port - The port number to check (e.g. 8080)
 * @param {number} [timeoutMs=2000] - Connection timeout in milliseconds
 * @returns {Promise<{ port: number, status: "open" | "closed" | "filtered", responseTime: number }>}
 */
export function probePort(host, port, timeoutMs = 2000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const startTime = process.hrtime.bigint();
    let completed = false;

    const timer = setTimeout(() => {
      if (completed) return;
      completed = true;
      socket.destroy();
      resolve({ port, status: "filtered", responseTime: 0 });
    }, timeoutMs);

    socket.connect(port, host, () => {
      if (completed) return;
      completed = true;
      clearTimeout(timer);

      const endTime = process.hrtime.bigint();
      // Calculate response time in milliseconds
      const responseTime = Number(endTime - startTime) / 1_000_000;

      socket.destroy();
      resolve({ port, status: "open", responseTime: Math.round(responseTime) });
    });

    socket.on("error", () => {
      if (completed) return;
      completed = true;
      clearTimeout(timer);
      socket.destroy();
      resolve({ port, status: "closed", responseTime: 0 });
    });
  });
}

/**
 * Probes a local port using both IPv4 (127.0.0.1) and IPv6 (::1) loopback.
 * Many dev servers (Vite, Next.js) bind to IPv6 `::1` by default on Linux,
 * while others bind to IPv4 `127.0.0.1`. This function checks both and
 * returns "open" if either succeeds.
 *
 * @param {number} port - The port number to check
 * @param {number} [timeoutMs=2000] - Connection timeout in milliseconds
 * @returns {Promise<{ port: number, status: "open" | "closed" | "filtered", responseTime: number }>}
 */
export async function probeLocalPort(port, timeoutMs = 2000) {
  // Try IPv4 first (most common)
  const ipv4Result = await probePort("127.0.0.1", port, timeoutMs);
  if (ipv4Result.status === "open") return ipv4Result;

  // Fallback to IPv6 loopback
  const ipv6Result = await probePort("::1", port, timeoutMs);
  if (ipv6Result.status === "open") return ipv6Result;

  // Neither worked — return the IPv4 result (closed/filtered)
  return ipv4Result;
}
