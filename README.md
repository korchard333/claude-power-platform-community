# Claude Code Power Platform

A community-maintained set of **Claude Code skills** for Microsoft Power Platform development.

## Why This Exists

AI coding assistants are powerful, but they lack deep knowledge of Power Platform — its APIs, patterns, gotchas, and best practices. These skills fill that gap. Install them once and Claude Code becomes a Power Platform expert that knows how to build Code Apps, design Dataverse schemas, write Web API calls, configure security models, set up CI/CD pipelines, and more — all following enterprise patterns that actually work in production.

**Built from real project experience**, not just documentation summaries. Every pattern, rule, and anti-pattern comes from building and shipping Power Platform solutions.

## Who It's For

- **Power Platform developers** who use Claude Code and want better AI-assisted builds
- **Teams** who want consistent standards across their Claude Code sessions
- **Solo builders** who want an opinionated guide on how to do things properly
- **Anyone curious** about structuring AI skills for a complex platform

## What's Included

| Category | Count | Description |
|---|---|---|
| **Agent Skills** | 6 | Specialized personas: Project Manager, Solutions Architect, Platform Builder, Code Reviewer, DevOps Engineer, UAT Coordinator |
| **Domain Skills** | 33 | Deep reference material for every Power Platform technology (23 use router pattern with sub-files) |
| **Instructions** | 1 | `CLAUDE.md` — non-negotiable standards loaded into every session |
| **Eval Scenarios** | 36 | JSON test cases across 22 skills for behavioral validation |
| **Samples** | 4 areas | Code Apps (React), MDA custom pages, PCF controls, plugins |
| **CI/CD** | 3 | Markdown lint, consistency checks, eval schema validation |

## Quick Start

### Global Install (recommended)

```bash
git clone https://github.com/korchard333/claude-power-platform-community.git ~/claude-power-platform
cd ~/claude-power-platform
chmod +x install.sh && ./install.sh
```

Skills are symlinked — edit here, changes propagate instantly.

### Per-Project Install

```bash
./inject-project.sh /path/to/your-project
```

Copies skills into the project's `.claude/` for team sharing via git.

## The Agent Team

| Skill | Name | Role |
|---|---|---|
| `/project-manager` | Laura | Requirements, planning, orchestration, Definition of Done |
| `/solutions-architect` | Sean | Architecture, data models, ALM strategy, app type selection |
| `/platform-builder` | Scott | Builds everything — Code Apps, Canvas, MDA, flows, PCF, plugins |
| `/code-reviewer` | Razor | Quality reviews with severity-rated findings (S1-S4) |
| `/devops-engineer` | Parvez | Environments, CI/CD, service principals, governance |
| `/uat-coordinator` | Ava | UAT scripts, test cycles, defect tracking, sign-off |

### Usage

Invoke any agent skill directly:

```
/project-manager — Plan a new feature
/solutions-architect — Design the data model
/platform-builder — Build the contact list component
/code-reviewer — Review this Code App
/devops-engineer — Set up the CI/CD pipeline
/uat-coordinator — Generate UAT scripts
```

Or use `/power-platform-team` to let the orchestrator determine which agent to activate.

## Domain Skills (33)

### App Development
`code-apps` | `canvas-apps` | `model-driven-apps` | `pcf` | `web-resources`

### Data Platform
`dataverse` | `dataverse-web-api` | `dataverse-mcp` | `data-migration`

### Security & Architecture
`security` | `architecture` | `governance` | `licensing`

### Automation & Integration
`power-automate` | `custom-connectors` | `integration-patterns` | `m365-integration`

### Quality & Deployment
`testing` | `test-engine` | `alm` | `accessibility-ux`

### Platform & Operations
`env-strategy` | `observability` | `perf-optimise`

### AI & Cognitive
`azure-openai` | `copilot-studio` | `ai-builder`

### Specialized
`plugins` | `power-bi` | `power-pages` | `business-process-flows` | `dashboards` | `spec-driven-dev`

## File Locations

| File | Purpose |
|---|---|
| `CLAUDE.md` | Non-negotiable standards (auto-loaded by Claude Code) |
| `ORCHESTRATION.md` | Agent team coordination guide |
| `.claude/skills/` | All skills (agent + domain) |
| `.claude/settings.json` | MCP servers, permissions |
| `evals/` | Eval scenarios |
| `samples/` | Code samples |

## For Teams

```bash
# Inject into a project for sharing via git
./inject-project.sh /path/to/project

# The project now has .claude/skills/ and CLAUDE.md
# Commit and push — team members get the skills automatically
```

## Share What You Learn

Found a gotcha? Discovered the correct API pattern? Worked through a tricky build?

Head to [Discussions](https://github.com/korchard333/claude-power-platform-community/discussions) and share it. Learnings from real builds are how these skills get better.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on adding skills, evals, and agents.

## Acknowledgements

- [Daniel Kerridge](https://github.com/DanielKerridge/claude-code-power-platform-skills) — early Power Platform skills for Claude Code that inspired this project

## License

MIT — see [LICENSE](LICENSE)
