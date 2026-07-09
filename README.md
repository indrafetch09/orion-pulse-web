# Orionpulse

Orionpulse is a lightweight Local Network Monitoring System (LNMS) that checks the health of your local ports, streams status updates in real-time, and automatically diagnoses port/service failures using Gemini AI.

---

## Architecture

- **Frontend**: Single Page Application (SPA) built with React, Vite, and TailwindCSS.
- **Backend**: Express.js server providing a REST API and a Socket.io WebSocket server. In production, the backend serves the built frontend directly.
- **CLI Agent**: A lightweight background daemon that runs on target nodes, monitors configured ports, and broadcasts updates via WebSocket.
- **Diagnostics**: AI-Powered remediation steps powered by the `gemini-3.1-flash-lite` LLM model.

---

## Quick Start (Local Development)

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+) or [Bun](https://bun.sh/)
- [MongoDB](https://www.mongodb.com/) running locally or a MongoDB Atlas URI

### 2. Configure Environment variables
Create a `.env` file in the `backend/` directory:
```env
PORT=8080
MONGODB_URI=mongodb://localhost:27017/orionpulse
JWT_SECRET=supersecretkeychangeinproduction12345
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Run the Monorepo
Install dependencies and start development servers:

Using npm: 
```bash
# Root directory (starts frontend)
npm install
npm run dev

# Backend directory
cd backend
npm install
npm run dev
```

---

Using bun: 
```bash
# Root directory (starts frontend)
bun install
bun run dev

# Backend directory
cd backend
bun install
bun run dev
```

---
## Production / EC2 Deployment

Orionpulse is optimized to run on a single domain. The backend serves the production frontend build out-of-the-box.

### 1. Build & Start with PM2
On your production server (e.g. AWS EC2 instance):
```bash
# Install root & build frontend
npm install
npm run build

# Install backend & start
cd backend
npm install
bun run build
pm2 start dist/index.js --name orionpulse --interpreter bun
pm2 save
```

### 2. Reverse Proxy / Cloudflare Tunnel
Configure your proxy or Cloudflare tunnel to forward traffic to `http://localhost:8080`.
No separate API or websocket subdomain configurations are needed.

---

## CLI Telemetry Agent Setup

Monitor any server by installing the global CLI daemon:

```bash
# 1. Install CLI globally
npm install -g orionpulse-cli

# 2. Login to your account
orionpulse login [your_token] # Check into Orionpulse user settings

# 3. Start monitoring daemon
orionpulse start
```

---

## API Endpoints Reference

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register account |
| `POST` | `/api/auth/login` | Public | Authenticate and obtain JWT token |
| `GET` | `/api/servers` | Private | List all registered node servers |
| `POST` | `/api/servers` | Private | Register a new server node |
| `POST` | `/api/servers/:serverId/ports` | Private | Add a port to monitor |
| `POST` | `/api/ports/agent/logs` | Public | Submit telemetry logs from CLI agent |
| `POST` | `/api/ports/:id/scan` | Private | Force an immediate port scan |
| `GET` | `/api/ai/solutions` | Private | Retrieve AI-generated diagnostics |

---

## Assets & Custom Branding

### 1. Logo Customization & Sizing Guide
The recommended format is **inline SVG** because it supports dynamic theming:
- Edit the SVG path directly in your React code.
- Use Tailwind utility classes like `text-primary` or SVG attributes like `stroke="currentColor"` so the logo dynamically inherits dark/light theme styles.

**Sizing Specifications:**

| Context | Tailwind Class | Dimensions (px) | Usage Location |
|---|---|---|---|
| **Favicon** | N/A | scales natively | `/public/favicon.svg` |
| **Sidebar** | `h-6 w-6` | 24x24px | Sidebar navigation toggles |
| **Header / Navbar** | `h-8 w-8` or `h-9 w-9` | 32x32px / 36x36px | Global headers and navigation bars |
| **Auth / Login Card** | `h-12 w-12` | 48x48px | Auth components (`LoginPage.tsx`) |
| **Hero / Landing Page** | `h-16 w-16` to `h-24 w-24` | 64x64px to 96x96px | Hero sections and product highlights |

### 2. Favicon Configuration
The app uses a modern SVG favicon that automatically scales to all screen resolutions (16x16, 32x32, 180x180, etc.):
- Save your custom icon as `public/favicon.svg`.
- The reference is pre-configured in `index.html`:
  ```html
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  ```

### 3. Icon Library Usage
To keep bundle sizes small and page performance high, avoid installing external font-packs (e.g. FontAwesome). Instead, use the built-in libraries:
- **UI & System Icons**: Use standard [Lucide React](https://lucide.dev/icons) components (e.g. `Brain`, `Activity`, `Shield`).
- **Brand & Third-party Icons**: Use [React Icons](https://react-icons.github.io/react-icons/) (e.g. `FaGithub` from `react-icons/fa`, `SiGooglegemini` from `react-icons/si`).

---

## License
ISC
