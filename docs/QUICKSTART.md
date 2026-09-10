# Quickstart Guide — Carnival Job Runner

This guide gets developers and operators up and running with **Carnival Job Runner** in less than 5 minutes.

---

## 1. Prerequisites

Ensure you have the following installed on your host machine:
* **Node.js**: `v18.0.0` or higher (ES Modules and NodeNext resolution required)
* **npm**: `v9.0.0` or higher
* **Network Connectivity**: Direct access or VPN tunnel to the enterprise SQL Server instances (`CTRLINVENT`, Dynamics AX, and `170.1.1.10:8012`).
* *(Optional for production)*: **PM2** installed globally (`npm install -g pm2`)

---

## 2. Installation

1. **Clone the repository**:
   ```bash
   git clone <repo-url> carnival-job-runner
   cd carnival-job-runner
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

---

## 3. Environment Configuration

Create a local `.env` file from the provided template:
```bash
cp .env.example .env
```

Open `.env` and fill in the target credentials:

```dotenv
# --- General ---
NODE_ENV=development
LOG_LEVEL=info

# --- MSSQL Database Credentials ---
CTRL_DB_USER=your_sql_user
CTRL_DB_PASSWORD=your_sql_password
CTRL_DB_SERVER=192.168.1.xxx      # Or corporate IP / hostname
CTRL_DB_DATABASE=CTRLINVENT

# Local Tracking / Packing SQL Server
DB_SERVER_SQL=170.1.1.10
DB_DATABASE_SQL=SeguimientoPedidos

# --- Target APIs ---
# Styles API (Inventory & Dimensions)
STYLES_API_BASE_URL=http://localhost:3000/stylesInformation/api

# LiveDash Endpoints
LIVEDASH_SOURCE_URL=http://170.1.1.10:8012
LIVEDASH_TARGET_URL=http://localhost:3000/api/livedash
LIVEDASH_SYNC_KEY=your-livedash-secret

# Internal Sync API (The Courier)
SYNC_API_URL=http://localhost:3000/api/sync
SYNC_API_KEY=your-sync-key
```

---

## 4. Running the Daemon

### In Development (Live Reload)
Run the scheduler daemon in watch mode using `tsx`:
```bash
npm run dev
```
You should see:
```text
====================================================
JOB RUNNER
====================================================
Starting process in development mode (PID: 12345)
----------------------------------------------------
 INITIALIZING CRON MANAGER
----------------------------------------------------
Registering [update-inventory] "Update Inventory" => Cron: "0 7,12 * * 1-5"
Scheduler running with 1 active cron jobs.
```

### In Production (Compiled)
Compile TypeScript to `dist/` and run the node process directly:
```bash
npm run build
npm run start
```

### In Production (PM2 Managed)
Deploy the daemon as a managed background service:
```bash
npm run start:pm2
```
Useful PM2 commands:
```bash
npm run logs:pm2      # Stream real-time daemon logs
npm run restart:pm2   # Recompile and restart PM2 process
npm run stop:pm2      # Stop the PM2 process
```

---

## 5. Running Tasks On-Demand (CLI)

You can trigger any ETL worker immediately without waiting for its scheduled cron tick:

| Task | CLI Command | Log Output |
| :--- | :--- | :--- |
| **Inventory Sync** | `npm run task:inventory` | `logs/updateInventory.log` |
| **Dimensions & Sizing** | `npm run task:dimensions` | `logs/updateDimensions.log` |
| **LiveDash Metrics Push** | `npm run task:livedash` | `logs/livedashPush.log` |
| **The Courier (Orders)** | `npm run task:logbook` | `logs/logbookUpdateDB.log` |

---

## 6. Verifying Specification & Code Health

Audit the integrity of all documentation nodes, verify code file references, and test for schedule drift:
```bash
npm run spec:verify
```

---

## 7. Next Steps & Documentation Links

* **System Architecture & Node Registry**: Consult [`docs/INDEX.md`](file:///home/osvaldev/Documents/carnival/job-runner/docs/INDEX.md) to inspect contracts and topology.
* **Development Process & Change Matrix**: Consult [`docs/WORKFLOW.md`](file:///home/osvaldev/Documents/carnival/job-runner/docs/WORKFLOW.md) before making any code modifications.
* **AI Agent Directives**: Consult [`AGENTS.md`](file:///home/osvaldev/Documents/carnival/job-runner/AGENTS.md) when interacting via AI coding assistants.
