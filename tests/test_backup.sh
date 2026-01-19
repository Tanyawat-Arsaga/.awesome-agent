#!/bin/bash

# tests/test_backup.sh - Tests for safety check and backup logic

set -e

SYNC_SCRIPT="./meta/sync.sh"
AGENTS_DIR="./agents"
HOME_MOCK="$(pwd)/tests/mock_home"
BACKUP_DIR="$HOME_MOCK/.agent_config_backups"

# Setup
rm -rf "$HOME_MOCK"
mkdir -p "$AGENTS_DIR/gemini"
echo "new content" > "$AGENTS_DIR/gemini/GEMINI.md"
mkdir -p "$HOME_MOCK/.gemini"
echo "old content" > "$HOME_MOCK/.gemini/GEMINI.md"

# Test Backup using --yes
test_backup() {
    echo "Testing backup logic..."
    
    export TARGET_ROOT="$HOME_MOCK"
    
    # Use --yes to avoid interactive prompt
    $SYNC_SCRIPT --verbose --yes
    
    if [ -L "$HOME_MOCK/.gemini/GEMINI.md" ]; then
        echo "PASS: Symlink created"
    else
        echo "FAIL: Symlink not created"
        exit 1
    fi
    
    if [ "$(ls -A "$BACKUP_DIR")" ]; then
        echo "PASS: Backup created in $BACKUP_DIR"
        backup_file=$(ls "$BACKUP_DIR" | grep GEMINI.md)
        if grep -q "old content" "$BACKUP_DIR/$backup_file"; then
             echo "PASS: Backup content is correct"
        else
             echo "FAIL: Backup content is incorrect"
             exit 1
        fi
    else
        echo "FAIL: No backup found"
        exit 1
    fi
}

# Run tests
test_backup