#!/bin/bash

# sync.sh - AI Agent Config Manager Sync Script

set -e

VERBOSE=false
DRY_RUN=false
CLEAN=false

usage() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -v, --verbose  Enable verbose output"
    echo "  -d, --dry-run  Show actions without making changes"
    echo "  -c, --clean    Interactively clean up broken symlinks"
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
        -h|--help)
            usage
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done

if [ "$VERBOSE" = true ]; then
    echo "Verbose mode enabled."
fi

if [ "$DRY_RUN" = true ]; then
    echo "Dry run mode enabled. No changes will be made."
fi

if [ "$CLEAN" = true ]; then
    echo "Clean mode enabled. Interactive cleanup will be performed."
fi

# Transformation Logic
BUILD_DIR="./build"
SHARED_SKILLS="./shared/skills"

# Ensure build directories exist
mkdir -p "$BUILD_DIR/gemini"
mkdir -p "$BUILD_DIR/claude"

# Gemini Transformation (Markdown pass-through)
if [ -d "$SHARED_SKILLS" ]; then
    if [ "$VERBOSE" = true ]; then
        echo "Processing shared skills for Gemini..."
    fi
    for file in "$SHARED_SKILLS"/*.md; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            cp "$file" "$BUILD_DIR/gemini/$filename"
            if [ "$VERBOSE" = true ]; then
                echo "Compiled (Copy): $filename -> $BUILD_DIR/gemini/$filename"
            fi
        fi
    done
fi

# TODO: Implement Claude transformation logic
# TODO: Implement sync logic
