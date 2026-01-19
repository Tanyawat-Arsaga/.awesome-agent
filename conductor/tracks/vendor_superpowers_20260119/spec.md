# Specification: Vendor External Dependencies

## Context
The project was previously using git submodules for `external/superpowers` and several plugins in `agents/claude/plugins`. This caused issues with `git status` being noisy or "fucked" due to missing `.gitmodules` configuration and the inherent complexity of submodules (detached HEADs, separate commit histories, etc.).

## Goal
Simplify the project structure by "vendoring" these dependencies—converting them from git submodules into regular directories containing files that are directly tracked by the main repository.

## Requirements
1.  Remove git submodule configurations (`.gitmodules`, `.git/config` entries).
2.  Remove gitlinks (mode 160000) from the index.
3.  Remove nested `.git` directories to prevent them from being treated as sub-repositories.
4.  Add all files to the main repository.
5.  Ensure `.gitignore` is updated to reduce noise (e.g., ignoring `tests/mock_home`).
6.  Ensure the build/sync process (`meta/sync.sh`) still works with the vendored files.

## affected Paths
- `external/superpowers`
- `agents/claude/plugins/cache/superpowers-marketplace/superpowers/4.0.3`
- `agents/claude/plugins/marketplaces/claude-plugins-official`
- `agents/claude/plugins/marketplaces/superpowers-marketplace`
