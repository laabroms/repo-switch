import React, { useState, useEffect, useMemo } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import TextInput from 'ink-text-input';
import { Logo } from './components/Logo.js';
import { RepoList } from './components/RepoList.js';
import { FileTree, type FileEntry } from './components/FileTree.js';
import { GitActionModal } from './components/GitActionModal.js';
import { scanRepos, fuzzyMatch, listDirectory, getParentDir, runGitAction, type Repo } from './scanner.js';
import { getFavorites, toggleFavorite } from './config.js';

type View = 'repos' | 'files' | 'git-action';

export function App() {
  const { exit } = useApp();
  const [allRepos, setAllRepos] = useState<Repo[]>([]);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scanning, setScanning] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // File tree state
  const [view, setView] = useState<View>('repos');
  const [currentDir, setCurrentDir] = useState('');
  const [currentRepoName, setCurrentRepoName] = useState('');
  const [currentRepoRoot, setCurrentRepoRoot] = useState('');
  const [fileEntries, setFileEntries] = useState<FileEntry[]>([]);
  const [fileIndex, setFileIndex] = useState(0);

  // Git action state
  const [gitActionType, setGitActionType] = useState('');
  const [gitActionRepo, setGitActionRepo] = useState('');
  const [gitActionOutput, setGitActionOutput] = useState('');
  const [gitActionLoading, setGitActionLoading] = useState(false);

  useEffect(() => {
    setFavorites(getFavorites());
    const repos = scanRepos();
    setAllRepos(repos);
    setScanning(false);
  }, []);

  // Sort: favorites first, then alphabetical
  const sorted = useMemo(() => {
    return [...allRepos].sort((a, b) => {
      const aFav = favorites.has(a.path) ? 0 : 1;
      const bFav = favorites.has(b.path) ? 0 : 1;
      if (aFav !== bFav) return aFav - bFav;
      return a.name.localeCompare(b.name);
    });
  }, [allRepos, favorites]);

  const filtered = useMemo(() => {
    if (!query) return sorted;
    return sorted.filter(
      (r) => fuzzyMatch(query, r.name) || fuzzyMatch(query, r.path)
    );
  }, [sorted, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Navigate into a directory
  const enterDir = (dirPath: string) => {
    const entries = listDirectory(dirPath);
    setCurrentDir(dirPath);
    setFileEntries(entries.map((e) => ({
      name: e.name,
      path: e.path,
      isDirectory: e.isDirectory,
    })));
    setFileIndex(0);
  };

  // Select a path — print to stdout so the shell wrapper can cd
  const selectPath = (path: string) => {
    setSelected(path);
    process.stdout.write(path + '\n');
    setTimeout(() => exit(), 300);
  };

  // Run a git action on the selected repo
  const doGitAction = (action: 'pull' | 'status' | 'log') => {
    const repo = filtered[selectedIndex];
    if (!repo) return;
    setGitActionType(action);
    setGitActionRepo(repo.name);
    setGitActionLoading(true);
    setGitActionOutput('');
    setView('git-action');
    const output = runGitAction(repo.path, action);
    setGitActionOutput(output);
    setGitActionLoading(false);
    if (action === 'pull') {
      const repos = scanRepos();
      setAllRepos(repos);
    }
  };

  useInput((input, key) => {
    if (selected) return;

    if (view === 'git-action') {
      setView('repos');
      return;
    }

    if (view === 'repos') {
      if (key.upArrow) {
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setSelectedIndex((prev) => Math.min(filtered.length - 1, prev + 1));
      } else if (key.rightArrow) {
        // Enter repo file tree
        const repo = filtered[selectedIndex];
        if (repo) {
          setCurrentRepoName(repo.name);
          setCurrentRepoRoot(repo.path);
          setView('files');
          enterDir(repo.path);
        }
      } else if (key.return) {
        const repo = filtered[selectedIndex];
        if (repo) {
          selectPath(repo.path);
        }
      } else if (key.ctrl && input === 'p') {
        doGitAction('pull');
      } else if (key.ctrl && input === 's') {
        doGitAction('status');
      } else if (key.ctrl && input === 'l') {
        doGitAction('log');
      } else if (key.tab) {
        // Toggle favorite
        const repo = filtered[selectedIndex];
        if (repo) {
          toggleFavorite(repo.path);
          setFavorites(getFavorites());
        }
      } else if (key.escape) {
        exit();
      }
    } else if (view === 'files') {
      if (key.upArrow) {
        setFileIndex((prev) => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setFileIndex((prev) => Math.min(fileEntries.length - 1, prev + 1));
      } else if (key.rightArrow) {
        // Go deeper into directory
        const entry = fileEntries[fileIndex];
        if (entry?.isDirectory) {
          enterDir(entry.path);
        }
      } else if (key.leftArrow) {
        // Go back up
        if (currentDir === currentRepoRoot) {
          // Back to repo list
          setView('repos');
        } else {
          const parent = getParentDir(currentDir);
          enterDir(parent);
        }
      } else if (key.return) {
        // Select current directory (or enter if it's a dir)
        const entry = fileEntries[fileIndex];
        if (entry?.isDirectory) {
          selectPath(entry.path);
        } else {
          // Select the current directory we're in
          selectPath(currentDir);
        }
      } else if (key.escape) {
        // Back to repo list
        setView('repos');
      }
    }
  });

  if (scanning) {
    return (
      <Box flexDirection="column">
        <Logo />
        <Box paddingLeft={2}>
          <Text color="yellow">⏳ Scanning for repos...</Text>
        </Box>
      </Box>
    );
  }

  if (selected) {
    return (
      <Box flexDirection="column">
        <Logo />
        <Box flexDirection="column" paddingLeft={2} marginTop={1}>
          <Box>
            <Text color="greenBright" bold>✓ </Text>
            <Text bold color="white">{selected.split('/').pop()}</Text>
          </Box>
          <Box paddingLeft={2}>
            <Text dimColor>{selected}</Text>
          </Box>
        </Box>
      </Box>
    );
  }

  if (view === 'git-action') {
    return (
      <Box flexDirection="column">
        <Logo />
        <GitActionModal
          action={gitActionType}
          repoName={gitActionRepo}
          output={gitActionOutput}
          loading={gitActionLoading}
        />
      </Box>
    );
  }

  if (view === 'files') {
    return (
      <Box flexDirection="column">
        <Logo />

        <FileTree
          entries={fileEntries}
          selectedIndex={fileIndex}
          currentDir={currentDir}
          repoName={currentRepoName}
        />

        {/* Footer */}
        <Box marginTop={1} paddingLeft={2}>
          <Text dimColor>
            <Text color="cyan">←</Text> back  <Text color="cyan">→</Text> enter dir  <Text color="cyan">↑↓</Text> navigate  <Text color="cyan">⏎</Text> cd here  <Text color="cyan">esc</Text> repos
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Logo />

      {/* Search bar */}
      <Box paddingLeft={2} marginBottom={1}>
        <Text color="cyan" bold>❯ </Text>
        <TextInput value={query} onChange={setQuery} placeholder="Search repos..." />
        {filtered.length !== sorted.length && (
          <Text dimColor> ({filtered.length}/{sorted.length})</Text>
        )}
      </Box>

      <RepoList
        repos={filtered}
        selectedIndex={selectedIndex}
        query={query}
        favorites={favorites}
      />

      {/* Footer */}
      <Box marginTop={1} paddingLeft={2} flexDirection="column">
        <Text dimColor>
          <Text color="cyan">↑↓</Text> navigate  <Text color="cyan">→</Text> browse  <Text color="cyan">⏎</Text> select  <Text color="cyan">tab</Text> ★ favorite  <Text color="cyan">esc</Text> quit
        </Text>
        <Text dimColor>
          <Text color="cyan">^p</Text> pull  <Text color="cyan">^s</Text> status  <Text color="cyan">^l</Text> log
        </Text>
      </Box>
    </Box>
  );
}
