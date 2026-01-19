#!/bin/bash

# tests/test_transform.sh - Tests for transformation logic

set -e

SYNC_SCRIPT="./meta/sync.sh"
BUILD_DIR="./build"
SHARED_DIR="./shared/skills"

# Setup
mkdir -p "$SHARED_DIR"
echo "# Test Skill" > "$SHARED_DIR/test_skill.md"

# Test Gemini Transformation (Directory Structure)
test_gemini_transform() {
    echo "Testing Gemini transformation..."
    $SYNC_SCRIPT --verbose
    
    if [ -f "$BUILD_DIR/gemini/skills/test_skill/SKILL.md" ]; then
        echo "PASS: Gemini file created in directory structure"
    else
        echo "FAIL: Gemini file not created"
        ls -R "$BUILD_DIR/gemini"
        exit 1
    fi
}

# Test Claude Transformation (Directory Structure, No XML)
test_claude_transform() {
    echo "Testing Claude transformation..."
    $SYNC_SCRIPT --verbose
    
    if [ -f "$BUILD_DIR/claude/skills/test_skill/SKILL.md" ]; then
        echo "PASS: Claude file created in directory structure"
        # Check content to ensure no XML wrapping (simple check if it starts with # Test Skill)
        if grep -q "# Test Skill" "$BUILD_DIR/claude/skills/test_skill/SKILL.md"; then
             echo "PASS: Claude file content is correct (Markdown)"
        else
             echo "FAIL: Claude file content is incorrect"
             cat "$BUILD_DIR/claude/skills/test_skill/SKILL.md"
             exit 1
        fi
    else
        echo "FAIL: Claude file not created"
        ls -R "$BUILD_DIR/claude"
        exit 1
    fi
}

# Run tests
test_gemini_transform
test_claude_transform

echo "Transformation tests passed"