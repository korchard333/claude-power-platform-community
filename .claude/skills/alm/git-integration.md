# Git Integration

Git integration for Power Platform covers three areas: native Git integration in the maker portal, the upcoming deploy-from-Git capability, and branch strategies tailored to Power Platform projects.

---

## Native Git Integration in Maker Portal

Dataverse environments can be connected directly to an Azure DevOps Git repository. When enabled, solution components are automatically committed to the repo as makers save changes in the portal.

### How It Works

1. An admin connects a Dataverse environment to an Azure DevOps repo and branch
2. Makers work in the portal as usual (edit forms, views, flows, etc.)
3. Changes are committed to the connected branch automatically or on-demand
4. Other environments can pull from the repo to stay in sync

### Configuration Steps

```
1. Power Platform Admin Center --> Environment --> Settings --> Git Integration
2. Select Azure DevOps organization and project
3. Select repository and branch
4. Authenticate with a service account (recommended) or personal account
5. Map the Dataverse solution to a folder in the repo
6. Enable sync direction: environment-to-repo, repo-to-environment, or both
```

### Supported Components

- Tables (entities), columns, relationships
- Model-driven app modules
- Canvas apps (with limitations)
- Cloud flows
- Security roles
- Sitemaps
- Web resources

### Limitations

- **Azure DevOps and GitHub** — GitHub support for native Git integration is in preview (May 2026, Wave 1). Azure DevOps remains GA. When GitHub support reaches GA, both providers will be first-class options for native portal-to-repo sync.
- **Limited component types** — Not all solution components sync cleanly. Complex components (e.g., plugins, custom connectors) may require manual handling.
- **Single branch per environment** — Each environment maps to one branch. You cannot sync one environment to multiple branches simultaneously.
- **Merge conflicts require manual resolution** — Solution XML conflicts are notoriously difficult to merge. Automated merge is not provided.
- **Performance on large solutions** — Initial sync of solutions with hundreds of components can be slow.

### When to Use vs pac solution sync

| Factor | Native Git Integration | pac solution sync |
|---|---|---|
| Automation | Automatic commits on save | Manual command |
| Git provider | Azure DevOps (GA), GitHub (Preview) | Any Git provider |
| Developer control | Less (portal-driven) | More (CLI-driven, review before commit) |
| Component coverage | Limited set | Full solution export |
| Team workflow | Maker-first teams | Developer-first teams |
| Merge review | Commits happen automatically | Developer reviews diff before committing |

**Guidance:** Use native Git integration when your team is maker-heavy and lives in the portal. Use `pac solution sync` when developers need full control over what gets committed and when.

---

## Deploy from Git (2026 Wave 1)

> **Preview (Wave 1 2026):** Deploy from Git is now in preview (April 2026). PAC CLI supports `pac solution pack` for the new YAML solution format. Native deploy-from-Git is available in the Solutions experience.

A new capability allowing solutions to be deployed directly from a Git repository to a target Dataverse environment. This closes the loop on Git-based ALM without requiring a separate CI/CD pipeline to pack and import.

### How It Changes ALM Workflows

**Before (traditional CI/CD):**
```
Source control --> Pack solution --> Upload artifact --> Import to target
```

**With deploy from Git:**
```
Source control --> Deploy from Git (direct)
```

The platform reads the solution source files from the Git repo, packs them server-side, and imports to the target environment. No build step required on your end.

### Expected Configuration

```
1. Connect target environment to a Git repo (Azure DevOps initially)
2. Select the branch and folder containing unpacked solution source
3. Trigger deployment manually or configure automatic deployment on branch update
4. Platform packs and imports the solution as managed
```

### Impact on CI/CD Pipelines

- **Simplifies pipelines** — Removes the pack-and-import steps from GitHub Actions or Azure DevOps pipelines
- **Does not replace all CI/CD** — You still need pipelines for solution checker, automated testing, approval gates, and multi-solution orchestration
- **Complements Power Platform Pipelines** — Can be used alongside in-product pipelines for Git-aware deployments
- **Branch-based promotion** — Merging to a `release` branch can trigger deployment, aligning with standard Git workflows
- **YAML solution format** — PAC CLI now supports packing solutions in YAML format. This lighter-weight format produces smaller, more readable diffs than XML and is designed for deploy-from-Git scenarios.
- **Source control as single source of truth** — With deploy-from-Git, environments become disposable. The Git repo is the authoritative representation of the solution. Spin up environments on demand and deploy from the repo.

### Practical Considerations

- Early capability; expect rough edges in the first release
- Monitor Microsoft Learn and release notes for GA status and supported scenarios
- Plan for fallback to traditional CI/CD if deploy-from-Git does not cover your component types
- Test with a non-critical solution before adopting for production workloads

---

## Branch Strategies for Power Platform

Power Platform solution source (XML, JSON, .msapp files) has unique characteristics that affect branch strategy. Solution XML is verbose, auto-generated, and difficult to merge by hand.

### Feature Branch Workflow

The most common pattern for Power Platform teams:

```
main                     <-- Production-ready, protected branch
  |
  +-- release/v1.x       <-- Release candidate, deploys to Test --> UAT --> Prod
  |     |
  |     +-- feature/PP-123-add-priority-field
  |     +-- feature/PP-124-update-order-form
  |
  +-- release/v2.0       <-- Next major version
```

**Rules:**
- `main` is always deployable. Protected with required PR reviews.
- `release/*` branches cut from `main` when a release is planned.
- `feature/*` branches cut from the relevant `release` branch.
- Merge feature branches back via PR with at least one reviewer.
- Delete feature branches after merge.

### Handling Merge Conflicts in Solution XML

Solution XML merge conflicts are the most painful aspect of Power Platform source control. Common conflict sources:

1. **Form XML** — Two developers edit the same form; XML element ordering changes unpredictably.
2. **GUID references** — Components reference each other by GUID; merging can create broken references.
3. **Canvas app .msapp files** — Binary format prior to unpacking; not mergeable without `--processCanvasApps`.
4. **Solution.xml version** — Both branches increment the version number.

**Mitigation strategies:**
- **One solution owner per sprint** — Reduce concurrent edits to the same solution.
- **Segment solutions** — Split large solutions so teams do not overlap. Shared tables go in a base solution; team-specific apps go in separate solutions.
- **Sync frequently** — Run `pac solution sync` and merge daily, not weekly. Smaller diffs are easier to resolve.
- **Use `--processCanvasApps true`** on unpack so canvas apps are stored as mergeable YAML/JSON instead of binary .msapp.
- **Accept "theirs" for auto-generated XML** — For files like `Solution.xml` or `AppModuleSiteMap.xml`, often the latest version is correct. Use `git checkout --theirs <file>` judiciously.

### Gitflow vs Trunk-Based for Power Platform

| Approach | Pros | Cons | When to Use |
|---|---|---|---|
| **Gitflow** (feature + release branches) | Clear release process, supports hotfixes, maps to environment promotion | More branches to manage, merge conflicts accumulate | Teams with scheduled releases, multiple environments, formal promotion |
| **Trunk-based** (short-lived branches, merge to main frequently) | Fewer merge conflicts, simpler process | Requires discipline, less isolation between changes | Small teams (1-3 devs), continuous deployment, single active release |

**Recommendation for most Power Platform teams:** Use Gitflow. Power Platform's environment-based promotion (Dev --> Test --> Prod) maps naturally to release branches. Trunk-based works for small teams but breaks down when multiple makers are editing in the portal concurrently.

### Branch Naming Conventions

```
feature/PP-123-short-description     # Feature work tied to a work item
bugfix/PP-456-fix-form-validation    # Bug fix
hotfix/PP-789-prod-flow-failure      # Production emergency fix
release/v1.2                         # Release candidate
```

- Prefix with work item ID for traceability.
- Keep descriptions short (3-5 words, lowercase, hyphenated).
- Match the branch to the environment: `feature/*` deploys to Dev, `release/*` deploys to Test/UAT/Prod.

---

## Anti-Patterns

- **Committing .msapp binary files** — Always unpack with `--processCanvasApps true`. Binary files cannot be diffed or merged.
- **Using `main` as the Dev environment sync target** — Sync to a feature or development branch. Protect `main` from unreviewed changes.
- **One giant solution for the whole organization** — Leads to constant merge conflicts and deployment bottlenecks. Segment by team or functional area.
- **Ignoring solution XML diffs in PRs** — Auto-generated XML changes can hide real issues. At minimum, scan for unexpected component additions or removals.
- **Relying solely on native Git integration without reviewing commits** — Automatic commits can include unfinished work. Pair with PR reviews before promoting.
- **No branch protection on `main`** — Without required reviews, accidental pushes to `main` can reach production via automated pipelines.

---

## Azure DevOps Boards Integration

When your project uses Azure DevOps Boards for work tracking, connect the dots from requirement to deployment for full traceability.

### Work Item Linking

Link solution components to ADO work items for end-to-end traceability:

```
Requirement (Epic/Feature) --> Work Item (User Story/Task) --> Commit --> PR --> Solution Component --> Deployment
```

Every commit message should reference a work item ID using the `AB#` syntax:

```bash
git commit -m "AB#1234 Add project status column to contoso_project table"
```

ADO automatically links the commit to work item 1234. This linking carries through to PRs and build results.

### Branch Naming Linked to Work Items

Use work item IDs in branch names for automatic linking:

```
feature/AB#1234-add-project-table
bugfix/AB#5678-fix-approval-flow
hotfix/AB#9012-prod-form-error
```

When a PR is created from a branch containing `AB#<id>`, ADO automatically links the PR to that work item.

### Pull Request Policies

Configure branch policies to enforce quality and traceability:

```
ADO Project --> Repos --> Branches --> [branch] --> Branch Policies

Recommended policies:
  - Require a minimum number of reviewers: 1 (2 for release branches)
  - Check for linked work items: Required
  - Build validation: PR validation pipeline (Solution Checker)
  - Comment resolution: Required
  - Merge strategy: Squash merge (keeps history clean for solution XML)
```

### Process Template Recommendations

Use the **Agile** process template. Add custom fields for Power Platform-specific tracking:

| Field | Type | Purpose |
|---|---|---|
| Solution Name | String | Which Power Platform solution this work item belongs to |
| Component Type | Picklist (Table, Flow, App, Plugin, etc.) | What type of component is being built/modified |
| Target Environment | Picklist (Dev, Test, UAT, Prod) | Current deployment target for this work item |

Create a custom query to track solution readiness:

```
Work Items where:
  - Solution Name = "MySolution"
  - State = "Resolved" or "Closed"
  - Sprint = @CurrentIteration
```

This gives a per-sprint view of which components are ready for promotion.
