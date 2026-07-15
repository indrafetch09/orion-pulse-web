import { GoogleGenAI } from "@google/genai";
import { AISolution, IAISolution } from "../models/AISolution";
// Helper to generate a cache key based on port number and simplified error message
function generateErrorKey(
  portNumber: number,
  status: string,
  errorMessage?: string,
): string {
  const normalizedError = (errorMessage || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 50); // Take first 50 alphanumeric chars of error message
  return `${portNumber}:${status}:${normalizedError}`;
}

// Fallback solutions when Gemini API is down, rate-limited, or API key is missing
function getFallbackSolution(
  portNumber: number,
  status: string,
  errorMessage?: string,
) {
  let analysis;
  let solution;
  let confidence;

  if (portNumber === 3000) {
    analysis = `Port 3000 (React Dev Server/Vite) is ${status}. This usually happens when the development server is not running or crashed during a hot-reload compile event.`;
    solution = `1. Check your terminal running the frontend for syntax or compilation errors.\n2. Start or restart the frontend development server: bun run dev or npm run dev.\n3. If Vite is frozen, clear the cache directory: rm -rf node_modules/.vite and restart.`;
    confidence = 90;
  } else if (portNumber === 8080) {
    analysis = `Port 8080 (Express API / Backend) is ${status}. ${errorMessage ? `Error: ${errorMessage}.` : "The backend API service is unreachable."} This suggests the Express server has crashed or failed to bind to the port.`;
    solution = `1. Check your backend terminal for unhandled exceptions or database connection failures.\n2. Check if another process is already using port 8080: "lsof -i :8080" or "netstat -tlnp | grep 8080".\n3. Restart the backend process: bun run dev.`;
    confidence = 85;
  } else if (portNumber === 5432) {
    analysis = `Port 5432 (PostgreSQL Database) is ${status}. The local network agent could not connect to PostgreSQL.`;
    solution = `1. Check if the PostgreSQL service is active: "sudo systemctl status postgresql".\n2. Start or restart PostgreSQL: "sudo systemctl restart postgresql".\n3. Check PostgreSQL logs: "sudo tail -n 50 /var/log/postgresql/postgresql-*.log".\n4. Verify that "bind-address" and client authentication in "/etc/postgresql/*/main/pg_hba.conf" permit local connections.`;
    confidence = 85;
  } else if (portNumber === 3306) {
    analysis = `Port 3306 (MySQL Database) is ${status}. The MySQL database server is offline or blocking connection.`;
    solution = `1. Check if MySQL is running: "sudo systemctl status mysql" or "sudo service mysql status".\n2. Restart MySQL: "sudo systemctl restart mysql".\n3. Verify MySQL bind-address in "/etc/mysql/mysql.conf.d/mysqld.cnf" allows localhost connections.\n4. Check MySQL error log: "sudo tail -n 50 /var/log/mysql/error.log".`;
    confidence = 85;
  } else {
    analysis = `Port ${portNumber} is ${status}. ${errorMessage ? `System reports: "${errorMessage}".` : "No active service responded on this port."} This service appears to be down or firewalled.`;
    solution = `1. Check if the target service is running on your machine.\n2. Verify the application configuration to ensure it binds to port ${portNumber}.\n3. Check active ports list to see what is running: "sudo ss -tlnp" or "netstat -tlnp".\n4. Verify firewall rules allow traffic through port ${portNumber} (e.g. "sudo ufw status").`;
    confidence = 75;
  }

  // Prepend failure notification to analysis
  analysis = `[Fallback Mode] ${analysis} (Note: Gemini API is busy or API key is not configured. Falling back to local offline analysis).`;

  return { analysis, solution, confidence };
}

// ponytail: limit concurrent live AI calls to prevent quota waste (e.g. if 50 ports fail at once)
let activeAICallsCount = 0;
const MAX_CONCURRENT_AI_CALLS = 3;

export async function analyzePortFailure(
  portLogId: string,
  portNumber: number,
  status: string,
  errorMessage?: string,
): Promise<IAISolution> {
  const errorKey = generateErrorKey(portNumber, status, errorMessage);

  // 1. Concurrency Rate-Limiter (Checked immediately to prevent async race conditions)
  if (activeAICallsCount >= MAX_CONCURRENT_AI_CALLS) {
    const fallback = getFallbackSolution(portNumber, status, errorMessage);
    return await AISolution.create({
      portLogId,
      portNumber,
      analysis: `[Rate-Limited] ${fallback.analysis}`,
      solution: fallback.solution,
      confidence: fallback.confidence,
      isFromCache: false,
      errorKey,
    });
  }

  activeAICallsCount++;
  try {
    // 2. Try to find a cached solution for the same port failure fingerprint
    const existingSolution = await AISolution.findOne({ errorKey }).sort({
      createdAt: -1,
    });
    if (existingSolution) {
      // Return cached solution, marked as cached
      return await AISolution.create({
        portLogId,
        portNumber,
        analysis: existingSolution.analysis,
        solution: existingSolution.solution,
        confidence: existingSolution.confidence,
        isFromCache: true,
        errorKey,
      });
    }

    // 3. Call Gemini API if API key is present
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const fallback = getFallbackSolution(portNumber, status, errorMessage);
      return await AISolution.create({
        portLogId,
        portNumber,
        analysis: fallback.analysis,
        solution: fallback.solution,
        confidence: fallback.confidence,
        isFromCache: false,
        errorKey,
      });
    }

    const prompt = `
You are Orionpulse AI, an expert Network Operations and Linux, Windows, macOS Systems Administrator.
Analyze a port monitoring failure event and generate troubleshooting instructions.
Make it simple to understand.

Port Checked: ${portNumber}
Status: ${status}
Connection Error Message: "${errorMessage || "Connection refused / Timed out"}"

Analyze why the service on port ${portNumber} might be offline or returning this status.
Respond ONLY with a JSON object in this format:
{
"analysis": "A simplified explanation of why the service on port ${portNumber} might be down, taking the error message into account. Keep it concise but professional and easy to understand.",
"solution": "Step-by-step troubleshooting commands or configuration checks. Each step should be on a new line and start with a number. Use specific commands for common ports (e.g. systemctl, ufw, netstat).",
"confidence": 95
}
`;

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const result = response.text;
    if (!result) {
      throw new Error("Failed to generate text");
    }

    const cleanResult = result
      .replace(/```json/, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleanResult);

    return await AISolution.create({
      portLogId,
      portNumber,
      analysis: parsed.analysis || `Port ${portNumber} is ${status}.`,
      solution:
        parsed.solution ||
        "1. Verify the service is running.\n2. Check firewalls.",
      confidence: parsed.confidence || 85,
      isFromCache: false,
      errorKey,
    });
  } catch (error: unknown) {
    console.error("Error calling Gemini API:", error);
    // Fall back to local database query or offline heuristics
    const fallback = getFallbackSolution(portNumber, status, errorMessage);
    return await AISolution.create({
      portLogId,
      portNumber,
      analysis: fallback.analysis,
      solution: fallback.solution,
      confidence: fallback.confidence,
      isFromCache: false,
      errorKey,
    });
  } finally {
    activeAICallsCount--;
  }
}
