# Specification: Standardize Sync Engine (OpenSkills Adoption)

## Context
We currently use custom `meta/sync.sh` logic to manage skills for Gemini and Claude. The `openskills` project (and Anthropic's emerging standards) suggests a more robust approach:
1.  **Unified `AGENTS.md`**: A single system prompt file that multiple agents can read.
2.  **Lazy Loading**: Instead of dumping all skill text into the prompt, we should provide an `<available_skills>` XML block. The agent then calls a "read" command to load the full skill text only when needed.
3.  **Universal Path**: Skills can live in `.agent/skills` to be shared across agents.

## Goal
Refactor our sync engine (`meta/sync.sh`) and agent configuration to align with these standards.

## Requirements

### 1. `AGENTS.md` Adoption
-   Create a new `shared/AGENTS.md` (or rename `core_profile.md`) that serves as the "Universal System Prompt".
-   It must include the `<skills_system>` and `<available_skills>` XML blocks as specified by `openskills`.
-   Update `meta/sync.sh` to symlink this `AGENTS.md` to `~/.gemini/GEMINI.md` and `~/.claude/CLAUDE.md` (or configure agents to read it directly if possible).

### 2. Lazy Loading Architecture
-   **Current:** `meta/sync.sh` copies/symlinks full skill content.
-   **New:**
    -   `meta/sync.sh` should scan `build/` or `external/` skills.
    -   It should **generate** the `<available_skills>` XML block in `AGENTS.md` with:
        -   `<name>`: The skill name (e.g., `git-workflow`).
        -   `<description>`: Extracted from the frontmatter of `SKILL.md`.
        -   `<location>`: `project` or `global` (we'll stick to `global` or `agent-local` for now).
    -   The agents need a way to "read" the skill.
        -   **Gemini:** Use `read_file` (native tool). The prompt instructions should tell it to `read_file ~/.agent/skills/<name>/SKILL.md`.
        -   **Claude:** Native support or similar `read_file` instructions.

### 3. Universal Skills Directory
-   Target directory: `~/.agent/skills/` (or project-relative `.agent/skills/`).
-   Update `meta/sync.sh` to sync built skills to this universal location instead of/in addition to agent-specific ones.

## Migration Steps
1.  **Refactor `core_profile.md`**: Add the `openskills` compatible XML structure.
2.  **Update `meta/sync.sh`**: Add logic to parse `SKILL.md` frontmatter and inject it into `AGENTS.md`.
3.  **Verify**: Ensure Gemini and Claude can still "see" and "use" the skills (via the new lazy loading workflow).
