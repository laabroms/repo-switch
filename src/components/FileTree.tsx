import React from 'react';
import { Box, Text } from 'ink';

export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
}

interface Props {
  entries: FileEntry[];
  selectedIndex: number;
  currentDir: string;
  repoName: string;
}

function shortenPath(path: string): string {
  const home = process.env.HOME || '';
  return path.startsWith(home) ? '~' + path.slice(home.length) : path;
}

export function FileTree({ entries, selectedIndex, currentDir, repoName }: Props) {
  // Windowed view
  const windowSize = 14;
  const half = Math.floor(windowSize / 2);
  let start = Math.max(0, selectedIndex - half);
  const end = Math.min(entries.length, start + windowSize);
  if (end - start < windowSize) {
    start = Math.max(0, end - windowSize);
  }
  const visible = entries.slice(start, end);

  return (
    <Box flexDirection="column">
      {/* Breadcrumb */}
      <Box paddingLeft={2} marginBottom={1}>
        <Text color="cyan" bold>{repoName}</Text>
        <Text dimColor> → </Text>
        <Text color="white">{shortenPath(currentDir)}</Text>
      </Box>

      {/* Column header */}
      <Box paddingLeft={4}>
        <Text dimColor bold>{'NAME'}</Text>
      </Box>
      <Box paddingLeft={4} marginBottom={0}>
        <Text dimColor>{'─'.repeat(50)}</Text>
      </Box>

      {start > 0 && (
        <Box paddingLeft={2}>
          <Text dimColor>  ↑ {start} more</Text>
        </Box>
      )}

      {visible.map((entry, i) => {
        const actualIndex = start + i;
        const isSelected = actualIndex === selectedIndex;

        return (
          <Box key={entry.path}>
            <Text color={isSelected ? 'cyanBright' : 'gray'}>
              {isSelected ? ' ▸ ' : '   '}
            </Text>
            {entry.isDirectory ? (
              <Text color={isSelected ? 'cyanBright' : 'blue'} bold={isSelected}>
                📁 {entry.name}/
              </Text>
            ) : (
              <Text color={isSelected ? 'white' : 'gray'} bold={isSelected}>
                {'   '}{entry.name}
              </Text>
            )}
          </Box>
        );
      })}

      {end < entries.length && (
        <Box paddingLeft={2}>
          <Text dimColor>  ↓ {entries.length - end} more</Text>
        </Box>
      )}
    </Box>
  );
}
