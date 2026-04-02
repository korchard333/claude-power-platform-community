# Claude Code Power Platform

A work-in-progress set of **Claude Code skills** for Microsoft Power Platform development.

This is a collection of opinionated patterns, conventions, and prompts built up over time
working with Claude Code on Power Platform projects. Some of it has been tested in practice.
Some of it hasn't yet. Treat it as a foundation to adapt and build on — not something to
drop into a production project and trust blindly.

Use it at your own risk, with your own judgement. It's not claiming to be the right way
to do Power Platform, and it's definitely not production-ready out of the box. If something
doesn't fit your context, change it. If something looks wrong, it probably is — raise it
or fix it.

Contributions and corrections welcome.

## What's Included

| Category | Count | Description |
|---|---|---|
| **Agent Skills** | 6 | Specialized personas: Project Manager, Solutions Architect, Platform Builder, Code Reviewer, DevOps Engineer, UAT Coordinator |
| **Domain Skills** | 33 | Reference material for Power Platform technologies (23 use a router pattern with sub-files) |
| **Instructions** | 1 | `CLAUDE.md` — coding standards loaded into every session |
| **Eval Scenarios** | 36 | JSON test cases across 22 skills |
| **Samples** | 4 areas | Code Apps (React), MDA custom pages, PCF controls, plugins |
| **CI/CD** | 3 | Markdown lint, consistency checks, eval schema validation |

## Quick Start

### Global Install (recommended)

```bash
git clone <repo-url> ~/DEV/claude-power-platform
cd ~/DEV/claude-power-platform
chmod +x install.sh && ./install.sh
```

Skills are symlinked — edit here, changes propagate instantly.

### Per-Project Install

```bash
./inject-project.sh /path/to/your-project
```

Copies skills into the project's `.claude/` for team sharing via git.

## The Agent Team

Six personas, each with a defined role and scope. The idea is that different phases of
a project benefit from different "hats" — requirements, architecture, building, reviewing,
infrastructure, and testing. In practice you'll probably use a few more than others.

| Skill | Name | Role |
|---|---|---|
| `/project-manager` | Laura | Requirements, planning, orchestration |
| `/solutions-architect` | Sean | Architecture, data models, ALM strategy, app type selection |
| `/platform-builder` | Scott | Builds everything — Code Apps, Canvas, MDA, flows, PCF, plugins |
| `/code-reviewer` | Razor | Code and architecture review with severity-rated findings |
| `/devops-engineer` | Parvez | Environments, CI/CD, service principals |
| `/uat-coordinator` | Ava | UAT scripts, defect tracking, sign-off |

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

Or use `/power-platform-team` to let the orchestrator pick the right agent from context.

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
| `CLAUDE.md` | Coding standards (auto-loaded by Claude Code) |
| `ORCHESTRATION.md` | How the agent team coordinates |
| `.claude/skills/` | All skills (agent + domain) |
| `.claude/settings.json` | MCP servers, permissions |
| `evals/` | Eval scenarios |
| `samples/` | Code samples |

## For Teams

```bash
# Inject into a project for sharing via git
./inject-project.sh /path/to/project

# The project then has .claude/skills/ and CLAUDE.md
# Commit and push — team members get the skills on pull
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE)
