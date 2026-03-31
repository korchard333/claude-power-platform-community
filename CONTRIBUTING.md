# Contributing

## Sharing Learnings

The easiest way to contribute is sharing what you find. If you tried a skill and hit a problem, discovered the correct API pattern, or found a gap, post it in [Discussions](https://github.com/korchard333/claude-power-platform-community/discussions). These findings get fed back into the skills.

No git knowledge required. Just write up what you found.

## Adding a Skill

1. Create `skills/{name}/SKILL.md` with frontmatter:

   ```yaml
   ---
   name: my-skill
   description: "When to trigger this skill..."
   ---
   ```

2. For router skills (index + sub-files), add topic files alongside `SKILL.md`
3. Sub-files: 150-400 lines, start with `# Title`, no frontmatter
4. Preview features: mark with `> **Preview (Wave 1 2026):**`
5. Verify against MS Learn docs for accuracy

## Adding Evals

1. Create `skills/{name}/evals/{scenario}.json`
2. Follow the schema:

   ```json
   {
     "skill_name": "my-skill",
     "evals": [
       {
         "id": 1,
         "prompt": "User message",
         "expected_output": "Narrative description",
         "expectations": ["Atomic assertion 1", "Atomic assertion 2"]
       }
     ]
   }
   ```

3. Include 2-4 scenarios per eval file
4. Cover happy path + edge cases

## Quality Checklist

Before submitting:

- [ ] Match existing tone and depth
- [ ] Verify skill counts: 39 total skills (6 agent + 33 domain)
- [ ] New sub-files: 150-400 lines
- [ ] Evals follow JSON schema
- [ ] Features verified against MS Learn docs

## Commit Messages

Format: `{area}: {what changed}`

Examples:

- `skills/governance: add DLP eval scenarios`
- `agent/code-reviewer: add Power BI review domain`
- `docs: update skill count in README`
