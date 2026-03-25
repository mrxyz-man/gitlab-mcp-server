import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const FALLBACK_VERSION = '0.1.0';
const PACKAGE_NAME = 'gitlab-mcp-agent-server';

type PackageJson = {
  name?: string;
  version?: string;
};

export function resolveRuntimeVersion(startDir: string): string {
  const byEnv = process.env.npm_package_version;
  if (byEnv && byEnv.trim().length > 0) {
    return byEnv;
  }

  const maxDepth = 12;
  let cursor = startDir;

  for (let depth = 0; depth < maxDepth; depth += 1) {
    const packageJsonPath = join(cursor, 'package.json');
    if (existsSync(packageJsonPath)) {
      const parsed = readPackageJson(packageJsonPath);
      if (parsed?.name === PACKAGE_NAME && parsed.version) {
        return parsed.version;
      }
    }

    const next = dirname(cursor);
    if (next === cursor) {
      break;
    }
    cursor = next;
  }

  return FALLBACK_VERSION;
}

function readPackageJson(path: string): PackageJson | undefined {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as PackageJson;
  } catch {
    return undefined;
  }
}
