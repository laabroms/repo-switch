import React from 'react';
import { Box, Text } from 'ink';

interface Props {
  action: string;
  repoName: string;
  output: string;
  loading: boolean;
}

export function GitActionModal({ action, repoName, output, loading }: Props) {
  const title = action === 'pull' ? 'Git Pull' : action === 'status' ? 'Git Status' : 'Git Log';
  const icon = action === 'pull' ? '⬇️' : action === 'status' ? '📋' : '📜';

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="cyan"
      padding={1}
      width={70}
    >
      <Text bold color="cyan">
        {icon} {title} — {repoName}
      </Text>

      <Box marginTop={1} flexDirection="column">
        {loading ? (
          <Text color="yellow">Running...</Text>
        ) : (
          output.split('\n').map((line, i) => (
            <Text key={i} color="gray">{line}</Text>
          ))
        )}
      </Box>

      <Box marginTop={1}>
        <Text dimColor>Press any key to close</Text>
      </Box>
    </Box>
  );
}
