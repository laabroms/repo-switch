import React from 'react';
import { Box, Text } from 'ink';
import type { Repo } from '../scanner.js';

interface Props {
  repos: Repo[];
  selectedIndex: number;
  query: string;
}

export function RepoList({ repos, selectedIndex, query }: Props) {
  if (repos.length === 0 && query) {
    return (
      <Box marginTop={1}>
        <Text color="yellow">No repos matching "{query}"</Text>
      </Box>
    );
  }

  if (repos.length === 0) {
    return (
      <Box marginTop={1}>
        <Text color="yellow">No repos found. Try running from a directory with Git repos.</Text>
      </Box>
    );
  }

  // Show a window of repos around the selected index
  const windowSize = 15;
  const half = Math.floor(windowSize / 2);
  let start = Math.max(0, selectedIndex - half);
  const end = Math.min(repos.length, start + windowSize);
  if (end - start < windowSize) {
    start = Math.max(0, end - windowSize);
  }
  const visible = repos.slice(start, end);

  return (
    <Box flexDirection="column" marginTop={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          {repos.length} repo{repos.length !== 1 ? 's' : ''}
        </Text>
        {query && <Text color="gray"> matching "{query}"</Text>}
      </Box>

      {start > 0 && (
        <Text color="gray">  ↑ {start} more above</Text>
      )}

      {visible.map((repo, i) => {
        const actualIndex = start + i;
        const isSelected = actualIndex === selectedIndex;

        return (
          <Box key={repo.path}>
            <Text color={isSelected ? 'cyan' : 'white'}>
              {isSelected ? '▶ ' : '  '}
            </Text>
            <Box width={24}>
              <Text bold={isSelected} color={isSelected ? 'white' : 'gray'}>
                {repo.name}
              </Text>
            </Box>
            <Box width={16}>
              <Text color="green">⎇ {repo.branch}</Text>
            </Box>
            {repo.dirty && (
              <Text color="yellow">● </Text>
            )}
            <Text color="gray">{repo.lastCommit}</Text>
          </Box>
        );
      })}

      {end < repos.length && (
        <Text color="gray">  ↓ {repos.length - end} more below</Text>
      )}
    </Box>
  );
}
