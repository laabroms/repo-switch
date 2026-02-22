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

  // Reset selection when filter changes
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
        <Text color="yellow">🔍 Scanning for Git repos...</Text>
      </Box>
    );
  }

  if (selected) {
    return (
      <Box flexDirection="column">
        <Logo />
        <Box flexDirection="column" marginTop={1}>
          <Text bold color="green">
            ✓ Selected: {selected.name}
          </Text>
          <Text color="gray">{selected.path}</Text>
          <Box marginTop={1}>
            <Text color="cyan">📋 Copied to clipboard: </Text>
            <Text bold>cd {selected.path}</Text>
          </Box>
          <Text color="gray" dimColor>Paste in your terminal to jump there</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Logo />

      <Box>
        <Text bold color="cyan">🔍 Search: </Text>
        <TextInput value={query} onChange={setQuery} placeholder="Type to filter repos..." />
      </Box>

      <RepoList
        repos={filtered}
        selectedIndex={selectedIndex}
        query={query}
      />

      <Box marginTop={1}>
        <Text color="gray">
          [↑/↓] Navigate  [Enter] Select  [Esc] Quit
        </Text>
      </Box>
    </Box>
  );
}
