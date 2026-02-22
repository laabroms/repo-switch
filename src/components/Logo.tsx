import React from 'react';
import { Box, Text } from 'ink';

export function Logo() {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color="cyan">
        {'  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓'}
      </Text>
      <Text color="cyan">
        {'  ┃'}
        <Text color="white" bold>  📂  r e p o </Text>
        <Text color="yellowBright" bold>- s w i t c h  </Text>
        <Text color="cyan">    ┃</Text>
      </Text>
      <Text color="cyan">
        {'  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛'}
      </Text>
    </Box>
  );
}
