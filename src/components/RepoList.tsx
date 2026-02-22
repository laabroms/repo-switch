import React from 'react';
import { Box, Text } from 'ink';
import type { Repo } from '../scanner.js';

interface Props {
  repos: Repo[];
  selectedIndex: number;
  query: string;
  favorites: Set<string>;
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

function shortenPath(path: string): string {
  const home = process.env.HOME || '';
  return path.startsWith(home) ? '~' + path.slice(home.length) : path;
}

function shortenUrl(url: string): string {
  return url
    .replace('https://github.com/', '')
    .replace('https://gitlab.com/', 'gl:');
}

export function RepoList({ repos, selectedIndex, query, favorites }: Props) {
  if (repos.length === 0 && query) {
    return (
      <Box marginTop={1} paddingLeft={2}>
        <Text color="gray">No repos matching </Text>
        <Text color="yellow">"{query}"</Text>
      </Box>
    );
  }

  if (repos.length === 0) {
    return (
      <Box marginTop={1} paddingLeft={2}>
        <Text color="gray">No repos found.</Text>
      </Box>
    );
  }

  // Windowed view
  const windowSize = 12;
  const half = Math.floor(windowSize / 2);
  let start = Math.max(0, selectedIndex - half);
  const end = Math.min(repos.length, start + windowSize);
  if (end - start < windowSize) {
    start = Math.max(0, end - windowSize);
  }
  const visible = repos.slice(start, end);

  return (
    <Box flexDirection="column">
      {/* Column headers */}
      <Box paddingLeft={4} marginBottom={0}>
        <Box width={24}>
          <Text dimColor bold>REPO</Text>
        </Box>
        <Box width={18}>
          <Text dimColor bold>BRANCH</Text>
        </Box>
        <Box width={12}>
          <Text dimColor bold>STATUS</Text>
        </Box>
        <Text dimColor bold>SYNC</Text>
      </Box>

      <Box paddingLeft={4} marginBottom={0}>
        <Text dimColor>{'─'.repeat(65)}</Text>
      </Box>

      {start > 0 && (
        <Box paddingLeft={2}>
          <Text dimColor>  ↑ {start} more</Text>
        </Box>
      )}

      {visible.map((repo, i) => {
        const actualIndex = start + i;
        const isSelected = actualIndex === selectedIndex;
        const isFav = favorites.has(repo.path);

        // Sync status
        let syncText = '';
        if (repo.ahead > 0 && repo.behind > 0) {
          syncText = `↑${repo.ahead} ↓${repo.behind}`;
        } else if (repo.ahead > 0) {
          syncText = `↑${repo.ahead}`;
        } else if (repo.behind > 0) {
          syncText = `↓${repo.behind}`;
        } else {
          syncText = '✓';
        }

        return (
          <Box key={repo.path} flexDirection="column">
            <Box>
              <Text color={isSelected ? 'cyanBright' : 'gray'}>
                {isSelected ? ' ▸ ' : '   '}
              </Text>
              <Box width={24}>
                <Text bold={isSelected} color={isSelected ? 'white' : 'gray'}>
                  {isFav ? '★ ' : '  '}{truncate(repo.name, isFav ? 18 : 20)}
                </Text>
              </Box>
              <Box width={18}>
                <Text color={isSelected ? 'greenBright' : 'green'}>
                  {truncate(repo.branch, 16)}
                </Text>
              </Box>
              <Box width={12}>
                {repo.dirty ? (
                  <Text color="yellow">● modified</Text>
                ) : (
                  <Text color={isSelected ? 'greenBright' : 'green'}>✓ clean</Text>
                )}
              </Box>
              <Text color={repo.behind > 0 ? 'red' : repo.ahead > 0 ? 'yellow' : 'green'} dimColor={!isSelected}>
                {syncText}
              </Text>
            </Box>
            {isSelected && (
              <Box paddingLeft={3} flexDirection="column">
                <Text dimColor>{shortenPath(repo.path)}</Text>
                {repo.remoteUrl && (
                  <Text color="blue" dimColor>{shortenUrl(repo.remoteUrl)}</Text>
                )}
              </Box>
            )}
          </Box>
        );
      })}

      {end < repos.length && (
        <Box paddingLeft={2}>
          <Text dimColor>  ↓ {repos.length - end} more</Text>
        </Box>
      )}
    </Box>
  );
}
