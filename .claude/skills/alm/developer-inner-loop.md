# Developer Inner Loop

Three distinct development loops exist for Power Platform. Each serves a different scenario. Choosing the wrong loop wastes time and creates unnecessary friction.

---

## Loop 1: Web API Direct (Schema Creation)

Build Dataverse schema programmatically via HTTP calls against the Web API. Components land in a solution in real-time when you include the `MSCRM.SolutionUniqueName` header.

### Workflow

```bash
# 1. Authenticate via Azure CLI
az login
ACCESS_TOKEN=$(az account get-access-token --resource "https://yourorg.crm.dynamics.com" --query accessToken -o tsv)

# 2. Create publisher
curl -X POST "$ENV_URL/api/data/v9.2/publishers" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"uniquename":"contoso","friendlyname":"Contoso","customizationprefix":"cont"}'

# 3. Create solution
curl -X POST "$ENV_URL/api/data/v9.2/solutions" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"uniquename":"ContosoCore","friendlyname":"Contoso Core","version":"1.0.0.0","publisherid@odata.bind":"/publishers(guid)"}'

# 4. Build schema — tables, columns, relationships, views, forms, app
#    Include MSCRM.SolutionUniqueName header so components land in the solution
curl -X POST "$ENV_URL/api/data/v9.2/EntityDefinitions" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "MSCRM.SolutionUniqueName: ContosoCore" \
  -d '{"SchemaName":"cont_Project","DisplayName":{"@odata.type":"Microsoft.Dynamics.CRM.Label","LocalizedLabels":[{"Label":"Project","LanguageCode":1033}]},"HasActivities":false,"HasNotes":false}'

# 5. Publish customizations
curl -X POST "$ENV_URL/api/data/v9.2/PublishAllXml"

# 6. Verify in maker portal
```

### Dependency Ordering

Build schema in this order to avoid dependency errors:

1. Tables (EntityDefinitions)
2. Columns (AttributeDefinitions)
3. Relationships (OneToMany, ManyToMany)
4. Option sets (global, then local)
5. Views (SavedQuery)
6. Forms (SystemForm)
7. Model-driven app (AppModule)

### Best For

- New schema creation and greenfield builds
- Bulk schema changes (10+ tables) — scriptable and parallelizable
- Repeatable environment setup (run the same script against any environment)
- Scenarios where you need full programmatic control over dependency ordering

---

## Loop 2: pac code push (Code Apps)

Standard React/TypeScript local development with deployment to Power Platform via the PAC CLI.

### Workflow

```bash
# 1. Local development
cd my-code-app
npm install
npm run dev                    # http://localhost:5173 — standard Vite HMR

# 2. Make changes, test locally in browser
#    Use mock data or connect to Dataverse via pac code add-data-source

# 3. Build and push to environment
npm run build
pac code push                                     # Uses current auth profile
pac code push --solutionName "ContosoCodeApp"     # Named solution
```

### How It Works

- `pac code push` packages the built web app into a Dataverse solution component
- The component is automatically added to the specified solution (or a default one)
- The solution can then be promoted via Power Platform Pipelines or CI/CD
- Each push overwrites the previous version in the target environment

### Best For

- Code App iterative development
- Standard front-end workflow (React, TypeScript, Vite)
- Developers who want localhost hot-reload before deploying

---

## Loop 3: pac solution sync (Existing Solutions)

Sync changes made in the Dataverse environment UI back to your local source control. This is the primary loop for ongoing maintenance and maker-led changes.

### Workflow

```bash
# 1. Maker makes changes in Dev environment UI
#    (adds a column, modifies a form, updates a view)

# 2. Developer syncs changes back to local project
pac solution sync

# 3. Review the diff
git diff src/MySolution/

# 4. Commit and push
git add src/MySolution/
git commit -m "feat: add priority field to order table"
git push origin feature/PP-456-priority-field
```

### Key Behaviors

- Pulls the current state of the solution from the connected environment
- Unpacks solution XML into the local folder structure
- Overwrites local files with environment state — review diffs carefully
- Does not handle merge conflicts; that is a Git responsibility

### Best For

- Ongoing maintenance of existing solutions
- Capturing maker-led changes into source control
- Keeping source control current after portal-based edits
- Teams where makers and developers collaborate on the same solution

---

## When to Use Which

| Scenario | Loop | Why |
|---|---|---|
| New tables/columns/relationships | Web API Direct | Full programmatic control, dependency ordering |
| Code App development | pac code push | Standard React dev + deploy workflow |
| Maker changed a form in the UI | pac solution sync | Captures UI changes to source control |
| Adding a new flow | Either pac solution sync or portal | Flows are easier to build in the portal |
| Bulk schema changes (10+ tables) | Web API Direct | Scriptable, parallelizable, consistent |
| Quick column addition to existing table | Web API Direct or portal + sync | Depends on whether you want script repeatability |
| Prototyping a new app layout | Portal + pac solution sync | Faster to drag-and-drop, then sync |

---

## Anti-Patterns

- **Using pac solution sync as a backup tool** — It is a sync mechanism, not a backup. If you need backups, export full solution zips.
- **Skipping the diff review after sync** — Always run `git diff` after `pac solution sync`. Blind commits introduce unintended changes (e.g., GUIDs shifting, form XML reordering).
- **Mixing loops without coordination** — If one developer uses Web API Direct while another uses pac solution sync on the same solution, changes can overwrite each other. Coordinate which loop the team uses for each task.
- **Running pac solution sync against a shared Dev environment without communicating** — Multiple makers editing the same solution means your sync may pull in someone else's half-finished work.
- **Forgetting to publish before syncing** — Unpublished customizations in the environment will not appear in `pac solution sync` output. Always publish first.

---

## Practical Tips

1. **Script your Web API calls** — Store them in a `/scripts` folder in your repo. This makes environment setup repeatable and reviewable in PR.
2. **Use a .env file for Web API scripts** — Store `ENV_URL` and other config outside the script. Never commit tokens.
3. **Run pac solution sync with `--async`** for large solutions to avoid timeouts.
4. **Tag your sync commits** — Use a consistent commit prefix (e.g., `sync:`) so you can filter sync commits from feature commits in Git history.
5. **Combine loops in a single sprint** — It is normal to use Web API Direct for new schema on Monday, pac code push for the app on Wednesday, and pac solution sync on Friday to capture portal tweaks. The loops are complementary, not exclusive.
