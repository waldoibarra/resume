import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const resumePath = 'resume.json';
const resumeCli = join(__dirname, '..', 'node_modules', '.bin', 'resume');

type Resume = { meta?: { lastModified?: string; [key: string]: unknown }; [key: string]: unknown };

function git(...args: string[]): Buffer {
  const command = spawnSync('git', args, { encoding: 'buffer' });
  if (command.error || command.status !== 0) {
    throw new Error(command.stderr?.toString() || command.error?.message || `git ${args[0]} failed`);
  }
  return command.stdout;
}

function parseResume(bytes: Buffer): Resume {
  return JSON.parse(bytes.toString('utf8')) as Resume;
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => [key, canonical(item)]));
  }
  return value;
}

function withoutTimestamp(resume: Resume): string {
  const { lastModified: _lastModified, ...meta } = resume.meta ?? {};
  return JSON.stringify(canonical({ ...resume, meta }));
}

function validate(bytes: Buffer): void {
  const validation = spawnSync(resumeCli, ['validate', '--resume', '-'], {
    input: bytes,
    encoding: 'utf8',
  });
  if (validation.error || validation.status !== 0) {
    throw new Error(validation.stderr || validation.stdout || validation.error?.message || 'Validation failed');
  }
}

function updateResumeDate(): void {
  if (git('ls-files', '-u', '--', resumePath).length) {
    throw new Error('Resolve resume.json conflicts before committing');
  }
  const staged = git('show', `:${resumePath}`);
  // Validate the index even when only documentation is being committed.
  validate(staged);
  const current = parseResume(staged);
  const headCheck = spawnSync('git', ['cat-file', '-e', `HEAD:${resumePath}`]);
  if (headCheck.error || (headCheck.status !== 0 && headCheck.status !== 1 && headCheck.status !== 128)) {
    throw new Error(headCheck.error?.message || 'Could not inspect HEAD');
  }
  const previous = headCheck.status === 0 ? parseResume(git('show', `HEAD:${resumePath}`)) : null;
  if (previous && withoutTimestamp(current) === withoutTimestamp(previous)) return;

  if (!readFileSync(resumePath).equals(staged)) {
    throw new Error('Stage all resume.json changes before committing');
  }

  // An earlier hook invocation owns its timestamp throughout this staging cycle.
  if (previous && current.meta?.lastModified !== previous.meta?.lastModified) return;

  const candidate = Buffer.from(JSON.stringify({
    ...current,
    meta: { ...current.meta, lastModified: new Date().toISOString() },
  }, null, 2) + '\n');
  validate(candidate);
  writeFileSync(resumePath, candidate);
  git('add', '--', resumePath);
}

try {
  updateResumeDate();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
