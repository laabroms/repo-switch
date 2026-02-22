import React, { useState, useEffect, useMemo } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import TextInput from 'ink-text-input';
import { Logo } from './components/Logo.js';
import { RepoList } from './components/RepoList.js';
import { FileTree, type FileEntry } from './components/FileTree.js';
import { FileViewer } from './components/FileViewer.js';
import { GitActionModal } from './components/GitActionModal.js';
import { BranchManager } from './components/BranchManager.js';
import { scanRepos, fuzzyMatch, listDirectory, getParentDir, runGitAction, getBranches, deleteBranch, getCurrentRepoRoot, readFullFile, type Repo, type Branch } from './scanner.js';
import { getFavorites, toggleFavorite } from './config.js';

type View = 'repos' | 'files' | 'file-viewer' | 'git-action' | 'branches';

export function App() {
  const { exit } = useApp();
  const [allRepos, setAllRepos] = useState<Repo[]>([]);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scanning, setScanning] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Auto-select current repo
  const [autoSelectPath, setAutoSelectPath] = useState<string | null>(null);

  // File tree state
  const [view, setView] = useState<View>('repos');
  const [currentDir, setCurrentDir] = useState('');
  const [currentRepoName, setCurrentRepoName] = useState('');
  const [currentRepoRoot, setCurrentRepoRoot] = useState('');
  const [fileEntries, setFileEntries] = useState<FileEntry[]>([]);
  const [fileIndex, setFileIndex] = useState(0);

  // File viewer state
  const [viewerFilePath, setViewerFilePath] = useState('');
  const [viewerLines, setViewerLines] = useState<string[]>([]);
  const [viewerScroll, setViewerScroll] = useState(0);

  // Git action state
  const [gitActionType, setGitActionType] = useState('');
  const [gitActionRepo, setGitActionRepo] = useState('');
  const [gitActionOutput, setGitActionOutput] = useState('');
  const [gitActionLoading, setGitActionLoading] = useState(false);

  // Branch manager state
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchIndex, setBranchIndex] = useState(0);
  const [branchRepoName, setBranchRepoName] = useState('');
  const [branchRepoPath, setBranchRepoPath] = useState('');
  const [markedForDeletion, setMarkedForDeletion] = useState<Set<string>>(new Set());
  const [branchConfirm, setBranchConfirm] = useState(false);
  const [branchDeleteResults, setBranchDeleteResults] = useState<{ success: string[]; failed: string[] } | null>(null);

  useEffect(() => {
    setFavorites(getFavorites());
    const repos = scanRepos();
    setAllRepos(repos);
    setScanning(false);

    // If launched inside a git repo, pre-select it in the list
    const currentRoot = getCurrentRepoRoot();
    if (currentRoot) {
      // We need to find it after sorting, so store for later
      setAutoSelectPath(currentRoot);
    }
  }, []);

  // Sort: favorites first, then alphabetical
  const sorted = useMemo(() => {
    return [...allRepos].sort((a, b) => {
      const aFav = favorites.has(a.path) ? 0 : 1;
      const bFav = favorites.has(b.path) ? 0 : 1;
      if (aFav !== bFav) return aFav - bFav;
      return a.name.localeCompare(b.name);
    });
  }, [allRepos, favorites]);

  // Auto-select current repo in sorted list
  useEffect(() => {
    if (autoSelectPath && sorted.length > 0) {
      const idx = sorted.findIndex((r) => r.path === autoSelectPath);
      if (idx >= 0) setSelectedIndex(idx);
      setAutoSelectPath(null);
    }
  }, [autoSelectPath, sorted]);

  const filtered = useMemo(() => {
    if (!query) return sorted;
    return sorted.filter(
      (r) => fuzzyMatch(query, r.name) || fuzzyMatch(query, r.path)
    );
  }, [sorted, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Navigate into a directory
  const enterDir = (dirPath: string) => {
    const entries = listDirectory(dirPath);
    setCurrentDir(dirPath);
    setFileEntries(entries.map((e) => ({
      name: e.name,
      path: e.path,
      isDirectory: e.isDirectory,
    })));
    setFileIndex(0);
  };

  // Select a path — print to stdout so the shell wrapper can cd
  const selectPath = (path: string) => {
    setSelected(path);
    process.stdout.write(path + '\n');
    setTimeout(() => exit(), 300);
  };

  // Run a git action on the selected repo
  const doGitAction = (action: 'pull' | 'status' | 'log') => {
    const repo = filtered[selectedIndex];
    if (!repo) return;
    setGitActionType(action);
    setGitActionRepo(repo.name);
    setGitActionLoading(true);
    setGitActionOutput('');
    setView('git-action');
    const output = runGitAction(repo.path, action);
    setGitActionOutput(output);
    setGitActionLoading(false);
    if (action === 'pull') {
      const repos = scanRepos();
      setAllRepos(repos);
    }
  };

  useInput((input, key) => {
    if (selected) return;

    if (view === 'git-action') {
      setView('repos');
      return;
    }

    if (view === 'file-viewer') {
      const termRows = process.stdout.rows || 24;
      const pageSize = termRows - 6;
      if (key.upArrow) {
        setViewerScroll((prev) => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setViewerScroll((prev) => Math.min(Math.max(0, viewerLines.length - pageSize), prev + 1));
      } else if (key.pageDown || (key.ctrl && input === 'd')) {
        setViewerScroll((prev) => Math.min(Math.max(0, viewerLines.length - pageSize), prev + pageSize));
      } else if (key.pageUp || (key.ctrl && input === 'u')) {
        setViewerScroll((prev) => Math.max(0, prev - pageSize));
      } else if (key.escape || key.leftArrow || input === 'q') {
        setView('files');
      }
      return;
    }

    if (view === 'repos') {
      if (key.upArrow) {
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setSelectedIndex((prev) => Math.min(filtered.length - 1, prev + 1));
      } else if (key.return || key.rightArrow) {
        // Enter or Right arrow: browse into repo
        const repo = filtered[selectedIndex];
        if (repo) {
          setCurrentRepoName(repo.name);
          setCurrentRepoRoot(repo.path);
          setView('files');
          enterDir(repo.path);
        }
      } else if (key.ctrl && input === 'p') {
        doGitAction('pull');
      } else if (key.ctrl && input === 's') {
        doGitAction('status');
      } else if (key.ctrl && input === 'l') {
        doGitAction('log');
      } else if (key.ctrl && input === 'b') {
        // Open branch manager
        const repo = filtered[selectedIndex];
        if (repo) {
          try {
            const branchData = getBranches(repo.path);
            setBranches(branchData);
            setBranchIndex(0);
            setBranchRepoName(repo.name);
            setBranchRepoPath(repo.path);
            setMarkedForDeletion(new Set());
            setBranchConfirm(false);
            setBranchDeleteResults(null);
            setView('branches');
          } catch {
            // not a git repo or error
          }
        }
      } else if (key.tab) {
        // Toggle favorite
        const repo = filtered[selectedIndex];
        if (repo) {
          toggleFavorite(repo.path);
          setFavorites(getFavorites());
        }
      } else if (key.escape) {
        exit();
      }
    } else if (view === 'files') {
      if (key.upArrow) {
        setFileIndex((prev) => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setFileIndex((prev) => Math.min(fileEntries.length - 1, prev + 1));
      } else if (key.rightArrow) {
        const entry = fileEntries[fileIndex];
        if (entry?.isDirectory) {
          enterDir(entry.path);
        } else if (entry) {
          // Open full file viewer
          const lines = readFullFile(entry.path);
          setViewerFilePath(entry.path);
          setViewerLines(lines);
          setViewerScroll(0);
          setView('file-viewer');
        }
      } else if (key.leftArrow) {
        // Go back up
        if (currentDir === currentRepoRoot) {
          // Back to repo list
          setView('repos');
        } else {
          const parent = getParentDir(currentDir);
          enterDir(parent);
        }
      } else if (key.return) {
        const entry = fileEntries[fileIndex];
        if (entry?.isDirectory) {
          enterDir(entry.path);
        } else if (entry) {
          // Open full file viewer
          const lines = readFullFile(entry.path);
          setViewerFilePath(entry.path);
          setViewerLines(lines);
          setViewerScroll(0);
          setView('file-viewer');
        }
      } else if (key.ctrl && input === 'o') {
        // cd to current directory
        selectPath(currentDir);
      } else if (key.escape) {
        // Back to repo list
        setView('repos');
      }
    } else if (view === 'branches') {
      if (branchDeleteResults) {
        setBranchDeleteResults(null);
        setView('repos');
        const repos = scanRepos();
        setAllRepos(repos);
        return;
      }

      if (branchConfirm) {
        if (input === 'y' || input === 'Y') {
          const success: string[] = [];
          const failed: string[] = [];
          for (const name of markedForDeletion) {
            const branch = branches.find((b) => b.name === name);
            if (branch) {
              const force = !branch.merged;
              if (deleteBranch(branchRepoPath, name, force)) {
                success.push(name);
              } else {
                failed.push(name);
              }
            }
          }
          setBranchDeleteResults({ success, failed });
          setBranchConfirm(false);
        } else if (input === 'n' || input === 'N' || key.escape) {
          setBranchConfirm(false);
        }
        return;
      }

      if (key.upArrow) {
        setBranchIndex((prev) => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setBranchIndex((prev) => Math.min(branches.length - 1, prev + 1));
      } else if (input === ' ') {
        const branch = branches[branchIndex];
        if (branch && !branch.protected) {
          setMarkedForDeletion((prev) => {
            const next = new Set(prev);
            if (next.has(branch.name)) {
              next.delete(branch.name);
            } else {
              next.add(branch.name);
            }
            return next;
          });
        }
      } else if (input === 'd' || key.delete) {
        if (markedForDeletion.size > 0) {
          setBranchConfirm(true);
        }
      } else if (input === 'm') {
        const merged = branches.filter((b) => b.merged && !b.protected);
        setMarkedForDeletion(new Set(merged.map((b) => b.name)));
      } else if (input === 's') {
        const stale = branches.filter((b) => b.daysStale > 90 && !b.protected);
        setMarkedForDeletion(new Set(stale.map((b) => b.name)));
      } else if (input === 'c') {
        setMarkedForDeletion(new Set());
      } else if (key.escape) {
        setView('repos');
      }
    }
  });

  if (scanning) {
    return (
      <Box flexDirection="column">
        <Logo />
        <Box paddingLeft={2}>
          <Text color="yellow">⏳ Scanning for repos...</Text>
        </Box>
      </Box>
    );
  }

  if (selected) {
    return (
      <Box flexDirection="column">
        <Logo />
        <Box flexDirection="column" paddingLeft={2} marginTop={1}>
          <Box>
            <Text color="greenBright" bold>✓ </Text>
            <Text bold color="white">{selected.split('/').pop()}</Text>
          </Box>
          <Box paddingLeft={2}>
            <Text dimColor>{selected}</Text>
          </Box>
        </Box>
      </Box>
    );
  }

  if (view === 'git-action') {
    return (
      <Box flexDirection="column">
        <Logo />
        <GitActionModal
          action={gitActionType}
          repoName={gitActionRepo}
          output={gitActionOutput}
          loading={gitActionLoading}
        />
      </Box>
    );
  }

  if (view === 'branches') {
    return (
      <Box flexDirection="column">
        <Logo />
        <BranchManager
          branches={branches}
          selectedIndex={branchIndex}
          markedForDeletion={markedForDeletion}
          repoName={branchRepoName}
          confirmMode={branchConfirm}
          deleteResults={branchDeleteResults}
        />
        {!branchConfirm && !branchDeleteResults && (
          <Box marginTop={1} paddingLeft={2} flexDirection="column">
            <Text dimColor>
              <Text color="cyan">↑↓</Text> navigate  <Text color="cyan">space</Text> mark  <Text color="cyan">d</Text> delete marked  <Text color="cyan">esc</Text> back
            </Text>
            <Text dimColor>
              <Text color="cyan">m</Text> mark merged  <Text color="cyan">s</Text> mark stale  <Text color="cyan">c</Text> clear
            </Text>
          </Box>
        )}
      </Box>
    );
  }

  if (view === 'file-viewer') {
    return (
      <Box flexDirection="column">
        <Logo />
        <FileViewer
          filePath={viewerFilePath}
          lines={viewerLines}
          scrollOffset={viewerScroll}
        />
        <Box marginTop={1} paddingLeft={2}>
          <Text dimColor>
            <Text color="cyan">↑↓</Text> scroll  <Text color="cyan">^d/^u</Text> page  <Text color="cyan">←</Text> back  <Text color="cyan">q</Text> close
          </Text>
        </Box>
      </Box>
    );
  }

  if (view === 'files') {
    return (
      <Box flexDirection="column">
        <Logo />

        <FileTree
          entries={fileEntries}
          selectedIndex={fileIndex}
          currentDir={currentDir}
          repoName={currentRepoName}
        />

        {/* Footer */}
        <Box marginTop={1} paddingLeft={2}>
          <Text dimColor>
            <Text color="cyan">←</Text> back  <Text color="cyan">→/⏎</Text> open  <Text color="cyan">↑↓</Text> navigate  <Text color="cyan">^o</Text> cd here  <Text color="cyan">esc</Text> repos
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Logo />

      {/* Search bar */}
      <Box paddingLeft={2} marginBottom={1}>
        <Text color="cyan" bold>❯ </Text>
        <TextInput value={query} onChange={setQuery} placeholder="Search repos..." />
        {filtered.length !== sorted.length && (
          <Text dimColor> ({filtered.length}/{sorted.length})</Text>
        )}
      </Box>

      <RepoList
        repos={filtered}
        selectedIndex={selectedIndex}
        query={query}
        favorites={favorites}
      />

      {/* Footer */}
      <Box marginTop={1} paddingLeft={2} flexDirection="column">
        <Text dimColor>
          <Text color="cyan">↑↓</Text> navigate  <Text color="cyan">⏎</Text> open  <Text color="cyan">tab</Text> ★ favorite  <Text color="cyan">esc</Text> quit
        </Text>
        <Text dimColor>
          <Text color="cyan">^p</Text> pull  <Text color="cyan">^s</Text> status  <Text color="cyan">^l</Text> log  <Text color="cyan">^b</Text> branches
        </Text>
      </Box>
    </Box>
  );
}
