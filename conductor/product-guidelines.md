# Product Guidelines - AI Agent Config Manager

## Repository Structure
- **`shared/`**: Contains common components shared across multiple agents.
    - `shared/skills/`: Common skill definitions (Markdown/JSON).
    - `shared/prompts/`: Universal system prompts or templates.
    - `shared/mcps/`: Shared Model Context Protocol configurations.
- **`agents/`**: Contains agent-specific configurations and overrides.
    - `agents/gemini/`: Files specific to Google Gemini (e.g., `GEMINI.md`).
    - `agents/claude/`: Files specific to Anthropic Claude (e.g., `CLAUDE.md`).
- **`meta/`**: Infrastructure and automation logic.
    - `meta/sync.sh`: The primary synchronization and symlinking script.
    - `meta/mappings.json`: Declarative mapping of source files to target system paths.

## Synchronization Logic
- **Agent Priority:** If a file exists in both `shared/` and an `agents/<agent_name>/` subdirectory with the same target mapping, the agent-specific version MUST take priority and be symlinked.
- **Safety First:**
    - The script must perform a check before creating a symlink.
    - If a regular file exists at the target location, the script MUST prompt the user for confirmation and create a timestamped backup in a `.backup/` directory before proceeding.
- **Verbose Reporting:** The script will output a detailed log of every action: "Symlinking [source] -> [target]", "Backing up [existing]...", "Skipping [identical symlink]".

## Content Standards
- **Native Compliance:** Configuration files (Skills, MCPs, `GEMINI.md`) should adhere strictly to the format and conventions required by their respective AI agent or platform. No additional metadata or wrappers should be added unless necessary for the target system.
- **Relative Linking:** Use standard Markdown relative links when referencing files within the repository.
