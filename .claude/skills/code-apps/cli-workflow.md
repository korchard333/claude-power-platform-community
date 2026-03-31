# Code Apps — CLI Workflow

## Current: pac code commands (stable, deprecation planned)

`pac code` commands remain fully supported today. Microsoft has announced these will be deprecated in a future release once the npm CLI reaches GA.

```bash
# Authenticate and select environment
pac auth create
pac env select --environment <Your environment ID>

# Scaffold new project
npx degit github:microsoft/PowerAppsCodeApps/templates/vite my-app
cd my-app && npm install

# Initialize for Power Platform
pac code init --displayname "My App"

# Add data sources (generates typed services in src/generated/)
pac code add-data-source -a dataverse -t contact
pac code add-data-source -a dataverse -t account
pac code add-data-source -c office365users     # Non-Dataverse connector

# Local dev
npm run dev

# Build + deploy
npm run build
pac code push                                  # To preferred solution
pac code push --solutionName "MySolution"      # To specific solution
```

### pac code — full command list

| Command | Description |
|---|---|
| `pac code init` | Initialize a code app in the current directory |
| `pac code push` | Publish a new version to Power Apps |
| `pac code add-data-source` | Add a connector data source (generates typed models) |
| `pac code delete-data-source` | Remove a data source |
| `pac code list` | List code apps in the current environment |
| `pac code list-connection-references` | List connection references in a solution |
| `pac code list-datasets` | List datasets for a connector |
| `pac code list-tables` | List tables for a connector and dataset |
| `pac code run` | Run a local server for connections loading locally |

## Preview: npm-based CLI (@microsoft/power-apps v1.0.4+)

> Last verified: March 2026. Status: **Preview**. Check [Microsoft Learn](https://learn.microsoft.com/power-apps/developer/code-apps/how-to/npm-quickstart) for current status.

Starting with `@microsoft/power-apps` v1.0.4, the client library includes an npm-based CLI that reduces prerequisites (no .NET / PAC CLI install needed). It handles authentication automatically via browser prompt.

```bash
# Scaffold new project (same template as PAC CLI workflow)
npx degit github:microsoft/PowerAppsCodeApps/templates/vite my-app
cd my-app && npm install

# Initialize — interactive mode (prompts for display name and environment)
npx power-apps init

# Initialize — non-interactive
npx power-apps init --displayName "My App" --environmentId <env-id>

# Local dev (same as PAC CLI workflow)
npm run dev

# Build + deploy
npm run build
npx power-apps push
```

### npm CLI command mapping

| npm CLI | PAC CLI equivalent | Notes |
|---|---|---|
| `npx power-apps init` | `pac code init` | npm CLI handles auth automatically |
| `npx power-apps run` | `pac code run` | Local connection server |
| `npx power-apps push` | `pac code push` | Publishes to environment |
| — (not yet available) | `pac code add-data-source` | Use PAC CLI for data source management |
| — (not yet available) | `pac code list` | Use PAC CLI for listing apps |

### Key differences from PAC CLI
- **No .NET prerequisite** — only Node.js required
- **Built-in auth** — authenticates via browser prompt, no `pac auth create` needed
- **Fewer commands** — only `init`, `run`, `push` available; data source management still requires PAC CLI

## CLI Decision Table

| Scenario | Recommended CLI | Why |
|---|---|---|
| New project (greenfield) | **npm CLI** | Becoming the standard path; fewer prerequisites, simpler auth |
| Existing project (PAC CLI) | PAC CLI | No migration needed, still supported |
| Adding data sources | PAC CLI | `pac code add-data-source` has no npm CLI equivalent yet |
| CI/CD pipelines | PAC CLI | Better integration with `pac auth` for service principal auth |
| Quick prototyping | **npm CLI** | Fewer prerequisites, automatic browser auth |
| Teaching / workshops | **npm CLI** | Simpler setup for new developers |

> **Recommendation:** Default to the npm CLI for new projects and developer workflows — it is on track to become the primary toolchain. Fall back to PAC CLI when you need data source management, CI/CD service principal auth, or other commands not yet available in the npm CLI.

---

## CLI Connector Discovery (Wave 1 2026)

> **Preview (May 2026), GA (July 2026):** New PAC CLI commands for discovering and wiring connectors from the command line.

New commands allow developers to discover available connectors and wire them into code apps without leaving the CLI. This also enables AI coding agents to generate apps that are already connected to data.

### agent.md for Prompt-to-App Workflows

A new `agent.md` file can be placed in your project root. It describes the app's intent, data sources, and UI requirements in natural language. AI tools (GitHub Copilot, Claude Code) read this file to generate scaffolding with data sources pre-wired.

**Impact on workflow:** The inner loop shifts from "scaffold → manually configure data sources → code" to "describe intent → AI generates scaffold with data sources pre-wired → review and iterate."
