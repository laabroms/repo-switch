import React, { useState, useEffect, useMemo } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import TextInput from 'ink-text-input';
import { Logo } from './components/Logo.js';
import { RepoList } from './components/RepoList.js';
import { scanRepos, fuzzyMatch, type Repo } from './scanner.js';
import clipboardy from 'clipboardy';

export function App() {
  const { exit } = useApp();
  const [allRepos, setAllRepos] = useState<Repo[]>([]);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scanning, setScanning] = useState(true);
  const [selected, setSelected] = useState<Repo | null>(null);

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

  useInput((input, key) => {
    if (selected) return;

    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(filtered.length - 1, prev + 1));
    } else if (key.return) {
      const repo = filtered[selectedIndex];
      if (repo) {
        setSelected(repo);
        const cmd = `cd ${repo.path}`;
        clipboardy.writeSync(cmd);
        setTimeout(() => exit(), 500);
      }
    } else if (key.escape) {
      exit();
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
            <Text bold color="white">{selected.name}</Text>
          </Box>
          <Box paddingLeft={2} marginTop={0}>
            <Text dimColor>{selected.path}</Text>
          </Box>
          <Box marginTop={1}>
            <Text color="cyan">📋 Copied: </Text>
            <Text color="white" bold>cd {selected.path}</Text>
          </Box>
          <Box marginTop={0}>
            <Text dimColor italic>Paste in terminal to jump there</Text>
          </Box>
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
          <Text color="cyan">↑↓</Text> navigate  <Text color="cyan">⏎</Text> select  <Text color="cyan">esc</Text> quit
        </Text>
      </Box>
    </Box>
  );
}
