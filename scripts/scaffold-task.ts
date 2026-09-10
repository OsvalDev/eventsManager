import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();
const DOCS_TASKS_DIR = path.join(ROOT_DIR, 'docs/tasks');
const SRC_TASKS_DIR = path.join(ROOT_DIR, 'src/tasks');
const SCHEDULES_FILE = path.join(ROOT_DIR, 'src/scheduler/schedules.ts');
const INDEX_FILE = path.join(ROOT_DIR, 'docs/INDEX.md');
const PACKAGE_FILE = path.join(ROOT_DIR, 'package.json');

function toCamelCase(str: string): string {
  return str
    .replace(/[-_]([a-z])/g, (_, g) => g.toUpperCase())
    .replace(/^[A-Z]/, (g) => g.toLowerCase());
}

function toPascalCase(str: string): string {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .toLowerCase()
    .replace(/^-+|-+$/g, '');
}

function toTitleCase(str: string): string {
  return toKebabCase(str)
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function getNextTaskId(): { id: string; num: number } {
  if (!fs.existsSync(DOCS_TASKS_DIR)) {
    fs.mkdirSync(DOCS_TASKS_DIR, { recursive: true });
  }
  const files = fs.readdirSync(DOCS_TASKS_DIR);
  let maxNum = 0;

  for (const file of files) {
    const match = file.match(/^TASK-(\d+)/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  }

  const nextNum = maxNum + 1;
  const id = `TASK-${String(nextNum).padStart(2, '0')}`;
  return { id, num: nextNum };
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0].startsWith('-')) {
    console.error('\x1b[31mUsage: npm run task:new <taskName>\x1b[0m');
    console.error('Example: npm run task:new syncCustomers');
    process.exit(1);
  }

  const rawName = args[0];
  const camelName = toCamelCase(rawName);
  const pascalName = toPascalCase(rawName);
  const kebabName = toKebabCase(rawName);
  const titleName = toTitleCase(rawName);
  const upperSlug = kebabName.toUpperCase();

  const { id: taskId } = getNextTaskId();
  const defaultCron = '0 8 * * 1-5';

  console.log(`\n====================================================`);
  console.log(` SCAFFOLDING NEW TASK: [${taskId}] ${titleName}`);
  console.log(`====================================================\n`);

  // 1. Create Spec Node: docs/tasks/TASK-XX-<SLUG>.md
  const specFileName = `${taskId}-${upperSlug}.md`;
  const specFilePath = path.join(DOCS_TASKS_DIR, specFileName);

  const specContent = `---
id: "${taskId}"
title: "${titleName}"
type: "task"
status: "standby"
schedule: "${defaultCron}" # Mon-Fri at 8:00 AM
code_files:
  - "src/tasks/${camelName}/index.ts"
  - "src/tasks/${camelName}/cli.ts"
  - "src/tasks/${camelName}/types.ts"
upstream:
  - "docs/arch/ARCH-01-SCHEDULER.md"
  - "docs/arch/ARCH-02-DATABASE.md"
  - "docs/arch/ARCH-03-LOGGING.md"
downstream:
  - "endpoint:TARGET_API_URL/path"
---

# ${taskId}: ${titleName}

## 1. Overview & Business Context
Automated background ETL task that extracts data from MSSQL and synchronizes with target API endpoints.

---

## 2. Scheduling & Execution
- **Cron Schedule**: \`${defaultCron}\` (Mon–Fri at 8:00 AM)
- **Status**: Standby (disabled in \`src/scheduler/schedules.ts\`)
- **On-Demand CLI**: \`npm run task:${kebabName}\`
- **Direct Entrypoint**: \`tsx src/tasks/${camelName}/cli.ts\`

---

## 3. Data Pipeline & Sequence Diagram

\`\`\`mermaid
sequenceDiagram
    autonumber
    participant S as Scheduler / CLI
    participant Task as ${camelName} (index.ts)
    participant DB as MSSQL (CTRLINVENT)
    participant API as Target API (/path)
    participant Log as Logger (${camelName}.log)

    S->>Task: run${pascalName}()
    Task->>DB: createConnectionPool('CTRLINVENT')
    Task->>DB: Query Source Table / View
    DB-->>Task: recordset
    Task->>Task: Transform to API Schema
    Task->>API: HTTP POST /path
    API-->>Task: 200 OK
    Task->>DB: pool.close()
    Task->>Log: logToFile('${camelName}', report)
\`\`\`

---

## 4. Extract Contract (Source Database)
- **Target Database**: \`CTRLINVENT\`
- **Source Table / View**: \`dbo.YourSourceTable\`
- **SQL Query**:
  \`\`\`sql
  SELECT [ID], [Field1], [Field2]
  FROM dbo.YourSourceTable
  \`\`\`

---

## 5. Transform Contract (In-Memory Processing)
- Map SQL fields to camelCase properties.
- Apply null-coalescing and data sanitization.

---

## 6. Load Contract (Target API)
- **Method & Endpoint**: \`POST \${ENV.API.SYNC_BASE_URL}/path\`
- **Headers**:
  - \`Content-Type: application/json\`
- **Payload Schema**:
  \`\`\`json
  {
    "items": [
      {
        "id": "string",
        "field1": "string"
      }
    ]
  }
  \`\`\`

---

## 7. Invariants & Failure Resilience
- Connection pool **must** always be closed in a \`finally\` block.
- Non-200 responses must be logged in \`logs/${camelName}.log\`.
- Any unexpected error must re-throw to alert the scheduler.
`;

  fs.writeFileSync(specFilePath, specContent, 'utf-8');
  console.log(`✔ Created spec node: docs/tasks/${specFileName}`);

  // 2. Create Task Directory in src/tasks/<camelName>/
  const taskCodeDir = path.join(SRC_TASKS_DIR, camelName);
  if (!fs.existsSync(taskCodeDir)) {
    fs.mkdirSync(taskCodeDir, { recursive: true });
  }

  // 2a. types.ts
  const typesContent = `export interface Raw${pascalName}Item {
  ID: string;
  Field1?: string | null;
}

export interface ${pascalName}PayloadItem {
  id: string;
  field1: string;
}
`;
  fs.writeFileSync(path.join(taskCodeDir, 'types.ts'), typesContent, 'utf-8');
  console.log(`✔ Created types: src/tasks/${camelName}/types.ts`);

  // 2b. index.ts
  const indexContent = `import axios from 'axios';
import mssql from 'mssql';
import { createConnectionPool } from '../../config/database.js';
import { ENV } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import type { Raw${pascalName}Item, ${pascalName}PayloadItem } from './types.js';

export async function run${pascalName}(): Promise<void> {
  const startTime = new Date();
  logger.info('[${camelName}] Starting ${titleName} synchronization...');

  let pool: mssql.ConnectionPool | undefined;
  try {
    pool = await createConnectionPool('CTRLINVENT');

    // TODO: Replace with your actual SQL query
    const result = await pool.query<Raw${pascalName}Item>(\`
      SELECT TOP 10 'SAMPLE_ID' AS [ID], 'SAMPLE_DATA' AS [Field1]
    \`);

    const records = result.recordset;
    logger.info(\`[${camelName}] Fetched \${records.length} records from database.\`);

    const payload: ${pascalName}PayloadItem[] = records.map((item) => ({
      id: item.ID,
      field1: item.Field1 ?? '',
    }));

    // TODO: Configure target URL in src/config/env.ts
    const targetUrl = \`\${ENV.API.SYNC_BASE_URL}/${kebabName}\`;
    logger.info(\`[${camelName}] Pushing payload to \${targetUrl}...\`);

    // In dry-run or sample mode:
    // const response = await axios.post(targetUrl, { items: payload });

    const endTime = new Date();
    const durationSeconds = (endTime.getTime() - startTime.getTime()) / 1000;

    const logMsg = \`[\${startTime.toISOString()}] Completed \${records.length} records in \${durationSeconds}s.\`;
    logger.logToFile('${camelName}', logMsg);
    logger.success(\`[${camelName}] Completed successfully in \${durationSeconds}s.\`);
  } catch (err) {
    logger.error('[${camelName}] Task encountered an error:', err);
    logger.logToFile('${camelName}', \`[\${new Date().toISOString()}] Error: \${err}\`);
    throw err;
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}
`;
  fs.writeFileSync(path.join(taskCodeDir, 'index.ts'), indexContent, 'utf-8');
  console.log(`✔ Created logic: src/tasks/${camelName}/index.ts`);

  // 2c. cli.ts
  const cliContent = `import { run${pascalName} } from './index.js';

run${pascalName}()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('CLI execution failed for ${camelName}:', err);
    process.exit(1);
  });
`;
  fs.writeFileSync(path.join(taskCodeDir, 'cli.ts'), cliContent, 'utf-8');
  console.log(`✔ Created CLI entry: src/tasks/${camelName}/cli.ts`);

  // 3. Register in src/scheduler/schedules.ts
  if (fs.existsSync(SCHEDULES_FILE)) {
    let schedulesContent = fs.readFileSync(SCHEDULES_FILE, 'utf-8');

    // Add import statement at top
    const importStatement = `import { run${pascalName} } from '../tasks/${camelName}/index.js';\n`;
    if (!schedulesContent.includes(`from '../tasks/${camelName}/index.js'`)) {
      schedulesContent = importStatement + schedulesContent;
    }

    // Add job entry
    const jobEntry = `  // {
  //   id: '${kebabName}',
  //   name: '${titleName}',
  //   cronExpression: '${defaultCron}',
  //   description: '${titleName} background sync',
  //   enabled: false,
  //   run: run${pascalName},
  // },\n];`;

    schedulesContent = schedulesContent.replace(/\s*\];\s*$/, `\n${jobEntry}\n`);
    fs.writeFileSync(SCHEDULES_FILE, schedulesContent, 'utf-8');
    console.log(`✔ Registered standby job in src/scheduler/schedules.ts`);
  }

  // 4. Register in package.json scripts
  if (fs.existsSync(PACKAGE_FILE)) {
    const pkg = JSON.parse(fs.readFileSync(PACKAGE_FILE, 'utf-8'));
    pkg.scripts[`task:${kebabName}`] = `tsx src/tasks/${camelName}/cli.ts`;
    fs.writeFileSync(PACKAGE_FILE, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
    console.log(`✔ Added "task:${kebabName}" script to package.json`);
  }

  // 5. Register in docs/INDEX.md
  if (fs.existsSync(INDEX_FILE)) {
    let indexContent = fs.readFileSync(INDEX_FILE, 'utf-8');
    const tableRow = `| [${taskId}](docs/tasks/${specFileName}) | **${titleName}** | Standby | \`${defaultCron}\` | [\`src/tasks/${camelName}/*\`](src/tasks/${camelName}/index.ts) | Target API |`;

    // Append to task registry table
    const tableEndRegex = /(\| \[TASK-04\][^\n]+\n)/;
    if (tableEndRegex.test(indexContent)) {
      indexContent = indexContent.replace(tableEndRegex, `$1${tableRow}\n`);
      fs.writeFileSync(INDEX_FILE, indexContent, 'utf-8');
      console.log(`✔ Added [${taskId}] to Master Registry in docs/INDEX.md`);
    }
  }

  console.log(`\n====================================================`);
  console.log(`✔ Task [${taskId}] ${titleName} successfully scaffolded!`);
  console.log(`Run 'npm run spec:verify' to audit documentation health.`);
  console.log(`====================================================\n`);
}

main();
