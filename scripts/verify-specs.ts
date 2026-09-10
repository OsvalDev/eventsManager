import fs from 'fs';
import path from 'path';

interface SpecNode {
  filePath: string;
  id?: string;
  title?: string;
  status?: string;
  schedule?: string;
  codeFiles: string[];
}

const ROOT_DIR = process.cwd();
const DOCS_DIR = path.join(ROOT_DIR, 'docs');

let errorCount = 0;
let warningCount = 0;

function logPass(msg: string): void {
  console.log(`\x1b[32m✔ [PASS]\x1b[0m ${msg}`);
}

function logWarn(msg: string): void {
  warningCount++;
  console.log(`\x1b[33m▲ [WARN]\x1b[0m ${msg}`);
}

function logError(msg: string): void {
  errorCount++;
  console.log(`\x1b[31m✖ [FAIL]\x1b[0m ${msg}`);
}

/**
 * Extracts frontmatter fields from markdown files
 */
function parseFrontmatter(filePath: string): SpecNode {
  const content = fs.readFileSync(filePath, 'utf-8');
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  
  const node: SpecNode = {
    filePath,
    codeFiles: [],
  };

  if (!frontmatterMatch) {
    return node;
  }

  const lines = frontmatterMatch[1].split(/\r?\n/);
  let inCodeFiles = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('id:')) {
      node.id = trimmed.replace(/^id:\s*["']?([^"']+)["']?/, '$1').trim();
    } else if (trimmed.startsWith('title:')) {
      node.title = trimmed.replace(/^title:\s*["']?([^"']+)["']?/, '$1').trim();
    } else if (trimmed.startsWith('status:')) {
      node.status = trimmed.replace(/^status:\s*["']?([^"']+)["']?/, '$1').trim();
    } else if (trimmed.startsWith('schedule:')) {
      node.schedule = trimmed.replace(/^schedule:\s*["']?([^"']+)["']?/, '$1').split('#')[0].trim();
    } else if (trimmed.startsWith('code_files:')) {
      inCodeFiles = true;
    } else if (inCodeFiles) {
      if (trimmed.startsWith('-')) {
        const file = trimmed.replace(/^-\s*["']?([^"']+)["']?/, '$1').trim();
        node.codeFiles.push(file);
      } else if (trimmed.includes(':')) {
        inCodeFiles = false;
      }
    }
  }

  return node;
}

/**
 * 1. Check all docs/arch and docs/tasks files
 */
function checkSpecNodes(): void {
  console.log('\n--- 1. AUDITING SPECIFICATION NODES & CODE EXISTENCE ---');
  
  const taskDir = path.join(DOCS_DIR, 'tasks');
  const archDir = path.join(DOCS_DIR, 'arch');
  
  const files: string[] = [];
  if (fs.existsSync(taskDir)) {
    fs.readdirSync(taskDir)
      .filter((f) => f.endsWith('.md'))
      .forEach((f) => files.push(path.join(taskDir, f)));
  }
  if (fs.existsSync(archDir)) {
    fs.readdirSync(archDir)
      .filter((f) => f.endsWith('.md'))
      .forEach((f) => files.push(path.join(archDir, f)));
  }

  if (files.length === 0) {
    logError('No specification nodes found in docs/tasks/ or docs/arch/');
    return;
  }

  for (const file of files) {
    const relFile = path.relative(ROOT_DIR, file);
    const node = parseFrontmatter(file);

    if (!node.id) {
      logError(`${relFile} is missing required 'id' in frontmatter.`);
    }

    if (node.codeFiles.length === 0) {
      logWarn(`${relFile} does not declare any 'code_files' in frontmatter.`);
    } else {
      for (const codeFile of node.codeFiles) {
        const fullCodePath = path.resolve(ROOT_DIR, codeFile);
        if (!fs.existsSync(fullCodePath)) {
          logError(`${relFile} declares '${codeFile}', but file does NOT exist on disk!`);
        } else {
          logPass(`[${node.id || 'NODE'}] Verified code file: ${codeFile}`);
        }
      }
    }
  }
}

/**
 * 2. Check for Schedule & Status Drift between schedules.ts and docs
 */
function checkScheduleDrift(): void {
  console.log('\n--- 2. DETECTING SCHEDULE & CONFIGURATION DRIFT ---');
  
  const schedulesPath = path.join(ROOT_DIR, 'src/scheduler/schedules.ts');
  if (!fs.existsSync(schedulesPath)) {
    logError(`Scheduler config not found at ${schedulesPath}`);
    return;
  }

  const schedulesContent = fs.readFileSync(schedulesPath, 'utf-8');

  // Mapping between task file and job id
  const taskToJobMap: Record<string, string> = {
    'TASK-01-UPDATE-INVENTORY.md': 'update-inventory',
    'TASK-02-UPDATE-DIMENSIONS.md': 'update-dimensions',
    'TASK-03-LIVEDASH-PUSH.md': 'livedash-push',
    'TASK-04-LOGBOOK-SYNC.md': 'logbook-sync',
  };

  const tasksDir = path.join(DOCS_DIR, 'tasks');

  for (const [taskFileName, jobId] of Object.entries(taskToJobMap)) {
    const taskFilePath = path.join(tasksDir, taskFileName);
    if (!fs.existsSync(taskFilePath)) {
      logWarn(`Task file ${taskFileName} not found for drift verification.`);
      continue;
    }

    const node = parseFrontmatter(taskFilePath);
    if (!node.schedule) {
      logWarn(`${taskFileName} has no schedule defined in frontmatter.`);
      continue;
    }

    // Extract cron from schedules.ts for this job
    // Regex searches for id: 'jobId' followed by cronExpression: '...'
    const jobRegex = new RegExp(`id:\\s*['"]${jobId}['"][\\s\\S]*?cronExpression:\\s*['"]([^'"]+)['"]`, 'm');
    const match = schedulesContent.match(jobRegex);

    if (!match) {
      logWarn(`Job '${jobId}' not found in src/scheduler/schedules.ts.`);
      continue;
    }

    const codeCron = match[1].trim();
    const docCron = node.schedule.trim();

    if (codeCron !== docCron) {
      logError(`CRON DRIFT DETECTED for [${node.id}]:`);
      console.log(`    - Code in schedules.ts : "${codeCron}"`);
      console.log(`    - Doc in ${taskFileName} : "${docCron}"`);
    } else {
      logPass(`[${node.id}] Schedule sync OK: "${codeCron}"`);
    }

    // Check enabled status
    const jobLine = schedulesContent.split(/\r?\n/).find((l) => l.includes(`id: '${jobId}'`) || l.includes(`id: "${jobId}"`));
    const isCommentedOut = jobLine ? jobLine.trim().startsWith('//') : false;

    const enabledRegex = new RegExp(`id:\\s*['"]${jobId}['"][\\s\\S]*?enabled:\\s*(true|false)`, 'm');
    const enabledMatch = schedulesContent.match(enabledRegex);
    const isEnabledInCode = isCommentedOut ? false : (enabledMatch ? enabledMatch[1] === 'true' : false);

    const docStatus = (node.status || '').toLowerCase();
    const isEnabledInDoc = docStatus === 'active';

    if (isEnabledInCode !== isEnabledInDoc) {
      logWarn(`STATUS DRIFT for [${node.id}]: Code active=${isEnabledInCode}, Doc status='${node.status}'`);
    } else {
      logPass(`[${node.id}] Status sync OK: code=${isEnabledInCode ? 'active' : 'standby'} | doc='${node.status}'`);
    }
  }
}

/**
 * 3. Verify Master Index & Templates
 */
function checkIndexAndTemplates(): void {
  console.log('\n--- 3. VERIFYING MASTER REGISTRY & TEMPLATES ---');
  
  const indexPath = path.join(DOCS_DIR, 'INDEX.md');
  if (!fs.existsSync(indexPath)) {
    logError('docs/INDEX.md does not exist!');
    return;
  }
  logPass('Master registry docs/INDEX.md exists.');

  const taskTemplate = path.join(DOCS_DIR, 'templates/task-node.template.md');
  const archTemplate = path.join(DOCS_DIR, 'templates/arch-node.template.md');

  if (fs.existsSync(taskTemplate)) {
    logPass('Task template docs/templates/task-node.template.md exists.');
  } else {
    logError('Task template docs/templates/task-node.template.md missing!');
  }

  if (fs.existsSync(archTemplate)) {
    logPass('Arch template docs/templates/arch-node.template.md exists.');
  } else {
    logError('Arch template docs/templates/arch-node.template.md missing!');
  }

  const agentsFile = path.join(ROOT_DIR, 'AGENTS.md');
  if (fs.existsSync(agentsFile)) {
    logPass('AI protocol AGENTS.md exists at root.');
  } else {
    logError('AGENTS.md missing at project root!');
  }

  const workflowFile = path.join(DOCS_DIR, 'WORKFLOW.md');
  if (fs.existsSync(workflowFile)) {
    logPass('Governance manual docs/WORKFLOW.md exists.');
  } else {
    logError('docs/WORKFLOW.md missing!');
  }
}

/**
 * Main execution
 */
function run(): void {
  console.log('====================================================');
  console.log('CARNIVAL JOB RUNNER - SPEC & DOCS HEALTH CHECK');
  console.log('====================================================');

  checkSpecNodes();
  checkScheduleDrift();
  checkIndexAndTemplates();

  console.log('\n====================================================');
  console.log(`SUMMARY: ${errorCount} errors, ${warningCount} warnings.`);
  console.log('====================================================');

  if (errorCount > 0) {
    console.log('\x1b[31mSpec verification FAILED. Please resolve the errors above.\x1b[0m\n');
    process.exit(1);
  } else {
    console.log('\x1b[32mAll specifications and code mappings are 100% HEALTHY!\x1b[0m\n');
    process.exit(0);
  }
}

run();
