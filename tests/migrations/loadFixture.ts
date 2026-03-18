import { promises as fs } from 'node:fs';
import path from 'node:path';

const FIXTURE_DIR = path.resolve(process.cwd(), 'tests', 'migrations', 'fixtures');

export const loadMigrationFixture = async (name: string): Promise<Record<string, unknown>> =>
  JSON.parse(await fs.readFile(path.join(FIXTURE_DIR, `${name}.json`), 'utf8')) as Record<string, unknown>;
