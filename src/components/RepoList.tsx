import React from 'react';
import { Box, Text } from 'ink';
import type { Repo } from '../scanner.js';

interface Props {
  repos: Repo[];
  selectedIndex: number;
  query: string;
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

function shortenPath(path: string): string {
  const home = process.env.HOME || '';
  return path.startsWith(home) ? '~' + path.slice(home.length) : path;
}

export function RepoList({ repos, selectedIndex, query }: Props) {
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
        <Box width={22}>
          <Text dimColor bold>REPO</Text>
        </Box>
        <Box width={18}>
          <Text dimColor bold>BRANCH</Text>
        </Box>
        <Box width={10}>
          <Text dimColor bold>STATUS</Text>
        </Box>
        <Text dimColor bold>LAST COMMIT</Text>
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

        return (
          <Box key={repo.path} flexDirection="column">
            <Box>
              <Text color={isSelected ? 'cyanBright' : 'gray'}>
                {isSelected ? ' ▸ ' : '   '}
              </Text>
              <Box width={22}>
                <Text bold={isSelected} color={isSelected ? 'white' : 'gray'}>
                  {truncate(repo.name, 20)}
                </Text>
              </Box>
              <Box width={18}>
                <Text color={isSelected ? 'greenBright' : 'green'}>
                  {truncate(repo.branch, 16)}
                </Text>
              </Box>
              <Box width={10}>
                {repo.dirty ? (
                  <Text color="yellow">● modified</Text>
                ) : (
                  <Text color={isSelected ? 'greenBright' : 'green'}>✓ clean</Text>
                )}
              </Box>
              <Text dimColor>{repo.lastCommit}</Text>
            </Box>
            {isSelected && (
              <Box paddingLeft={3}>
                <Text dimColor>{shortenPath(repo.path)}</Text>
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
