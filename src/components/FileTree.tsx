import React from 'react';
import { Box, Text } from 'ink';
import { readFilePreview } from '../scanner.js';

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
  const selected = entries[selectedIndex];

  // Get preview for selected file
  let preview: string[] = [];
  if (selected && !selected.isDirectory) {
    preview = readFilePreview(selected.path, 12);
  }

  // Windowed view
  const windowSize = 14;
  const half = Math.floor(windowSize / 2);
  let start = Math.max(0, selectedIndex - half);
  const end = Math.min(entries.length, start + windowSize);
  if (end - start < windowSize) {
    start = Math.max(0, end - windowSize);
  }
  const visible = entries.slice(start, end);

  const fileList = (
    <Box flexDirection="column" width={preview.length > 0 ? 36 : undefined}>
      {/* Breadcrumb */}
      <Box marginBottom={1}>
        <Text color="cyan" bold>{repoName}</Text>
        <Text dimColor> → </Text>
        <Text color="white">{shortenPath(currentDir)}</Text>
      </Box>

      {start > 0 && (
        <Text dimColor>  ↑ {start} more</Text>
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
        <Text dimColor>  ↓ {entries.length - end} more</Text>
      )}
    </Box>
  );

  if (preview.length > 0 && selected) {
    return (
      <Box paddingLeft={2}>
        {fileList}
        <Box flexDirection="column" marginLeft={2} borderStyle="single" borderColor="gray" paddingX={1} width={46}>
          <Text color="cyan" dimColor bold> 📄 {selected.name}</Text>
          <Text dimColor>{'─'.repeat(42)}</Text>
          {preview.map((line, i) => (
            <Text key={i} color="gray" dimColor wrap="truncate">
              {line || ' '}
            </Text>
          ))}
        </Box>
      </Box>
    );
  }

  return <Box paddingLeft={2}>{fileList}</Box>;
}
