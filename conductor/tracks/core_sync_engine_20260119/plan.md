# Implementation Plan - Build the Core Sync Engine

## Phase 1: Foundation & Structure [checkpoint: 0c8cdd8]
- [x] Task: Create project directory structure (`shared/skills`, `shared/prompts`, `shared/mcps`, `agents/gemini`, `agents/claude`, `meta`) 80d39e4
- [x] Task: Initialize `meta/sync.sh` with basic argument parsing (verbose, dry-run, clean) 80d39e4
- [x] Task: Conductor - User Manual Verification 'Phase 1: Foundation & Structure' (Protocol in workflow.md) 0c8cdd8

## Phase 2: Compiler & Transformation [checkpoint: 20bbb6e]
- [x] Task: Implement transformation logic for Gemini (Markdown pass-through) 7a4861d
- [x] Task: Implement transformation logic for Claude (XML wrapping) 864eb3d
- [x] Task: Implement the build process to output to `build/` directory 864eb3d
- [x] Task: Conductor - User Manual Verification 'Phase 2: Compiler & Transformation' (Protocol in workflow.md) 20bbb6e

## Phase 3: Sync Engine & Symlinking
- [ ] Task: Implement directory inference logic (agents/ -> home)
- [ ] Task: Implement safety check and backup logic (`.backup/` with timestamp)
- [ ] Task: Implement symlinking logic for agent-specific and built shared files
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Sync Engine & Symlinking' (Protocol in workflow.md)

## Phase 4: Cleanup & Polishing
- [ ] Task: Implement interactive cleanup logic for broken/orphaned links
- [ ] Task: Final cross-platform testing and verbose logging refinement
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Cleanup & Polishing' (Protocol in workflow.md)
