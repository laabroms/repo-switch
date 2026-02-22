import { existsSync, readdirSync, statSync } from 'fs';
import { basename, join, dirname } from 'path';
import { execSync } from 'child_process';
import { homedir } from 'os';

export interface Repo {
  name: string;
  path: string;
  branch: string;
  dirty: boolean;
  lastCommit: string;
  remoteUrl: string;
  ahead: number;
  behind: number;
}

const COMMON_CODE_DIRS = [
  'Desktop', 'Documents', 'Projects', 'projects', 'Code', 'code',
  'dev', 'Dev', 'src', 'repos', 'Repos', 'workspace', 'Workspace',
  'work', 'Work', 'Github', 'github', '.openclaw/workspace',
];

function getSearchDirs(): string[] {
  const home = homedir();
  const dirs: string[] = [];

  for (const dir of COMMON_CODE_DIRS) {
    const full = join(home, dir);
    if (existsSync(full)) {
      dirs.push(full);
    }
  }

  // Fallback: if no common dirs found, scan home with depth 2
  if (dirs.length === 0) {
    dirs.push(home);
  }

  return dirs;
}

function findGitReposFast(dirs: string[]): string[] {
  const excludes = [
    'node_modules', '.Trash', 'Library', '.cache', '.npm', '.yarn',
    '.pnpm', 'vendor', '.next', '__pycache__', 'venv', '.venv',
    '.cargo', '.rustup', '.local', '.config',
  ];

  const pruneExpr = excludes
    .map((d) => `-name "${d}"`)
    .join(' -o ');

  const allPaths: string[] = [];

  for (const dir of dirs) {
    try {
      const cmd = `find "${dir}" -maxdepth 5 \\( ${pruneExpr} \\) -prune -o -name ".git" -type d -print 2>/dev/null | head -100`;
      const output = execSync(cmd, { encoding: 'utf8', timeout: 10000 });

      const paths = output
        .split('\n')
        .filter(Boolean)
        .map((gitDir) => gitDir.replace(/\/\.git$/, ''));

      allPaths.push(...paths);
    } catch {
      // skip dirs that fail
    }
  }

  return allPaths;
}

function getRepoInfo(repoPath: string): Repo | null {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: repoPath,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
      timeout: 3000,
    }).trim();

    const dirtyOutput = execSync('git status --porcelain', {
      cwd: repoPath,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
      timeout: 3000,
    }).trim();

    let lastCommit = '';
    try {
      lastCommit = execSync('git log -1 --format="%ar"', {
        cwd: repoPath,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
        timeout: 3000,
      }).trim();
    } catch {
      lastCommit = 'no commits';
    }

    // Remote URL
    let remoteUrl = '';
    try {
      remoteUrl = execSync('git remote get-url origin', {
        cwd: repoPath,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
        timeout: 3000,
      }).trim();
      remoteUrl = remoteUrl
        .replace(/^git@github\.com:/, 'https://github.com/')
        .replace(/\.git$/, '');
    } catch {
      // no remote
    }

    // Ahead/behind
    let ahead = 0;
    let behind = 0;
    try {
      const abOutput = execSync('git rev-list --left-right --count HEAD...@{upstream}', {
        cwd: repoPath,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
        timeout: 3000,
      }).trim();
      const [a, b] = abOutput.split(/\s+/);
      ahead = parseInt(a, 10) || 0;
      behind = parseInt(b, 10) || 0;
    } catch {
      // no upstream
    }

    return {
      name: basename(repoPath),
      path: repoPath,
      branch,
      dirty: dirtyOutput.length > 0,
      lastCommit,
      remoteUrl,
      ahead,
      behind,
    };
  } catch {
    return null;
  }
}

export function scanRepos(): Repo[] {
  const searchDirs = getSearchDirs();
  const repoPaths = findGitReposFast(searchDirs);

  const repos: Repo[] = [];
  for (const repoPath of repoPaths) {
    const info = getRepoInfo(repoPath);
    if (info) {
      repos.push(info);
    }
  }

  // Sort alphabetically
  repos.sort((a, b) => a.name.localeCompare(b.name));
  return repos;
}

export interface DirEntry {
  name: string;
  path: string;
  isDirectory: boolean;
}

const HIDDEN_DIRS = new Set([
  'node_modules', '.git', '.next', '__pycache__', 'dist',
  '.cache', '.turbo', '.vercel', '.DS_Store',
]);

export function listDirectory(dirPath: string): DirEntry[] {
  try {
    const entries = readdirSync(dirPath);
    const dirs: DirEntry[] = [];
    const files: DirEntry[] = [];

    for (const entry of entries) {
      if (entry.startsWith('.') || HIDDEN_DIRS.has(entry)) continue;

      const fullPath = join(dirPath, entry);
      try {
        const stat = statSync(fullPath);
        const item = { name: entry, path: fullPath, isDirectory: stat.isDirectory() };
        if (stat.isDirectory()) {
          dirs.push(item);
        } else {
          files.push(item);
        }
      } catch {
        // skip unreadable
      }
    }

    // Directories first, then files, both alphabetical
    dirs.sort((a, b) => a.name.localeCompare(b.name));
    files.sort((a, b) => a.name.localeCompare(b.name));
    return [...dirs, ...files];
  } catch {
    return [];
  }
}

export function getParentDir(dirPath: string): string {
  return dirname(dirPath);
}

export function runGitAction(repoPath: string, action: 'pull' | 'status' | 'log'): string {
  try {
    switch (action) {
      case 'pull':
        return execSync('git pull --ff-only', {
          cwd: repoPath,
          encoding: 'utf8',
          timeout: 15000,
        }).trim();
      case 'status':
        return execSync('git status --short', {
          cwd: repoPath,
          encoding: 'utf8',
          timeout: 5000,
        }).trim() || 'Clean — nothing to commit';
      case 'log':
        return execSync('git log --oneline -10', {
          cwd: repoPath,
          encoding: 'utf8',
          timeout: 5000,
        }).trim();
    }
  } catch (e: unknown) {
    return (e as Error).message || 'Command failed';
  }
}

export function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase();
  const t = text.toLowerCase();

  if (t.includes(q)) return true;

  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}
