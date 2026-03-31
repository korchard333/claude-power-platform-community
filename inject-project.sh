#!/usr/bin/env bash
# inject-project.sh — Copy Power Platform skills into a project's .claude/ directory.
# Usage: ./inject-project.sh /path/to/your-project
#
# Use this when you want the skills committed to the project repo
# (e.g., for team sharing) instead of global symlinks.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILLS_SRC="$SCRIPT_DIR/.claude/skills"
CLAUDE_MD_SRC="$SCRIPT_DIR/CLAUDE.md"

if [ $# -lt 1 ]; then
    echo "Usage: $0 /path/to/project"
    exit 1
fi

PROJECT_DIR="$1"

if [ ! -d "$PROJECT_DIR" ]; then
    echo "Error: $PROJECT_DIR does not exist"
    exit 1
fi

PROJECT_SKILLS="$PROJECT_DIR/.claude/skills"
mkdir -p "$PROJECT_SKILLS"

echo "Injecting Power Platform skills into $PROJECT_DIR..."

# Copy skills
count=0
for skill_dir in "$SKILLS_SRC"/*/; do
    skill_name="$(basename "$skill_dir")"
    cp -r "$skill_dir" "$PROJECT_SKILLS/$skill_name"
    count=$((count + 1))
done

# Copy CLAUDE.md if no project CLAUDE.md exists
if [ ! -f "$PROJECT_DIR/CLAUDE.md" ]; then
    cp "$CLAUDE_MD_SRC" "$PROJECT_DIR/CLAUDE.md"
    echo "  [COPIED] CLAUDE.md"
else
    echo "  [SKIPPED] CLAUDE.md (already exists in project)"
fi

# Copy settings.json if no project settings exist
if [ ! -f "$PROJECT_DIR/.claude/settings.json" ]; then
    cp "$SCRIPT_DIR/.claude/settings.json" "$PROJECT_DIR/.claude/settings.json"
    echo "  [COPIED] .claude/settings.json"
fi

echo ""
echo "✓ Injected $count skills into $PROJECT_SKILLS"
echo "  These are copies — changes here won't update the source repo."
echo "  To update: re-run this script."
