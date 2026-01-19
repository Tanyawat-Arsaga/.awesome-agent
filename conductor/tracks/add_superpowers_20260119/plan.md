# Implementation Plan - Add Superpowers Skills

## Phase 1: Ingestion [checkpoint: 1d87089]
- [x] Task: Create `conductor/external` directory 1d87089
- [x] Task: Clone `https://github.com/obra/superpowers.git` into `conductor/external/superpowers` 1d87089
- [x] Task: Conductor - User Manual Verification 'Phase 1: Ingestion' (Protocol in workflow.md) 1d87089

## Phase 2: Engine Upgrade [checkpoint: f16bb43]
- [x] Task: Update `meta/sync.sh` to process `external/superpowers/skills` in the transformation step 89cd65f
- [x] Task: Implement renaming logic (prefix with `superpowers-`) to prevent naming conflicts 89cd65f
- [x] Task: Conductor - User Manual Verification 'Phase 2: Engine Upgrade' (Protocol in workflow.md) 89cd65f

## Phase 3: Sync & Verify [checkpoint: f16bb43]
- [x] Task: Run `meta/sync.sh --verbose --yes` 89cd65f
- [x] Task: Verify that superpowers skills appear in `~/.gemini/skills` and `~/.claude/skills` 89cd65f
- [x] Task: Conductor - User Manual Verification 'Phase 3: Sync & Verify' (Protocol in workflow.md) 89cd65f
