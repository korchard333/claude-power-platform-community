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

# --- Skills ---
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

echo "✓ Installed $count skills to $SKILLS_DEST"

# --- CLAUDE.md (global standards) ---
echo ""
CLAUDE_MD_SRC="$SCRIPT_DIR/CLAUDE.md"
CLAUDE_MD_DEST="$CLAUDE_DIR/CLAUDE.md"

if [ -L "$CLAUDE_MD_DEST" ]; then
    rm "$CLAUDE_MD_DEST"
    ln -s "$CLAUDE_MD_SRC" "$CLAUDE_MD_DEST"
    echo "✓ CLAUDE.md symlink updated"
elif [ -f "$CLAUDE_MD_DEST" ]; then
    echo "  [SKIPPED] CLAUDE.md — a file already exists at $CLAUDE_MD_DEST"
    echo "  To use this repo's CLAUDE.md globally, back up yours and re-run."
else
    ln -s "$CLAUDE_MD_SRC" "$CLAUDE_MD_DEST"
    echo "✓ CLAUDE.md symlinked to $CLAUDE_MD_DEST (applies to all Claude Code sessions)"
fi

# --- ORCHESTRATION.md ---
ORCH_SRC="$SCRIPT_DIR/ORCHESTRATION.md"
ORCH_DEST="$CLAUDE_DIR/ORCHESTRATION.md"

if [ -L "$ORCH_DEST" ]; then
    rm "$ORCH_DEST"
    ln -s "$ORCH_SRC" "$ORCH_DEST"
    echo "✓ ORCHESTRATION.md symlink updated"
elif [ -f "$ORCH_DEST" ]; then
    echo "  [SKIPPED] ORCHESTRATION.md — a file already exists at $ORCH_DEST"
else
    ln -s "$ORCH_SRC" "$ORCH_DEST"
    echo "✓ ORCHESTRATION.md symlinked to $ORCH_DEST"
fi

echo ""
echo "Skills, standards, and orchestration guide are now available in any Claude Code session."
echo "To uninstall: ./uninstall.sh"
