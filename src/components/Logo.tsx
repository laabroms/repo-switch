import React from 'react';
import { Box, Text } from 'ink';

export function Logo() {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text bold color="cyan">
        ╔════════════════════════════════╗
      </Text>
      <Text bold color="cyan">
        ║   </Text><Text bold color="white">📂 REPO-SWITCH</Text><Text bold color="cyan">            ║
      </Text>
      <Text bold color="cyan">
        ║  </Text><Text color="gray">Jump to any local repo</Text><Text bold color="cyan">     ║
      </Text>
      <Text bold color="cyan">
        ╚════════════════════════════════╝
      </Text>
    </Box>
  );
}
