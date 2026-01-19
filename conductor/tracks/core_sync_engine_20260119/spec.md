# Specification - Build the Core Sync Engine

## Goal
Implement a robust, cross-platform (Darwin/Linux) Bash sync script that manages AI agent configurations using a DRY-compliant, pattern-based symlinking approach with an integrated transformation (compilation) step.

## Scope
- **Directory Structure:** Setup `shared/`, `agents/`, `meta/`, and `build/`.
- **Sync Script (`meta/sync.sh`):**
    - **Inference Engine:** Map `agents/<agent>/*` to `~/.<agent>/*`.
    - **Compiler:** Transform `shared/skills/*.md` into agent-specific formats in `build/`.
        - Gemini: Native Markdown.
        - Claude: XML-wrapped Markdown.
    - **Symlinking:** Link files from `agents/` and `build/` to the home directory.
    - **Safety:** Automatic backup of existing files with user confirmation.
    - **Logging:** Verbose output of all actions.
    - **Dry Run:** Flag to simulate actions.
    - **Cleanup:** Interactive pruning of broken or orphaned symlinks.

## Success Criteria
- Running `sync.sh` correctly symlinks files to `~/.gemini/` and `~/.claudebot/`.
- Existing files are backed up before being replaced by symlinks.
- Shared skills are correctly transformed into agent-specific formats in the `build/` directory.
- Script handles errors gracefully and provides clear, verbose output.
