# Specification - Fix Skill Structure & Format

## Goal
Align the skill directory structure and file format with the official documentation for Gemini CLI and Claude Code. Both agents require a directory-based structure (`skills/<name>/SKILL.md`) and Markdown with YAML frontmatter.

## Requirements
1.  **Directory Structure:**
    -   Target: `~/.gemini/skills/<skill-name>/SKILL.md`
    -   Target: `~/.claude/skills/<skill-name>/SKILL.md`
2.  **File Format:**
    -   Markdown with YAML frontmatter.
    -   **Remove XML wrapping** for Claude (it was an incorrect assumption).
3.  **Transformation Logic Updates:**
    -   **Superpowers:** Copy the directory structure as-is (since it already matches `folder/SKILL.md`).
    -   **Shared (Flat) Skills:** Create a directory for each skill (e.g., `agent-browser.md` -> `agent-browser/SKILL.md`).

## Implementation Details
-   Update `meta/sync.sh`:
    -   Remove XML wrapping logic.
    -   Change output path for flat shared skills to `build/<agent>/skills/<name>/SKILL.md`.
    -   For Superpowers, copy the whole `skills/` tree structure or iterate and copy directories.
-   Clean up `build/` directory before running.

## Success Criteria
-   `~/.gemini/skills/superpowers-brainstorming/SKILL.md` exists.
-   `~/.claude/skills/superpowers-brainstorming/SKILL.md` exists.
-   `~/.gemini/skills/agent-browser/SKILL.md` exists.
-   Gemini CLI no longer complains about missing valid skills.
