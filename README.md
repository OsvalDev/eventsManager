# Carnival Job Runner

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org)
[![Process Manager](https://img.shields.io/badge/PM2-Fork%20Mode-blueviolet.svg)](https://pm2.keymetrics.io/)
[![Architecture](https://img.shields.io/badge/Spec--Driven%20Development-SDD-orange.svg)](docs/INDEX.md)

**Carnival Job Runner** (`carnival-job-runner`) is a resilient background worker daemon and ETL synchronization engine. It serves as an automated integration bridge connecting Carnival enterprise databases (Microsoft Dynamics AX and Microsoft SQL Server) with modern web APIs, catalog platforms, and real-time operational dashboards.

---

## 🌟 Key Features

* **Decoupled Architecture**: Background daemon execution managed via `node-cron` with independent on-demand CLI entrypoints for every task.
* **Resilient Connection Pooling**: Connection pools are dynamically created and safely disposed in `finally` blocks, preventing connection exhaustion on corporate database servers.
* **Production-Ready Process Orchestration**: Pre-configured PM2 ecosystem with single-instance enforcement (`fork` mode) to avoid duplicate cron executions.
* **Dual-Channel Telemetry**: Formatted console logging for real-time monitoring (`pm2 logs`) paired with persistent, append-only file audit logs in `logs/*.log`.
* **Spec-Driven Development (SDD)**: Built on an atomic, node-based documentation network in `docs/` with automated drift detection (`npm run spec:verify`).

---

## 📋 Task Matrix

| Task Name | CLI Command | Frequency | Source | Destination | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **[Inventory Sync](docs/tasks/TASK-01-UPDATE-INVENTORY.md)** | `npm run task:inventory` | `0 7,12 * * 1-5` | `CCVW_INVENMAYV3` | `POST /inventory/fill` | **Active** |
| **[Dimensions & Sizes](docs/tasks/TASK-02-UPDATE-DIMENSIONS.md)** | `npm run task:dimensions` | `0 6 * * 1-5` | `ECORESPRODUCT` | `POST /style/sizes`, `/colors` | Standby |
| **[LiveDash Metrics](docs/tasks/TASK-03-LIVEDASH-PUSH.md)** | `npm run task:livedash` | `*/15 8-19 * * 1-5` | Local `:8012` | `POST /api/livedash` | Standby |
| **[The Courier (Orders)](docs/tasks/TASK-04-LOGBOOK-SYNC.md)** | `npm run task:logbook` | `0 13,19 * * 1-5` | AX & Packing DB | `POST /orders`, `/detail` | Standby |

---

## 🚀 Quick Start

### 1. Prerequisites
* **Node.js**: `>= 18.0.0`
* **Network**: Reachability to target MSSQL servers

### 2. Setup
```bash
# Clone and install dependencies
git clone <repository-url>
cd carnival-job-runner
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your database and API credentials
```

### 3. Execution
```bash
# Development (watch mode)
npm run dev

# Production Build & Start
npm run build
npm run start

# Production with PM2 Daemon
npm run start:pm2
```

Detailed onboarding instructions: [**docs/QUICKSTART.md**](docs/QUICKSTART.md).

---

## 📖 Documentation & Navigation

This repository is governed by **Node-Based Spec-Driven Development (SDD)**:

* **[Quickstart Guide](docs/QUICKSTART.md)**: Setup, credentials, and deployment runbook.
* **[Master Documentation Index](docs/INDEX.md)**: Complete system topology, node catalog, and crontab schedule matrix.
* **[Operating Workflow & Change Matrix](docs/WORKFLOW.md)**: Mandatory guidelines and Change Trigger Matrix for human developers and AI assistants.
* **[Agent Interaction Protocol](AGENTS.md)**: System directives and navigation rules for AI coding agents.

---

## 🔍 Quality & Health Auditing

Verify documentation consistency, check for cron schedule drift, and validate code file existence:
```bash
npm run spec:verify
```

---

## 🛠️ CLI Cheatsheet

| Command | Action |
| :--- | :--- |
| `npm run dev` | Run daemon in development watch mode (`tsx`) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Start compiled daemon in production |
| `npm run start:pm2` | Launch PM2 process |
| `npm run stop:pm2` | Stop PM2 process |
| `npm run restart:pm2` | Rebuild and restart PM2 process |
| `npm run logs:pm2` | View live PM2 log stream |
| `npm run spec:verify` | Run automated documentation health & drift audit |
| `npm run task:new <name>` | Scaffold a new ETL task, spec node, and scheduler registration |
| `npm run task:inventory`| Run Inventory task immediately |
| `npm run task:dimensions`| Run Dimensions task immediately |
| `npm run task:livedash` | Run LiveDash task immediately |
| `npm run task:logbook`  | Run The Courier task immediately |

---

## 🔒 Git Hooks & Conventional Commits

Pre-configured Git hooks in `.githooks/` ensure that every commit satisfies the project quality gates:
* **Pre-commit**: Automatically runs `npm run spec:verify` and `npm run build`.
* **Commit-msg**: Enforces [Conventional Commits](https://www.conventionalcommits.org) (e.g. `feat(inventory): ...`, `fix(db): ...`).
* **Database Safety**: All code and queries must adhere to [`.agents/rules/sql-safety.md`](.agents/rules/sql-safety.md).

---

## 📄 License
Internal software developed for **Carnival**. All rights reserved.
