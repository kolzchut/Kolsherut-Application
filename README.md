# kolSherut-WIP

### FE

#### Installation and Setup For Local use.
1. Incase you got .tars for **FE** and **BE** load them using `docker load -i {fileName}` and then you can skip to step 4.
2. Make sure docker is installed and running on your machine.
3. In both **FE** and **BE** folders run:
    ```bash
    npm run docker:build
    ```
4. Make sure all the environment variables in the `docker-compose.yml` file are set correctly
5. Make sure all the configuration files are set correctly.
6. Run in the main folder:
    ```bash
    docker compose up -d
    ```
* Be aware, frontend running on port 4000 and backend on port 5000 (BE port can be set via environment variable PORT).

#### Building tar files for FE and BE:
1. Make sure docker is installed and running on your machine.
2. In **BE** folder run:
```bash
npm run tar
```
3. In **FE** folder, you need to decide which environment you want to build for, and then run one of the following commands:
```bash
npm run tar:{enviornment}
```

---
   
#### Configuration Files

All configuration files are located in the `config` folder inside the `public` folder of the **FE**.

These files control app behavior, appearance, and content.


##### 1. `config.json`
**Purpose:** Global settings like redirects, routes, maps, and search configuration.  
**Structure:** JSON object with clearly named keys.

**How to maintain:**
- Use existing key patterns for new routes/settings.
- For values that should be replaced dynamically, use `%%MACRO%%`.


##### 2. `strings.json`
**Purpose:** Central source for UI text (labels, placeholders, messages, tooltips, etc.).  
**Structure:** Flat JSON with `key → value` pairs.

**How to maintain:**
- Add new strings as new key-value pairs.
- Use descriptive, consistent keys.
- Avoid hardcoding strings directly in the UI.


##### 3. `responseColors.json`
**Purpose:** Configures response colors used for tags and map points.  
**Structure:** Contains two properties:
- `responses` → maps `responseId → colorName`.
- `colors` → maps `colorName → { background, font }`.

**How to maintain:**
- Add new response IDs under `responses`.
- Ensure each referenced `colorName` has a matching entry in `colors`.


##### 4. `filters.json`
**Purpose:** Defines all filters used in the app.  
**Structure:**
- **Responses:** simple `key = response ID`, `value = display string`.
- **Situations:** structured inside `situationMap`.
    - Key = group identifier.
    - Value = array of situations belonging to that group.
    - Each group also has a title with both its identifier and display name.

**How to maintain:**
- Add new filters to the appropriate group.
- Keep identifiers unique and consistent.


##### 5. `homepage.json`
**Purpose:** Controls homepage search options.  
**Structure:** Divided into groups. Each group includes:
- `group` (identifier)
- `situation_id`
- `group_link` (for navigation)
- `labels` (array of display options)
  - `response_id` : response backend filter
  - `situation_id` : situation backend filter
  - `title` : text displayed
  - `query` : search query string, make sure you write with underscore

**How to maintain:**
- Add a new group for new homepage sections.
- Make sure `labels` point to valid `situation_id` and `response_id` values.


##### 6. `linksBelow.json`
**Purpose:** Defines footer links.  
**Structure:** Array of objects with:
- `title` (text displayed)
- Either `modal` (if opens a modal) or `url` (if links externally).

**How to maintain:**
- Add/remove entries by appending objects.
- Only use one of `modal` or `url` in each entry.


##### 7. `metaTags.json`
**Purpose:** Controls page-specific meta tags for SEO and sharing.  
**Structure:** Object per page, each containing meta fields (e.g. `title`, `description`, `og:image`).  
**Special feature:** Supports dynamic macros like `%%serviceDescription%%`.

**How to maintain:**
- Add a new object for new pages.
- Use macros when fields should be dynamically replaced.


##### 8. `modules.json`
**Purpose:** Defines the modules used in the **AddService modal**.  
**Structure:** Array of objects (each representing a module).

**How to maintain:**
- Add a new module as a new object with fields like `title`, `description`, and optional `links`.

#### 9. `Presets.json`
**Purpose** Defines the default Search options.
**Structure:** Array of objects (each representing a preset).

**How to maintain:**
- Make sure you always have label and query, the rest of the fields are optional.

##### 10. `stage.json`, `production.json`, `local.json`
**Purpose:** Environment-specific configuration files.  
**Structure:** Identical across environments — only values differ.

**How to maintain:**
- Ensure all three contain the same keys.
- Never commit sensitive secrets.


##### 11. `environment.json`
**Purpose:** Determines which environment the app is currently running on.  
**Structure:** Simple object pointing to `stage`, `production`, or `local`.

**How to maintain:**
- Keep in sync with environment files.
- This is the single source of truth the frontend actually uses.


##### Best Practices for All Configs
- Always validate JSON before committing.
- Follow existing naming conventions.
- Test changes locally (`local.json`) before moving to staging or production.
- Use macros (`%%MACRO%%`) instead of hardcoding values when possible.

---
#### while using the Hasadna cloud we do not have the possibility to mount volumes and update the mounted files.
- using BE to emulate files and rerouting nginx.conf to use BE as a file server.

#### After Chnhaing cloud the folowing changes need to be made
1. move confings to seperate vpulems (dev, stage, prod) and have the relevant one mounted to the FE container.
1. site map have to be generated as part of ETL and mounted to all Environments.
1. upload from dev to stage and from stage to prod should be copying the previus level bucket.


### BE

The BE of this project is built with Typescript and Node.js, using the Express framework. It is designed to handle
requests from the frontend, process data, and interact with the database.

#### Environment Variables of BE:

| Variable                  | Description                                                               | Default               |
|---------------------------|---------------------------------------------------------------------------|-----------------------|
| ORIGIN                    | the front end origin for cors (Need to change default)                    | *                     |
| ENV                       | the environment you working on  (prod/stage/local)                        | local                 |
| PORT                      | the port for the back end                                                 | 5000                  |
| ELASTIC_URL               | the elastic search URL (Need to change default)                           | http://localhost:9200 |
| ELASTIC_USERNAME          | the elastic search username (Need to change default)                      | elastic               |
| ELASTIC_PASS              | the elastic search password (Need to change default)                      | your-password         |
| ELASTIC_RECONNECT_TIMEOUT | the time to wait before reconnecting to elastic search (seconds)          | 5                     |
| VERBOSE                   | Default to false, if true will log more information to the console        | false                 |
| LOG_TO_FILE               | Default to false, if true will log to file                                | false                 |
| LOG_DURATION              | The duration content of each file. (minutes)                              | 10                    |
| SEARCHCARDS_FIRST_LENGTH  | The amount of services it will pull initially from server in searchCards  | 50                    |
| AUTOCOMPLETE_MIN_SCORE    | Minimum final score required for autocomplete results (higher = stricter) | 5000                  |

### CI CD

Current automated behavior:
- Push to `main` updates **staging** (FE + BE independently, only if their folders changed).
- Creating a Git tag (and publishing a GitHub Release) triggers **production** build & deploy (again only for changed component paths).

---
## Deployment & Release Guide (For All Team Members)
Simple steps for staging (test) and production (live). No local build needed.

### 1. Staging Deployment (Automatic on push to main)
Use when: You want updated code on the staging environment.
Steps:
1. Ensure your feature branch was merged into `main` via a Pull Request (PR).
2. After merge, go to GitHub → Repository → “Actions” tab.
3. Look for workflows:
   - `FE CI (staging)` (runs if `FE/` changed)
   - `BE CI (staging)` (runs if `be/` changed)
4. Open the workflow run (top of the list) and watch the steps. A green check means success.
5. When finished, images are pushed to GHCR:
   - FE: `ghcr.io/kolzchut/kol-sherut-fe:latest` and `:<commit-sha>`
   - BE: `ghcr.io/kolzchut/kol-sherut-be:latest` and `:<commit-sha>`
6. Helm values in `srm-devops` repo are auto-updated for staging (values.auto-updated.yaml / etl/api & site).
7. Validate staging:
   - Open staging URL (internal) & sanity-check: homepage, search, card page.
   - Optional: Open browser dev tools → Network → confirm new commit SHA in `config.json` request (if exposed) or inspect page footer/build indicator if present.

If something is wrong: Fix code → new PR → merge → staging redeploys automatically.

### 2. Production Deployment (Manual via Release Tag)
Use when: You approve staging and want to publish to production.
Steps:
1. Confirm staging is healthy (basic flows OK, no blocking bugs).
2. Decide a new semantic version (e.g. `v1.3.0`). Do not reuse an existing tag.
3. GitHub → “Releases” → “Draft a new release”.
4. In “Tag version”: type the new tag (e.g. `v1.3.0`) and target branch = `main`.
5. Title: e.g. `Release v1.3.0`.
6. Description: bullet list of notable changes (copy from merged PR titles if needed).
7. Click “Publish release”.
8. This triggers:
   - `FE Release (production)` (if `FE/` changed at/just before the tag)
   - `BE Release (production)` (if `be/` changed)
9. Monitor under “Actions” like staging. Wait for green check.
10. Production images produced:
    - FE: `ghcr.io/kolzchut/kol-sherut-fe:<commit-sha>` and `:<tag>-<commit-sha>`
    - BE: `ghcr.io/kolzchut/kol-sherut-be:<commit-sha>` and `:<tag>-<commit-sha>`
11. Helm production values file (`values.auto-updated.production.yaml`) in `srm-devops` repo auto-updated to point to the `<tag>-<sha>` image.
12. Validate production: open site, run smoke checks (search, open card, any critical flows).

Rollback (simple):
- Create a new release with an older known-good tag name incremented (e.g. if `v1.3.0` bad, re-release code from earlier commit as `v1.3.1` pointing to stable commit). The workflow will publish new images and update Helm.
- OR (DevOps only) manually adjust image in production Helm values repo and deploy.

### 3. Quick Trigger Reference
| Action | Folder Changed? | Workflow | Environment | History Tag Examples |
|--------|-----------------|----------|-------------|------------------|
| Push to main | FE/ changed | FE CI (staging) | Staging | latest + <sha> |
| Push to main | be/ changed | BE CI (staging) | Staging | latest + <sha> |
| Tag (e.g. v1.2.0) | FE/ changed | FE Release (production) | Production | <sha>v1.2.0<sha> |
| Tag (e.g. v1.2.0) | be/ changed | BE Release (production) | Production | <sha>v1.2.0<sha> |

### 4. Versioning Rules
- Use `vMAJOR.MINOR.PATCH` (e.g. `v1.4.2`).
- Increment:
  - MAJOR: breaking changes
  - MINOR: new features (backward compatible)
  - PATCH: fixes / small changes
- Never reuse or delete tags.

### 5. What Gets Deployed
- Only components whose folders changed since last commit/tag run build & publish.
- Sitemaps are generated during FE workflows (stage vs production use environment variable `ENVIRONMENT`).

### 6. Common Questions
Q: I pushed to main, but no FE workflow?  
A: No changes under `FE/` → workflow won’t run. Same for `be/`.

Q: Release created but FE didn’t deploy?  
A: Tag commit had no FE changes relative to previous; only BE (or neither) deployed.

Q: Can I edit a release note after publishing?  
A: Yes. Editing text doesn’t redeploy. To redeploy you must create a new tag.

Q: How do I know which image is live?  
A: Check the updated `values.auto-updated*.yaml` in `srm-devops` repo (image field) or visiting argoCD.

### 7. Pre-Production Checklist
- [ ] All intended PRs merged to main
- [ ] Staging smoke tests pass
- [ ] Version chosen (unique tag)
- [ ] Release notes written
- [ ] No open critical issues

### 8. After Deployment Checklist
- [ ] Homepage loads
- [ ] Search returns results
- [ ] Card page loads
- [ ] (If changed) New sitemap served
- [ ] Analytics events visible (if applicable)


