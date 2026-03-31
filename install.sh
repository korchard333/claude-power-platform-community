#!/usr/bin/env bash
# install.sh — Symlink Power Platform skills into your global Claude Code config.
# Usage: ./install.sh
# Re-run any time to pick up new skills.

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
mkdir -p "$SKILLS_DEST"

echo "Installing Power Platform skills..."
echo "  Source: $SKILLS_SRC"
echo "  Target: $SKILLS_DEST"
echo ""

count=0
for skill_dir in "$SKILLS_SRC"/*/; do
    skill_name="$(basename "$skill_dir")"
    target="$SKILLS_DEST/$skill_name"

    if [ -L "$target" ]; then
        rm "$target"
    elif [ -d "$target" ]; then
        echo "  [BACKUP] $skill_name → ${target}.bak"
        mv "$target" "${target}.bak"
    fi

    ln -s "$skill_dir" "$target"
    count=$((count + 1))
done

echo ""
echo "✓ Installed $count skills to $SKILLS_DEST"
echo ""
echo "Skills are now available in any Claude Code session."
echo "To uninstall: ./uninstall.sh"
