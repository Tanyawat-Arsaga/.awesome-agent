# Specification - Add Superpowers Skills

## Goal
Integrate the "Superpowers" skill library (from https://github.com/obra/superpowers) into the Conductor repository, making its skills available to both Gemini and Claude via the existing sync and transformation engine.

## Strategy
1.  **Source Management:**
    -   Clone the `superpowers` repository into `conductor/external/superpowers`.
    -   This keeps third-party code separate from your own `shared/skills`.
2.  **Integration:**
    -   Update `meta/sync.sh` to include `external/superpowers/skills` as an additional source for the Transformation Logic.
    -   The transformation logic will:
        -   Copy `SKILL.md` files to `build/gemini/skills/` (renaming to `superpowers-[skillname].md` to avoid collisions).
        -   Wrap `SKILL.md` files in XML and save to `build/claude/skills/` (renaming to `superpowers-[skillname].xml`).
3.  **Sync:**
    -   The existing Sync Logic in `meta/sync.sh` will automatically pick up the new files in `build/` and symlink them to `~/.gemini/skills` and `~/.claude/skills` (or `.claudebot` / `.claude`).

## Benefits
-   **DRY:** You download the skills once.
-   **Cross-Agent:** Skills work for both Gemini (Markdown) and Claude (XML).
-   **Managed:** Updates are handled by `git pull` in the external directory.
