#!/usr/bin/env bash
# uninstall.sh — Remove Power Platform skill symlinks from global Claude Code config.
# Usage: ./uninstall.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILLS_SRC="$SCRIPT_DIR/.claude/skills"

# Determine Claude Code config directory
if [[ "$OSTYPE" == "darwin"* ]]; then
    CLAUDE_DIR="$HOME/.claude"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    CLAUDE_DIR="$HOME/.claude"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "mingw"* || "$OSTYPE" == "cygwin" ]]; then
    CLAUDE_DIR="$APPDATA/.claude"
else
    echo "Unsupported OS: $OSTYPE"
    exit 1
fi

SKILLS_DEST="$CLAUDE_DIR/skills"

echo "Uninstalling Power Platform skills..."

count=0
for skill_dir in "$SKILLS_SRC"/*/; do
    skill_name="$(basename "$skill_dir")"
    target="$SKILLS_DEST/$skill_name"

    if [ -L "$target" ]; then
        rm "$target"
        count=$((count + 1))

        # Restore backup if exists
        if [ -d "${target}.bak" ]; then
            mv "${target}.bak" "$target"
            echo "  [RESTORED] $skill_name from backup"
        fi
    fi
done

echo "✓ Removed $count skill symlinks from $SKILLS_DEST"

# Remove CLAUDE.md and ORCHESTRATION.md symlinks (only if they point to this repo)
for file in CLAUDE.md ORCHESTRATION.md; do
    target="$CLAUDE_DIR/$file"
    if [ -L "$target" ]; then
        link_target="$(readlink "$target")"
        if [[ "$link_target" == "$SCRIPT_DIR"* ]]; then
            rm "$target"
            echo "✓ Removed $file symlink"
        else
            echo "  [SKIPPED] $file — symlink points elsewhere, not removing"
        fi
    fi
done

echo ""
echo "✓ Uninstall complete"
