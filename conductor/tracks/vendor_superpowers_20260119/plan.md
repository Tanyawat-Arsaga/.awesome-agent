# Implementation Plan - Vendor External Dependencies

## Phase 1: Cleanup & Vendoring [checkpoint: 1191c51]
- [x] Task: Add `tests/mock_home/` to `.gitignore` to reduce git status noise.
- [x] Task: Remove `.gitmodules`.
- [x] Task: Convert `external/superpowers` from submodule to vendored directory.
- [x] Task: Convert `agents/claude/plugins/cache/superpowers-marketplace/superpowers/4.0.3` from submodule to vendored directory.
- [x] Task: Convert `agents/claude/plugins/marketplaces/claude-plugins-official` from submodule to vendored directory.
- [x] Task: Convert `agents/claude/plugins/marketplaces/superpowers-marketplace` from submodule to vendored directory.
- [x] Task: Commit changes (Commit: `1191c51`).

## Phase 2: Verification
- [x] Task: Verify that `meta/sync.sh` still works correctly.
- [x] Task: Verify that the project is self-contained (no external git deps needed).