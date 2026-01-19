# Implementation Plan - Migrate Existing Configurations

## Phase 1: Backup & Analysis [checkpoint: f16bb43]
- [x] Task: Create a full archive tarball of `~/.gemini` and `~/.claude` f16bb43
- [x] Task: List and analyze contents of `~/.gemini/skills` to determine if they are generic or Gemini-specific f16bb43
- [x] Task: Conductor - User Manual Verification 'Phase 1: Backup & Analysis' (Protocol in workflow.md) f16bb43

## Phase 2: Import & Organize [checkpoint: f16bb43]
- [x] Task: Import `GEMINI.md` and `prompt.md` to `agents/gemini/` f16bb43
- [x] Task: Import `CLAUDE.md` to `agents/claude/` f16bb43
- [x] Task: Import generic skills from `~/.gemini/skills/` to `shared/skills/` f16bb43
- [x] Task: Import Gemini extensions to `agents/gemini/extensions/` f16bb43
- [x] Task: Import Claude plugins/commands to `agents/claude/` f16bb43
- [x] Task: Conductor - User Manual Verification 'Phase 2: Import & Organize' (Protocol in workflow.md) f16bb43

## Phase 3: Sync & Verify [checkpoint: f16bb43]
- [x] Task: Run `meta/sync.sh --verbose --yes` to apply symlinks f16bb43
- [x] Task: Verify directory structure and link targets f16bb43
- [x] Task: Conductor - User Manual Verification 'Phase 3: Sync & Verify' (Protocol in workflow.md) f16bb43
