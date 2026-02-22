import React from 'react';
import { Box, Text } from 'ink';
import { basename } from 'path';

interface Props {
  filePath: string;
  lines: string[];
  scrollOffset: number;
}

export function FileViewer({ filePath, lines, scrollOffset }: Props) {
  const termRows = process.stdout.rows || 24;
  const viewHeight = termRows - 6; // room for header + footer

  const visible = lines.slice(scrollOffset, scrollOffset + viewHeight);
  const totalLines = lines.length;
  const fileName = basename(filePath);

  return (
    <Box flexDirection="column" paddingLeft={2}>
      <Box marginBottom={1}>
        <Text color="cyan" bold>📄 {fileName}</Text>
        <Text dimColor>  {filePath}</Text>
      </Box>
      <Box marginBottom={0}>
        <Text dimColor>
          Lines {scrollOffset + 1}–{Math.min(scrollOffset + viewHeight, totalLines)} of {totalLines}
        </Text>
      </Box>
      <Box flexDirection="column">
        {visible.map((line, i) => {
          const lineNum = scrollOffset + i + 1;
          const numWidth = String(totalLines).length;
          return (
            <Text key={i} wrap="truncate">
              <Text color="gray" dimColor>{String(lineNum).padStart(numWidth, ' ')} │ </Text>
              <Text>{line}</Text>
            </Text>
          );
        })}
      </Box>
    </Box>
  );
}
