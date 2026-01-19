#!/bin/bash

# sync.sh - AI Agent Config Manager Sync Script

set -e

VERBOSE=false
DRY_RUN=false
CLEAN=false
AUTO_CONFIRM=false

usage() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -v, --verbose  Enable verbose output"
    echo "  -d, --dry-run  Show actions without making changes"
    echo "  -c, --clean    Interactively clean up broken symlinks"
    echo "  -y, --yes      Auto-confirm all prompts (backups, cleanup)"
    echo "  -h, --help     Show this help message"
    exit 1
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -c|--clean)
            CLEAN=true
            shift
            ;;
        -y|--yes)
            AUTO_CONFIRM=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done
# Configuration
BUILD_DIR="./build"
SHARED_SKILLS="./shared/skills"
AGENTS_DIR="./agents"
TARGET_ROOT="${TARGET_ROOT:-$HOME}"
BACKUP_DIR="${TARGET_ROOT}/.agent_config_backups"

if [ "$VERBOSE" = true ]; then
    echo "Verbose mode enabled."
    echo "Target Root: $TARGET_ROOT"
fi

if [ "$DRY_RUN" = true ]; then
    echo "Dry run mode enabled. No changes will be made."
fi

if [ "$CLEAN" = true ]; then
    echo "Clean mode enabled. Interactive cleanup will be performed."
fi

# Ensure build directories exist
mkdir -p "$BUILD_DIR/gemini"
mkdir -p "$BUILD_DIR/claude"

# --- Utilities ---

# Portable way to get absolute path
get_abs_path() {
    local path="$1"
    if [[ "$path" == /* ]]; then
        echo "$path"
    else
        echo "$(pwd)/${path#./}"
    fi
}

# --- Transformation Logic ---

# Superpowers Integration
SUPERPOWERS_SKILLS="./external/superpowers/skills"

if [ -d "$SUPERPOWERS_SKILLS" ]; then
    if [ "$VERBOSE" = true ]; then
        echo "Processing Superpowers skills..."
    fi
    # Iterate through each skill directory
    for skill_dir in "$SUPERPOWERS_SKILLS"/*; do
        if [ -d "$skill_dir" ]; then
            skill_name=$(basename "$skill_dir")
            skill_file="$skill_dir/SKILL.md"
            
            if [ -f "$skill_file" ]; then
                # Gemini (Markdown copy with prefix)
                gemini_target="$BUILD_DIR/gemini/superpowers-${skill_name}.md"
                if [ "$DRY_RUN" = true ]; then
                    [ "$VERBOSE" = true ] && echo "[Dry Run] Would compile: $skill_file -> $gemini_target"
                else
                    cp "$skill_file" "$gemini_target"
                    [ "$VERBOSE" = true ] && echo "Compiled: $gemini_target"
                fi
                
                # Claude (XML wrap with prefix)
                claude_target="$BUILD_DIR/claude/superpowers-${skill_name}.xml"
                if [ "$DRY_RUN" = true ]; then
                    [ "$VERBOSE" = true ] && echo "[Dry Run] Would compile: $skill_file -> $claude_target"
                else
                    echo "<skill name=\"superpowers-${skill_name}\">" > "$claude_target"
                    cat "$skill_file" >> "$claude_target"
                    echo "</skill>" >> "$claude_target"
                    [ "$VERBOSE" = true ] && echo "Compiled: $claude_target"
                fi
            fi
        fi
    done
fi

# Gemini Transformation (Markdown pass-through)
if [ -d "$SHARED_SKILLS" ]; then
    if [ "$VERBOSE" = true ]; then
        echo "Processing shared skills for Gemini..."
    fi
    for file in "$SHARED_SKILLS"/*.md; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            if [ "$DRY_RUN" = true ]; then
                [ "$VERBOSE" = true ] && echo "[Dry Run] Would compile (Copy): $filename -> $BUILD_DIR/gemini/$filename"
            else
                cp "$file" "$BUILD_DIR/gemini/$filename"
                if [ "$VERBOSE" = true ]; then
                    echo "Compiled (Copy): $filename -> $BUILD_DIR/gemini/$filename"
                fi
            fi
        fi
    done
fi

# Claude Transformation (XML wrapping)
if [ -d "$SHARED_SKILLS" ]; then
    if [ "$VERBOSE" = true ]; then
        echo "Processing shared skills for Claude..."
    fi
    for file in "$SHARED_SKILLS"/*.md; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            name="${filename%.*}"
            target="$BUILD_DIR/claude/${name}.xml"
            
            if [ "$DRY_RUN" = true ]; then
                [ "$VERBOSE" = true ] && echo "[Dry Run] Would compile (XML Wrap): $filename -> $target"
            else
                echo "<skill name=\"$name\">" > "$target"
                cat "$file" >> "$target"
                echo "</skill>" >> "$target"
                
                if [ "$VERBOSE" = true ]; then
                    echo "Compiled (XML Wrap): $filename -> $target"
                fi
            fi
        fi
    done
fi

# --- Sync Logic ---

if [ "$VERBOSE" = true ]; then
    echo "Starting sync process..."
fi

# Function to safely symlink
safe_symlink() {
    local source="$1"
    local dest="$2"
    local dest_dir=$(dirname "$dest")
    
    if [ "$VERBOSE" = true ]; then
         echo "Symlink: $source -> $dest"
    fi

    if [ "$DRY_RUN" = true ]; then
        return
    fi

    # Backup if destination exists and is a regular file (not a symlink)
    if [ -f "$dest" ] && [ ! -L "$dest" ]; then
        local timestamp=$(date +%Y%m%d%H%M%S)
        local backup_path="${BACKUP_DIR}/$(basename "$dest")_${timestamp}"
        mkdir -p "$BACKUP_DIR"
        
        echo "WARNING: $dest already exists as a regular file."
        local confirm=""
        if [ "$AUTO_CONFIRM" = true ]; then
            confirm="y"
        else
            read -p "Backup and replace with symlink? [y/N] " confirm
        fi

        if [[ "$confirm" =~ ^[Yy]$ ]]; then
            cp "$dest" "$backup_path"
            echo "Backed up: $dest -> $backup_path"
        else
            echo "Skipping: $dest"
            return
        fi
    fi

    mkdir -p "$dest_dir"
    ln -sf "$source" "$dest"
}

# 1. Sync Built Shared Files (build/gemini/* -> ~/.gemini/skills/*)
for agent in gemini claude; do
    build_subdir="$BUILD_DIR/$agent"
    if [ -d "$build_subdir" ]; then
        agent_dot_folder=".$agent"
        [ "$agent" == "claude" ] && agent_dot_folder=".claude"
        
        find "$build_subdir" -type f -not -name ".gitkeep" | while read source_file; do
            filename=$(basename "$source_file")
            target_dest="$TARGET_ROOT/$agent_dot_folder/skills/$filename"
            safe_symlink "$(get_abs_path "$source_file")" "$target_dest"
        
        done
    fi
done

# 2. Sync Agent-Specific Files (agents/gemini/* -> ~/.gemini/*)
if [ -d "$AGENTS_DIR" ]; then
    find "$AGENTS_DIR" -type f -not -name ".gitkeep" | while read source_file; do
        inferred_path="${source_file#$AGENTS_DIR/}"
        agent_name=$(echo "$inferred_path" | cut -d'/' -f1)
        relative_path="${inferred_path#$agent_name/}"
        
        target_dest="$TARGET_ROOT/.$agent_name/$relative_path"
        if [ "$agent_name" == "claude" ]; then
             target_dest="$TARGET_ROOT/.claude/$relative_path"
        fi

        safe_symlink "$(get_abs_path "$source_file")" "$target_dest"
    done
fi

# 3. Sync Core Profile
CORE_PROFILE="./shared/core_profile.md"
if [ -f "$CORE_PROFILE" ]; then
    safe_symlink "$(get_abs_path "$CORE_PROFILE")" "$TARGET_ROOT/.gemini/GEMINI.md"
    safe_symlink "$(get_abs_path "$CORE_PROFILE")" "$TARGET_ROOT/.claude/CLAUDE.md"
fi

# --- Cleanup Logic ---

if [ "$CLEAN" = true ]; then

    echo "Pruning broken symlinks in $TARGET_ROOT..."

    # Simple cleanup for .gemini and .claude

    for folder in .gemini .claude; do

        if [ -d "$TARGET_ROOT/$folder" ]; then

            # Portable way to find broken symlinks:

            # find all links, then check if they exist. ! -e means broken.

                        find "$TARGET_ROOT/$folder" -type l | while read broken_link; do

                            if [ ! -e "$broken_link" ]; then

                                confirm=""

                                if [ "$AUTO_CONFIRM" = true ]; then

                                    confirm="y"

                                else

                                    read -p "Remove broken symlink $broken_link? [y/N] " confirm

                                fi

            

                                if [[ "$confirm" =~ ^[Yy]$ ]]; then

                                    rm "$broken_link"

                                    echo "Removed: $broken_link"

                                fi

                            fi

                        done

            

        fi

    done

fi
