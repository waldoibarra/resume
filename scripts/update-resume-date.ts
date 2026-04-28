import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const execAsync = promisify(exec);

interface ResumeMeta {
  [key: string]: any;
  version: string;
  canonical: string;
  lastModified: string;
}

interface ResumeJson {
  [key: string]: any;
  meta: ResumeMeta;
}

const getGitLastCommitDate = async (resumePath: string): Promise<string> => {
  const { stdout } = await execAsync(
    `git log -1 --pretty=format:%aI -- "${resumePath}"`,
  );
  const dateStr = stdout.trim();
  if (!dateStr) throw new Error(`No git history found for: ${resumePath}`);
  return new Date(dateStr).toISOString();
};

const readResumeJson = async (resumePath: string): Promise<ResumeJson> =>
  JSON.parse(await readFile(resumePath, 'utf-8'));

const writeResumeJson = async (
  resumePath: string,
  resume: ResumeJson,
): Promise<void> =>
  writeFile(resumePath, JSON.stringify(resume, null, 2) + '\n', 'utf-8');

const amendCommitFile = async (resumePath: string): Promise<void> => {
  await execAsync(`git add "${resumePath}"`);
  await execAsync('git commit --amend --no-edit --no-verify');
};

async function updateResumeLastModified(resumeJsonFile: string): Promise<void> {
  const resumePath = join(__dirname, '..', resumeJsonFile);

  const [resume, lastModified] = await Promise.all([
    readResumeJson(resumePath),
    getGitLastCommitDate(resumePath),
  ]);

  if (resume.meta.lastModified === lastModified) {
    console.log(`🔷 Resume JSON meta.lastModified is already up to date: ${lastModified} 🔷\n`);
    return;
  }

  await writeResumeJson(resumePath, {
    ...resume,
    meta: { ...resume.meta, lastModified },
  });
  await amendCommitFile(resumePath);

  console.log(
    `🔷 Amended commit (${resumeJsonFile}) with meta.lastModified: ${lastModified} 🔷\n`,
  );
}

updateResumeLastModified('resume.json').catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
