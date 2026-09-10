---
name: sdd-workflow
description: >-
  Step-by-step procedural runbook for modifying tasks, adding new ETL background jobs, or altering schedules in carnival-job-runner according to Spec-Driven Development (SDD). Use when asked to create a task, modify task logic, change cron expressions, or update database/API contracts.
---

# Spec-Driven Development (SDD) Execution Runbook

Use this skill whenever tasked with modifying an existing worker or adding a new task to `carnival-job-runner`.

---

## Step 1: Identify Change Scope & Trigger Matrix
Before writing any TypeScript code, identify the change scope using the **Change Trigger Matrix**:

| Change Request | Mandatory Action |
| :--- | :--- |
| **Change Cron / Schedule** | Update `docs/tasks/TASK-*.md` frontmatter AND `docs/INDEX.md` before `src/scheduler/schedules.ts` |
| **Change SQL Query or Columns** | Update `docs/tasks/TASK-*.md` Section 4 & 5 before editing `index.ts` or `types.ts` |
| **Change Target API Payload** | Update `docs/tasks/TASK-*.md` Section 6 before updating Axios payloads |
| **Add New Background Task** | Copy `docs/templates/task-node.template.md` to `docs/tasks/TASK-XX-<NAME>.md` and register in `docs/INDEX.md` |

---

## Step 2: Spec-First Updates
1. Open the relevant node in `docs/tasks/TASK-*.md` or `docs/arch/ARCH-*.md`.
2. Update the contract sections (schemas, SQL queries, endpoints, timeouts, or cron strings).
3. If schedule or active status changed, update [docs/INDEX.md](file:///home/osvaldev/Documents/carnival/job-runner/docs/INDEX.md) Section 2 and Section 3.

---

## Step 3: Code Implementation
Follow the layer-by-layer implementation pattern:

1. **`types.ts`**:
   Define raw database interfaces (`Raw<Entity>Item`) and target API interfaces (`<Entity>PayloadItem`) exactly matching the spec contract.
2. **`index.ts`**:
   Implement the core ETL runner `run<TaskName>()`:
   - Connection pool created via `createConnectionPool()` and enclosed in `try / finally { await pool.close(); }`.
   - Data transformation with null-safe operators.
   - HTTP push via Axios with typed headers.
   - Audit logging via `logger.logToFile()`.
3. **`cli.ts`**:
   Provide the standalone runner script for direct CLI invocation.
4. **`schedules.ts`**:
   Register the task entry inside `SCHEDULED_JOBS` in `src/scheduler/schedules.ts`.
5. **`package.json`**:
   Add the CLI script shortcut: `"task:<name>": "tsx src/tasks/<name>/cli.ts"`.

---

## Step 4: Verification & Quality Gate
Always execute the automated verification suite before considering the task complete:

1. **Spec & Drift Verification**:
   ```bash
   npm run spec:verify
   ```
   Confirm that all code files exist and there is zero drift between code schedules and markdown nodes.
2. **Compilation**:
   ```bash
   npm run build
   ```
   Confirm TypeScript compiles with zero errors.
3. **On-Demand Task Verification**:
   ```bash
   npm run task:<name>
   ```
   Inspect the execution output and check `logs/<name>.log`.
