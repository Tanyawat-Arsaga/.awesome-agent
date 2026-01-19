# Specification - Migrate Existing Configurations

## Goal
Migrate existing configuration files from `~/.gemini/` and `~/.claude/` into the centralized `conductor` repository structure, preserving functionality while enabling version control and sharing.

## Source Analysis
- **~/.gemini/**
    - `GEMINI.md`: Primary system prompt/config -> `agents/gemini/GEMINI.md`
    - `skills/`: Directory of skills -> `shared/skills/` (Review for generic vs specific)
    - `extensions/`: Gemini CLI extensions -> `agents/gemini/extensions/`
    - `prompt.md`: Likely a system prompt -> `agents/gemini/prompt.md` (or shared if generic)
- **~/.claude/**
    - `CLAUDE.md`: Primary system prompt/config -> `agents/claude/CLAUDE.md`
    - `commands`: Custom commands -> `agents/claude/commands/`
    - `plugins/`: Plugins -> `agents/claude/plugins/`

## Migration Strategy
1.  **Backup:** The `sync.sh` script already has backup logic, but we should do a manual archive of the current state just in case.
2.  **Import:** Copy files from Home to Repo.
    -   **Consolidate Skills:** Import `~/.gemini/skills/*.md` to `shared/skills/`.
    -   **Agent Configs:** Import `GEMINI.md` and `CLAUDE.md`.
    -   **Extensions/Plugins:** Import extensions/plugins.
3.  **Validate:** Ensure the file structures match what the sync script expects.
4.  **Execute Sync:** Run `meta/sync.sh` to replace the original files with symlinks.

## Success Criteria
- `~/.gemini/GEMINI.md` is a symlink to `repo/agents/gemini/GEMINI.md`.
- `~/.claude/CLAUDE.md` is a symlink to `repo/agents/claude/CLAUDE.md`.
- Skills in `~/.gemini/skills/` are symlinks to `repo/build/gemini/skills/`.
- User confirms the agents still work as expected.
