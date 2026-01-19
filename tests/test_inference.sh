#!/bin/bash

# tests/test_inference.sh - Tests for directory inference logic

set -e

SYNC_SCRIPT="./meta/sync.sh"
AGENTS_DIR="./agents"
HOME_MOCK="$(pwd)/tests/mock_home"

# Setup
mkdir -p "$AGENTS_DIR/gemini"
echo "test" > "$AGENTS_DIR/gemini/GEMINI.md"
mkdir -p "$HOME_MOCK"

# Test Inference
test_inference() {
    echo "Testing inference logic..."
    
    export TARGET_ROOT="$HOME_MOCK"
    # Use -v and capture output
    output=$($SYNC_SCRIPT --verbose --dry-run)
    
    # We expect something like: Symlink: /.../agents/gemini/GEMINI.md -> /.../tests/mock_home/.gemini/GEMINI.md
    # Since readlink -f is used, we check for the suffix
    if echo "$output" | grep -q "agents/gemini/GEMINI.md -> $HOME_MOCK/.gemini/GEMINI.md"; then
        echo "PASS: Inference logic correct"
    else
        echo "FAIL: Inference logic incorrect"
        echo "Output was:"
        echo "$output"
        exit 1
    fi
}

# Run tests
test_inference