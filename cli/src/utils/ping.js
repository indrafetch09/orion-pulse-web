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
