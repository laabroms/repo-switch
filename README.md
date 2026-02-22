# 📂 repo-switch

Fuzzy-find and jump to any local Git repo from your terminal.

## Features

- **Auto-scan** — Finds all Git repos under common code directories
- **Fuzzy search** — Type to filter by repo name or path
- **File tree browser** — Arrow keys to navigate into repo directories
- **Repo info** — Current branch, dirty status, last commit time
- **Instant cd** — Select a repo or directory and jump there immediately

## Installation

```bash
npm install -g @laabroms/repo-switch
```

Then add the shell function to your `~/.zshrc` (or `~/.bashrc`):

```bash
rs() { local dir=$(repo-switch 2>/dev/null); [ -n "$dir" ] && cd "$dir"; }
```

Reload your shell:

```bash
source ~/.zshrc
```

## Usage

```bash
rs
```

That's it. Search, browse, select — you're there.

### Controls

**Repo list:**
- **Type** — Fuzzy filter repos
- **↑/↓** — Navigate
- **→** — Browse repo file tree
- **Enter** — Jump to repo
- **Esc** — Quit

**File tree:**
- **↑/↓** — Navigate
- **→** — Enter directory
- **←** — Go back (repo root → back to list)
- **Enter** — Jump to current directory
- **Esc** — Back to repo list

### What you see

Each repo shows:
- **Name** — Repository folder name
- **⎇ branch** — Current Git branch
- **●** — Yellow dot if uncommitted changes
- **Last commit** — Relative time

## How it works

1. Scans common code directories (`~/Desktop`, `~/Projects`, `~/Code`, `~/.openclaw/workspace`, etc.)
2. Shows repos in a fuzzy-searchable list with git status
3. Browse into any repo's file tree with arrow keys
4. On select, instantly `cd` to that directory

## License

MIT © Lucas Abroms
