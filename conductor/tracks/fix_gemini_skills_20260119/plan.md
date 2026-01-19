# Implementation Plan - Fix Skill Structure & Format

## Phase 1: Engine Refactoring
- [ ] Task: Update `meta/sync.sh` to remove XML wrapping and implement directory-based output for shared skills
- [ ] Task: Update `meta/sync.sh` to preserve directory structure for Superpowers skills (copy `SKILL.md` to `.../<name>/SKILL.md`)
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Engine Refactoring' (Protocol in workflow.md)

## Phase 2: Cleanup & Sync
- [ ] Task: Manually clean up old flat symlinks in `~/.gemini/skills` and `~/.claude/skills` (or use `sync.sh --clean` if reliable)
- [ ] Task: Run `meta/sync.sh --verbose --yes` to deploy new structure
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Cleanup & Sync' (Protocol in workflow.md)
