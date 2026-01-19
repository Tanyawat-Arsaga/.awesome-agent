# Initial Concept

The user wants to build a one-stop ultimate AI-agent configuration manager.
Goal: Centralize and manage `GEMINI.md`, `CLAUDE.md`, Skills, and MCP configurations.
Key Features:
- Use symlinks to map files to their corresponding target folders.
- Adhere to DRY (Don't Repeat Yourself) principles.
- Harmonious integration for adding new components.
- Analyze existing setup (likely referring to `../.gemini` and similar) to plan the structure.

# Product Definition - AI Agent Config Manager

## Vision
A centralized, DRY-compliant configuration manager for AI agents (Gemini, Claude, and future platforms). It serves as a single source of truth for `GEMINI.md`, `CLAUDE.md`, Skills, and MCP configurations, ensuring consistency across different environments through automated symlinking.

## Target Audience
Power users and developers who use multiple AI agents and want a "set and forget" way to sync their personalized prompts, skills, and tool definitions.

## Core Features
- **Centralized Source:** A single directory structure containing all shared and agent-specific configurations.
- **Component-Based Architecture:** Shared folders for `skills/`, `prompts/`, and `mcps/` to avoid duplication.
- **Agent-Specific Overrides:** Dedicated directories for agent-unique files (e.g., `gemini/`, `claude/`) that extend or override the shared core.
- **One-Click Sync:** A lightweight script that automatically maps and symlinks files from the central repository to the appropriate system locations (e.g., `~/.gemini/`).
- **Automatic Detection:** The sync script detects new files in the source directories and updates symlinks accordingly.

## Goals
- **DRY (Don't Repeat Yourself):** Eliminate the need to manually copy `GEMINI.md` or common skills between different project or agent folders.
- **Harmonious Integration:** New skills or MCPs added to the source are immediately available to all supported agents after a sync.
- **Future-Proofing:** Easily extensible to support new agents by adding new mapping definitions to the sync script.
