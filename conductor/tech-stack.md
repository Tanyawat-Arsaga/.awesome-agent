# Tech Stack - AI Agent Config Manager

## Scripting & Automation
- **Primary Language:** POSIX-compliant Bash / Zsh.
    - Focus on cross-platform compatibility (macOS/Linux).
    - Use standard Unix utilities (`ln`, `mkdir`, `readlink`, `find`, `dirname`, `basename`).
- **Data Processing:** `jq` (optional, for any JSON-based configurations or MCP manifest processing).

## Version Control & Management
- **Git:** The entire configuration repository will be a Git repository to track changes and facilitate "sync" via `git pull`.
- **Symlinking:** The core mechanism for deployment. Symlinks will point from the system configuration folders (e.g., `~/.gemini/`) back to the local Git repository.

## Directory Structure Inference
- **Convention-over-Configuration:** The sync script will use directory patterns to determine destination paths.
    - `agents/gemini/*` -> `~/.gemini/*`
    - `agents/claude/*` -> `~/.claudebot/*` (or appropriate system path)
    - `shared/skills/*` -> `~/.gemini/skills/` AND `~/.claudebot/skills/`
