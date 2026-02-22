import React from 'react';
import { Box, Text } from 'ink';
import type { Branch } from '../scanner.js';

interface Props {
  branches: Branch[];
  selectedIndex: number;
  markedForDeletion: Set<string>;
  repoName: string;
  confirmMode: boolean;
  deleteResults: { success: string[]; failed: string[] } | null;
}

export function BranchManager({
  branches,
  selectedIndex,
  markedForDeletion,
  repoName,
  confirmMode,
  deleteResults,
}: Props) {
  // Show delete results
  if (deleteResults) {
    return (
      <Box flexDirection="column" paddingLeft={2}>
        <Text bold color="green">✓ Deletion Complete — {repoName}</Text>

        {deleteResults.success.length > 0 && (
          <Box flexDirection="column" marginTop={1}>
            <Text color="green">Deleted ({deleteResults.success.length}):</Text>
            {deleteResults.success.map((b) => (
              <Text key={b} color="green">  • {b}</Text>
            ))}
          </Box>
        )}

        {deleteResults.failed.length > 0 && (
          <Box flexDirection="column" marginTop={1}>
            <Text color="red">Failed ({deleteResults.failed.length}):</Text>
            {deleteResults.failed.map((b) => (
              <Text key={b} color="red">  • {b}</Text>
            ))}
          </Box>
        )}

        <Box marginTop={1}>
          <Text dimColor>Press any key to go back</Text>
        </Box>
      </Box>
    );
  }

  // Show confirmation dialog
  if (confirmMode) {
    const marked = Array.from(markedForDeletion);
    return (
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="red"
        padding={1}
        width={60}
      >
        <Text bold color="red">⚠️  Delete {marked.length} branch(es)?</Text>

        <Box marginTop={1} flexDirection="column">
          {marked.map((b) => (
            <Text key={b} color="red">  • {b}</Text>
          ))}
        </Box>

        <Box marginTop={1}>
          <Text bold color="green">[Y]</Text>
          <Text> Confirm  </Text>
          <Text bold color="gray">[N]</Text>
          <Text> Cancel</Text>
        </Box>
      </Box>
    );
  }

  // Windowed branch list
  const windowSize = 14;
  const half = Math.floor(windowSize / 2);
  let start = Math.max(0, selectedIndex - half);
  const end = Math.min(branches.length, start + windowSize);
  if (end - start < windowSize) {
    start = Math.max(0, end - windowSize);
  }
  const visible = branches.slice(start, end);

  return (
    <Box flexDirection="column">
      <Box paddingLeft={2} marginBottom={1}>
        <Text color="cyan" bold>🔀 Branches — {repoName}</Text>
        <Text dimColor>  ({branches.length} total)</Text>
      </Box>

      {/* Column headers */}
      <Box paddingLeft={4}>
        <Box width={32}>
          <Text dimColor bold>BRANCH</Text>
        </Box>
        <Text dimColor bold>STATUS</Text>
      </Box>
      <Box paddingLeft={4} marginBottom={0}>
        <Text dimColor>{'─'.repeat(55)}</Text>
      </Box>

      {start > 0 && (
        <Box paddingLeft={2}>
          <Text dimColor>  ↑ {start} more</Text>
        </Box>
      )}

      {visible.map((branch, i) => {
        const actualIndex = start + i;
        const isSelected = actualIndex === selectedIndex;
        const isMarked = markedForDeletion.has(branch.name);

        let statusColor = 'gray';
        let statusText = '';

        if (branch.current && branch.protected) {
          statusColor = 'green';
          statusText = '● CURRENT 🔒';
        } else if (branch.current) {
          statusColor = 'green';
          statusText = '● CURRENT';
        } else if (branch.protected) {
          statusColor = 'yellow';
          statusText = '🔒 PROTECTED';
        } else if (branch.merged) {
          statusColor = 'blue';
          statusText = '✓ MERGED';
        } else if (branch.daysStale > 90) {
          statusColor = 'red';
          statusText = `⚠ ${branch.daysStale}d stale`;
        } else if (branch.daysStale > 30) {
          statusColor = 'yellow';
          statusText = `${branch.daysStale}d stale`;
        } else {
          statusText = `${branch.daysStale}d ago`;
        }

        return (
          <Box key={branch.name}>
            <Text color={isSelected ? 'cyanBright' : 'gray'}>
              {isSelected ? ' ▸ ' : '   '}
            </Text>
            {branch.protected ? (
              <Text>  </Text>
            ) : (
              <Text color={isMarked ? 'red' : 'white'}>
                {isMarked ? '☑ ' : '☐ '}
              </Text>
            )}
            <Box width={28}>
              <Text bold={isSelected} color={isMarked ? 'red' : isSelected ? 'white' : 'gray'}>
                {branch.name.length > 26 ? branch.name.slice(0, 25) + '…' : branch.name}
              </Text>
            </Box>
            <Text color={statusColor}>{statusText}</Text>
          </Box>
        );
      })}

      {end < branches.length && (
        <Box paddingLeft={2}>
          <Text dimColor>  ↓ {branches.length - end} more</Text>
        </Box>
      )}

      <Box marginTop={1} paddingLeft={2}>
        <Text dimColor>
          {markedForDeletion.size > 0
            ? `${markedForDeletion.size} marked for deletion`
            : 'No branches marked'}
        </Text>
      </Box>
    </Box>
  );
}
