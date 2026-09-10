# Agent Interaction Protocol & System Directives

Welcome to **Carnival Job Runner** (`carnival-job-runner`). This repository is structured using **Node-Based Spec-Driven Development (SDD)**.

Follow the instructions below to navigate and interact with this codebase efficiently while minimizing token consumption.

---

## 1. The Golden Rule of Navigation
> **NEVER** scan arbitrary source code files or traverse large directories blindly.
> Always consult **`docs/INDEX.md`** first to locate the specific node governing the subsystem or task you need to inspect or modify.

Each module and task in this project is documented as an **atomic, self-contained node** located in `docs/arch/` or `docs/tasks/`. Reading the single relevant node gives you 100% of the schemas, constraints, and contracts needed to implement or fix a feature. Detailed operating manual: [docs/WORKFLOW.md](file:///home/osvaldev/Documents/carnival/job-runner/docs/WORKFLOW.md).

---

## 2. Agent Navigation Algorithm

When receiving an instruction or bug report:
1. **Locate the Node**: Open [docs/INDEX.md](file:///home/osvaldev/Documents/carnival/job-runner/docs/INDEX.md) and search the Master Registry for the relevant `ARCH-*` or `TASK-*` ID.
2. **Read the Spec Node**: Read that single markdown node file (typically 150–350 lines). It contains:
   - Upstream dependencies & downstream consumers.
   - Input contracts (SQL queries, source API endpoints, parameter schemas).
   - Output contracts (HTTP payloads, endpoints, authorization headers).
   - Invariants, error handling, and verification commands.
3. **Inspect Code Files**: Open **only** the files declared in the node's `code_files` frontmatter.
4. **Execute & Test**: Use the task CLI command (e.g. `npm run task:<name>`) or `npm run build`.

---

## 3. Change Trigger Matrix (Mandatory Doc Updates)

Whenever modifying code, you **MUST** update the corresponding documentation files according to this matrix:

| If you modify... | Code Files | Mandatory Spec Node to Update | Documentation to Sync |
| :--- | :--- | :--- | :--- |
| **Cron schedule or Task toggle** | `src/scheduler/schedules.ts` | `docs/tasks/TASK-XX-<NAME>.md`<br>(frontmatter `schedule` & `status`) | [`docs/INDEX.md`](file:///home/osvaldev/Documents/carnival/job-runner/docs/INDEX.md)<br>(Section 2 Registry & Section 3 Crontab Matrix) |
| **SQL query, view, or columns** | `src/tasks/<task>/index.ts`<br>`src/tasks/<task>/types.ts` | `docs/tasks/TASK-XX-<NAME>.md`<br>(Section 4 Extract & Section 5 Transform) | — |
| **Target API payload or endpoint** | `src/tasks/<task>/index.ts`<br>`src/tasks/<task>/types.ts`<br>`src/config/env.ts` | `docs/tasks/TASK-XX-<NAME>.md`<br>(Section 6 Load Contract) | [`docs/INDEX.md`](file:///home/osvaldev/Documents/carnival/job-runner/docs/INDEX.md)<br>(Section 1 Topology & Section 2 Registry) |
| **Database pool, timeouts, credentials** | `src/config/database.ts`<br>`src/config/env.ts` | [`docs/arch/ARCH-02-DATABASE.md`](file:///home/osvaldev/Documents/carnival/job-runner/docs/arch/ARCH-02-DATABASE.md) | — |
| **Logging behavior or log directory** | `src/utils/logger.ts`<br>`logs/README.md` | [`docs/arch/ARCH-03-LOGGING.md`](file:///home/osvaldev/Documents/carnival/job-runner/docs/arch/ARCH-03-LOGGING.md) | — |
| **Daemon lifecycle or PM2 config** | `src/scheduler/index.ts`<br>`ecosystem.config.cjs` | [`docs/arch/ARCH-01-SCHEDULER.md`](file:///home/osvaldev/Documents/carnival/job-runner/docs/arch/ARCH-01-SCHEDULER.md) | — |
| **Adding a brand new task** | `src/tasks/<newTask>/*`<br>`src/scheduler/schedules.ts`<br>`package.json` | Create `docs/tasks/TASK-XX-<NAME>.md`<br>(from `docs/templates/task-node.template.md`) | [`docs/INDEX.md`](file:///home/osvaldev/Documents/carnival/job-runner/docs/INDEX.md)<br>(Add to Registry & Schedule Matrix) |

---

## 4. Quality Gate & Workspace Skills

Before completing any task, run the automated health check:
```bash
npm run spec:verify
```
This script audits:
- Synchrony between `src/scheduler/schedules.ts` and `docs/INDEX.md` + task frontmatters.
- Physical existence of all `code_files` declared in specs.
- Validity of all internal links in `docs/`.

### Available Workspace Skills
- **`doc-health`**: Run diagnostic checks on documentation integrity and detect schedule/schema drift.
- **`sdd-workflow`**: Step-by-step procedural runbook for adding or modifying tasks following Spec-First principles.

---

## 5. Key CLI Commands

| Command | Purpose |
| :--- | :--- |
| `npm run spec:verify` | Audit documentation health and detect code/spec drift |
| `npm run dev` | Run daemon in watch mode using `tsx` |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run compiled daemon in production mode |
| `npm run start:pm2` | Build and start daemon as a PM2 process |
| `npm run task:inventory` | Execute `updateInventory` task on-demand (CLI) |
| `npm run task:dimensions` | Execute `updateDimensions` task on-demand (CLI) |
| `npm run task:livedash` | Execute `livedashPush` task on-demand (CLI) |
| `npm run task:logbook` | Execute `logbookUpdateDB` task on-demand (CLI) |
