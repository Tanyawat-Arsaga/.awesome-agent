# Implementation Plan - Standardize Sync Engine

## Phase 1: The Universal Prompt [checkpoint: 1]
- [ ] Task: Create `shared/AGENTS.md` based on `shared/core_profile.md`.
- [ ] Task: Add the static `<skills_system>` boilerplate (usage instructions) to `AGENTS.md`.
- [ ] Task: Create a placeholder `<!-- SKILLS_LIST -->` marker in `AGENTS.md` for injection.
- [ ] Task: Update `meta/sync.sh` to symlink `shared/AGENTS.md` to `~/.gemini/GEMINI.md` and `~/.claude/CLAUDE.md`.

## Phase 2: Metadata Extraction [checkpoint: 2]
- [ ] Task: Write a script (python or bash) to parse YAML frontmatter from `SKILL.md` files.
- [ ] Task: Generate the `<available_skills>` XML block from the parsed metadata.
- [ ] Task: Inject this XML block into `AGENTS.md` during the `meta/sync.sh` run.

## Phase 3: Universal Storage [checkpoint: 3]
- [ ] Task: Update `meta/sync.sh` to sync all skills to `~/.agent/skills/` (creating the dir if needed).
- [ ] Task: Update `AGENTS.md` usage instructions to tell agents how to load skills from `~/.agent/skills/`.
    -   *Instruction:* "To load a skill, read the file `~/.agent/skills/<skill-name>/SKILL.md`".

## Phase 4: Verification [checkpoint: 4]
- [ ] Task: Run `meta/sync.sh`.
- [ ] Task: Verify `~/.gemini/GEMINI.md` contains the generated skill list.
- [ ] Task: Verify `~/.agent/skills/` contains the actual skill files.
- [ ] Task: Manual Test - Ask Gemini "What skills do you have?" and "Load the git skill".

## Phase 5: Modular Rule Support (Vercel Inspiration) [checkpoint: 5]
- [x] Task: Vendor Vercel skills into `external/vercel-skills/`.
- [ ] Task: Update `meta/sync.sh` to support stitching: if a skill has a `rules/` folder, concatenate all `*.md` files into the final `SKILL.md`.
- [ ] Task: Implement context optimization: if `SKILL.md` > 500 lines, automatically move detailed sections to `references/` during the build.


## Phase 5: Modular Rule Support (Vercel Inspiration) [checkpoint: 5]
- [x] Task: Vendor Vercel skills into `external/vercel-skills/`.
- [ ] Task: Update `meta/sync.sh` to support stitching: if a skill has a `rules/` folder, concatenate all `*.md` files into the final `SKILL.md`.
- [ ] Task: Implement context optimization: if `SKILL.md` > 500 lines, automatically move detailed sections to `references/` during the build.

