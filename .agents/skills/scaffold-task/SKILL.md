---
name: scaffold-task
description: >-
  Automatically scaffold a new ETL background task, generate its Spec-Driven Development (SDD) markdown specification, create the TypeScript source files, and register it across the scheduler, package.json, and docs/INDEX.md. Use this skill when asked to create, add, or generate a new task or background job in carnival-job-runner.
---

# Task Scaffolding & Code Generation Skill

Use this skill whenever you need to introduce a brand new background ETL worker or scheduled task into `carnival-job-runner`.

---

## 1. Execute the Scaffolder CLI

Run the scaffolding generator with the desired task name (in camelCase or kebab-case):

```bash
npm run task:new <taskName>
```

*Example:*
```bash
npm run task:new syncCustomers
```

### What gets generated automatically:
1. **Spec Node**: `docs/tasks/TASK-XX-<SLUG>.md` (auto-increments to the next sequential `TASK-XX` ID).
2. **Types Definition**: `src/tasks/<taskName>/types.ts` with typed database and payload interfaces.
3. **Task Implementation**: `src/tasks/<taskName>/index.ts` with connection pooling, error boundaries, and logging.
4. **CLI Entrypoint**: `src/tasks/<taskName>/cli.ts` for on-demand execution.
5. **Scheduler Entry**: Registered as a standby task in [src/scheduler/schedules.ts](file:///home/osvaldev/Documents/carnival/job-runner/src/scheduler/schedules.ts).
6. **Package Script**: Adds `"task:<kebab-name>"` to [package.json](file:///home/osvaldev/Documents/carnival/job-runner/package.json).
7. **Master Registry**: Adds a new entry into the Master Node Registry in [docs/INDEX.md](file:///home/osvaldev/Documents/carnival/job-runner/docs/INDEX.md).

---

## 2. Customize the Specification (Spec-First)

Before implementing the business logic, open the newly generated spec node:
`docs/tasks/TASK-XX-<SLUG>.md`

1. Update **Section 1**: Write a clear 1-2 sentence business description.
2. Update **Section 4 (Extract)**: Document the target table/view and the exact `SELECT` query.
3. Update **Section 5 (Transform)**: Describe transformation and mapping rules.
4. Update **Section 6 (Load)**: Specify the destination endpoint, HTTP headers, and JSON payload schema.
5. If the cron schedule needs to differ from the default (`0 8 * * 1-5`), update the frontmatter and sync with [docs/INDEX.md](file:///home/osvaldev/Documents/carnival/job-runner/docs/INDEX.md).

---

## 3. Implement Domain Logic & Contracts

1. **`src/tasks/<taskName>/types.ts`**:
   Reflect all extracted SQL columns into `Raw<TaskName>Item` and target payload fields into `<TaskName>PayloadItem`.
2. **`src/tasks/<taskName>/index.ts`**:
   - Replace the placeholder SQL query with the validated query from Section 4.
   - Map records into the payload format.
   - Configure the target endpoint in [src/config/env.ts](file:///home/osvaldev/Documents/carnival/job-runner/src/config/env.ts) if necessary.

---

## 4. Run Quality Gate & Verify

Verify documentation integrity and compilation:

```bash
# 1. Audit spec and code synchronization
npm run spec:verify

# 2. Compile TypeScript
npm run build

# 3. Test on-demand execution (optional/dry-run)
npm run task:<kebab-name>
```
