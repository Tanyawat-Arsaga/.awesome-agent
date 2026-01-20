#!/bin/bash
# meta/add-skill.sh - Add a skill from a GitHub repo or local path

set -e

SOURCE=$1
NAME=$2

if [ -z "$SOURCE" ]; then
    echo "Usage: $0 <github-repo-or-path> [custom-name]"
    echo "Example: $0 elysiajs/skills elysia"
    exit 1
fi

# Determine destination name
if [ -z "$NAME" ]; then
    NAME=$(basename "$SOURCE")
fi

TARGET_DIR="./external/$NAME"
TEMP_DIR="/tmp/add_skill_$(date +%s)"

echo "Fetching skill from $SOURCE..."

if [[ "$SOURCE" == *"/"* ]] && [[ ! -d "$SOURCE" ]]; then
    # Assume GitHub repo
    git clone "https://github.com/$SOURCE" "$TEMP_DIR" --depth 1
else
    # Assume local path
    cp -r "$SOURCE" "$TEMP_DIR"
fi

# Clean up git metadata to keep our repo clean
rm -rf "$TEMP_DIR/.git"

# Move to external/
mkdir -p "$TARGET_DIR"
cp -r "$TEMP_DIR"/* "$TARGET_DIR/"

echo "Skill added to $TARGET_DIR"

# Cleanup
rm -rf "$TEMP_DIR"

# Automatically sync to rebuild AGENTS.md
echo "Rebuilding prompt..."
./meta/sync.sh --verbose --yes
