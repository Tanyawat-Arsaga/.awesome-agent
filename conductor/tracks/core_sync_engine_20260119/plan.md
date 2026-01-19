# Implementation Plan - Build the Core Sync Engine

## Phase 1: Foundation & Structure
- [ ] Task: Create project directory structure (`shared/skills`, `shared/prompts`, `shared/mcps`, `agents/gemini`, `agents/claude`, `meta`)
- [ ] Task: Initialize `meta/sync.sh` with basic argument parsing (verbose, dry-run, clean)
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Foundation & Structure' (Protocol in workflow.md)

## Phase 2: Compiler & Transformation
- [ ] Task: Implement transformation logic for Gemini (Markdown pass-through)
- [ ] Task: Implement transformation logic for Claude (XML wrapping)
- [ ] Task: Implement the build process to output to `build/` directory
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Compiler & Transformation' (Protocol in workflow.md)

## Phase 3: Sync Engine & Symlinking
- [ ] Task: Implement directory inference logic (agents/ -> home)
- [ ] Task: Implement safety check and backup logic (`.backup/` with timestamp)
- [ ] Task: Implement symlinking logic for agent-specific and built shared files
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Sync Engine & Symlinking' (Protocol in workflow.md)

## Phase 4: Cleanup & Polishing
- [ ] Task: Implement interactive cleanup logic for broken/orphaned links
- [ ] Task: Final cross-platform testing and verbose logging refinement
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Cleanup & Polishing' (Protocol in workflow.md)
