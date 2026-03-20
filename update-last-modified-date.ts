import { readFile, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const resumeJsonFile = 'resume.json';

interface ResumeJsonSchemaLite {
  [key: string]: any;
  meta: {
    [key: string]: any;
    version: string;
    canonical: string;
    lastModified: string;
  };
}

const getResumeJsonAndLastModifiedDate = async (resumePath: string) => {
  const { mtime } = await stat(resumePath);
  const resumeFileString = await readFile(resumePath, 'utf-8');

  const resumeFileLastModifiedDate: string = mtime.toISOString();
  const resumeJson: ResumeJsonSchemaLite = JSON.parse(resumeFileString);

  return {
    resumeFileLastModifiedDate,
    resumeJson,
  };
};

async function updateResumeFileModificationDate(
  resumeJsonFile: string,
): Promise<void> {
  const resumePath = join(__dirname, resumeJsonFile);

  try {
    const { resumeFileLastModifiedDate, resumeJson } =
      await getResumeJsonAndLastModifiedDate(resumePath);

    resumeJson.meta.lastModified = resumeFileLastModifiedDate;

    await writeFile(resumePath, JSON.stringify(resumeJson, null, 2), 'utf-8');

    console.log(
      `Successfully updated the 'meta.lastModified' date in ${resumeJsonFile} to: ${resumeFileLastModifiedDate}`,
    );
  } catch (error) {
    console.error('Error updating the resume JSON file: ', error);
  }
}

updateResumeFileModificationDate(resumeJsonFile);
