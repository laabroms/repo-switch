import React, { useState, useEffect, useMemo } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import TextInput from 'ink-text-input';
import { Logo } from './components/Logo.js';
import { RepoList } from './components/RepoList.js';
import { FileTree, type FileEntry } from './components/FileTree.js';
import { scanRepos, fuzzyMatch, listDirectory, getParentDir, type Repo } from './scanner.js';
import clipboardy from 'clipboardy';

type View = 'repos' | 'files';

export function App() {
  const { exit } = useApp();
  const [allRepos, setAllRepos] = useState<Repo[]>([]);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scanning, setScanning] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  // File tree state
  const [view, setView] = useState<View>('repos');
  const [currentDir, setCurrentDir] = useState('');
  const [currentRepoName, setCurrentRepoName] = useState('');
  const [currentRepoRoot, setCurrentRepoRoot] = useState('');
  const [fileEntries, setFileEntries] = useState<FileEntry[]>([]);
  const [fileIndex, setFileIndex] = useState(0);

  useEffect(() => {
    const repos = scanRepos();
    setAllRepos(repos);
    setScanning(false);
  }, []);

  const filtered = useMemo(() => {
    if (!query) return allRepos;
    return allRepos.filter(
      (r) => fuzzyMatch(query, r.name) || fuzzyMatch(query, r.path)
    );
  }, [allRepos, query]);

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

  // Select a path (copy cd command)
  const selectPath = (path: string) => {
    setSelected(path);
    clipboardy.writeSync(`cd ${path}`);
    setTimeout(() => exit(), 500);
  };

  useInput((input, key) => {
    if (selected) return;

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
          <Box marginTop={1}>
            <Text color="cyan">📋 Copied: </Text>
            <Text color="white" bold>cd {selected}</Text>
          </Box>
          <Box>
            <Text dimColor italic>Paste in terminal to jump there</Text>
          </Box>
        </Box>
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
        {filtered.length !== allRepos.length && (
          <Text dimColor> ({filtered.length}/{allRepos.length})</Text>
        )}
      </Box>

      <RepoList
        repos={filtered}
        selectedIndex={selectedIndex}
        query={query}
      />

      {/* Footer */}
      <Box marginTop={1} paddingLeft={2}>
        <Text dimColor>
          <Text color="cyan">↑↓</Text> navigate  <Text color="cyan">→</Text> browse files  <Text color="cyan">⏎</Text> select  <Text color="cyan">esc</Text> quit
        </Text>
      </Box>
    </Box>
  );
}
