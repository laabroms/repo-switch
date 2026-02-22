import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const CONFIG_PATH = join(homedir(), '.repo-switch.json');

interface Config {
  favorites: string[]; // repo paths
  scanDirs?: string[];
}

function loadConfig(): Config {
  try {
    if (existsSync(CONFIG_PATH)) {
      return JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
    }
  } catch {
    // corrupted config
  }
  return { favorites: [] };
}

function saveConfig(config: Config): void {
  try {
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n');
  } catch {
    // can't write
  }
}

export function getFavorites(): Set<string> {
  return new Set(loadConfig().favorites);
}

export function toggleFavorite(repoPath: string): boolean {
  const config = loadConfig();
  const index = config.favorites.indexOf(repoPath);
  if (index >= 0) {
    config.favorites.splice(index, 1);
    saveConfig(config);
    return false; // removed
  } else {
    config.favorites.push(repoPath);
    saveConfig(config);
    return true; // added
  }
}
