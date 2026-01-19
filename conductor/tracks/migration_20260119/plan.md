# Implementation Plan - Migrate Existing Configurations

## Phase 1: Backup & Analysis
- [ ] Task: Create a full archive tarball of `~/.gemini` and `~/.claude`
- [ ] Task: List and analyze contents of `~/.gemini/skills` to determine if they are generic or Gemini-specific
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Backup & Analysis' (Protocol in workflow.md)

## Phase 2: Import & Organize
- [ ] Task: Import `GEMINI.md` and `prompt.md` to `agents/gemini/`
- [ ] Task: Import `CLAUDE.md` to `agents/claude/`
- [ ] Task: Import generic skills from `~/.gemini/skills/` to `shared/skills/`
- [ ] Task: Import Gemini extensions to `agents/gemini/extensions/`
- [ ] Task: Import Claude plugins/commands to `agents/claude/`
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Import & Organize' (Protocol in workflow.md)

## Phase 3: Sync & Verify
- [ ] Task: Run `meta/sync.sh --verbose --yes` to apply symlinks
- [ ] Task: Verify directory structure and link targets
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Sync & Verify' (Protocol in workflow.md)
