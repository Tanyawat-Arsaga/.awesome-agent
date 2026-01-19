#!/bin/bash

# tests/test_override.sh - Tests for agent-specific overrides

set -e

SYNC_SCRIPT="./meta/sync.sh"
AGENTS_DIR="./agents"
SHARED_SKILLS="./shared/skills"
HOME_MOCK="$(pwd)/tests/mock_home"

# Setup
rm -rf "$HOME_MOCK"
mkdir -p "$SHARED_SKILLS"
echo "shared content" > "$SHARED_SKILLS/common.md"
mkdir -p "$AGENTS_DIR/gemini/skills"
echo "override content" > "$AGENTS_DIR/gemini/skills/common.md"

# Test Override
test_override() {
    echo "Testing override logic..."
    
    export TARGET_ROOT="$HOME_MOCK"
    
    # Run sync
    $SYNC_SCRIPT --verbose --yes
    
    # Check ~/.gemini/skills/common.md
    if grep -q "override content" "$HOME_MOCK/.gemini/skills/common.md"; then
        echo "PASS: Agent override took priority"
    else
        echo "FAIL: Shared content was used instead of override"
        exit 1
    fi
}

# Run tests
test_override
