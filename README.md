# 📂 repo-switch

Fuzzy-find and jump to any local Git repo from your terminal.

## Features

- **Auto-scan** — Finds all Git repos under your home directory (up to 4 levels deep)
- **Fuzzy search** — Type to filter by repo name or path
- **Repo info** — See current branch, dirty status, and last commit time
- **Clipboard jump** — Copies `cd <path>` to clipboard on select, just paste to jump
- **Scrollable** — Handles hundreds of repos with a windowed view

## Installation

```bash
npm install -g @laabroms/repo-switch
```

Or run directly:

```bash
npx @laabroms/repo-switch
```

## Usage

```bash
repo-switch
```

### Controls

- **Type** — Filter repos by name or path (fuzzy match)
- **↑/↓** — Navigate the list
- **Enter** — Select repo (copies `cd <path>` to clipboard)
- **Esc** — Quit

### What you see

Each repo shows:
- **Name** — Repository folder name
- **⎇ branch** — Current Git branch
- **●** — Yellow dot if there are uncommitted changes
- **Last commit** — Relative time since last commit (e.g., "2 hours ago")

## How it works

1. Scans your home directory for `.git` folders (skips node_modules, .cache, etc.)
2. Shows all repos in a fuzzy-searchable list
3. On select, copies `cd /path/to/repo` to your clipboard
4. Paste in your terminal to jump there

## License

MIT © Lucas Abroms
