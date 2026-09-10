---
name: doc-health
description: >-
  Audit the health, integrity, and synchronization between the codebase and documentation specifications in carnival-job-runner. Use this skill when the user asks to verify doc health, check for cron or schema drift, or validate spec compliance.
---

# Documentation Health & Drift Auditor

Use this skill to audit the integrity of the Spec-Driven Development (SDD) documentation system in `carnival-job-runner` and identify any divergence between TypeScript code and markdown nodes.

## Core Execution Steps

### 1. Execute the Automated Health Checker
Run the pre-configured verification script:
```bash
npm run spec:verify
```

### 2. Interpret Results
- **Pass (Code 0)**: All code files exist on disk, cron schedules in `src/scheduler/schedules.ts` match task frontmatters, and all templates are intact.
- **Fail (Code 1)**:
  - If **CRON DRIFT** is reported: Compare `src/scheduler/schedules.ts` with `docs/tasks/<TASK>.md` and `docs/INDEX.md`. Determine if code was changed without updating the spec, or vice-versa.
  - If **MISSING CODE FILE** is reported: Check the `code_files` frontmatter in the affected spec node.
  - If **STATUS DRIFT** is reported: Check whether a task was commented out or enabled in `schedules.ts` without toggling `status: active | standby` in `docs/tasks/<TASK>.md` and `docs/INDEX.md`.

### 3. Check for Undocumented Git Modifications
Check which files have been modified in version control:
```bash
git status -s
```
Cross-reference modified files against the **Change Trigger Matrix** in [docs/WORKFLOW.md](file:///home/osvaldev/Documents/carnival/job-runner/docs/WORKFLOW.md#2-change-trigger-matrix):
- If `src/tasks/updateInventory/index.ts` was modified, ensure `docs/tasks/TASK-01-UPDATE-INVENTORY.md` is also staged or modified.
- If `src/scheduler/schedules.ts` was modified, ensure `docs/INDEX.md` was also updated.

### 4. Provide Health Scorecard
Present a concise report to the user summarizing:
- Verification status (Pass / Fail).
- List of verified task specs.
- Any detected drifts and the exact files requiring synchronization.
