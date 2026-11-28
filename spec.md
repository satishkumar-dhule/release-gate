# SPEC.md — Universal Edge & Cloud Release Gate Specification

> **Living Specification**: Keep this document synchronized whenever domain models, UI screens, routing rules, or MCP tools change.

---

## 1. Core Mental Model: Properties, Self-Contained Environments & Any-2-Env Diffing

### 1.1 No Separate "Mode" or "Stage" Concept
Earlier iterations separated **Environment** (`prod`, `uat1`), **Tier/Network** (`Staging` vs `Prod`), and **Comparison Mode / Topology** (`Akamai Edge`, `AWS Header`, `Different URL`, `Prod vs Prod`). That triple layer created redundant UI controls and conceptual friction.

In the unified model:
1. **A Property (Site)** (e.g., `www`, `help`, `trailhead`, `appexchange`, `developer`, `events`, etc.) owns:
   - A list of **Checks** (`CheckItem`: HTTP/Playwright synthetic checks with assertions and multi-step flows).
   - A list of **Self-Contained Environments** (`PropertyEnvironmentTarget` / `EnvironmentConfig`).
2. **An Environment is Self-Contained**:
   - Every environment already encapsulates **how traffic reaches it**:
     - `baseUrl`: Target URL or canonical host mapping (e.g., `https://www.salesforce.com` or `https://www-uat1.salesforce.com`).
     - `edgeHost`: Optional Edge DNS / `--resolve` override (e.g., `www.salesforce.com.edgekey.net`, `www.salesforce.com.edgesuite-staging.net`, or `d2sfdc-prod.cloudfront.net`).
     - `customHeaders`: Optional request headers injected into synthetic probes (e.g., `aws-cf-cd-staging: true; x-canary-stage: candidate` or `Pragma: akamai-x-cache-on, akamai-x-get-cache-key`).
   - Because each environment decides its own routing mechanism internally, **"Mode" is not a separate selector** and **"Stage" is not a separate sub-concept**.
   - **Strict 1:1 Environment Parity (`3. Configure` ↔ `2. Compare`)**:
     - `getPropertyEnvironmentTargets()` derives the selectable environment list strictly 1:1 from `app.envs` (the exact environments configured in `3. Configure → 2. Environments`).
     - If a property has 2 environments configured in `3. Configure → 2. Environments` (`PROD` and `UAT`), `2. Compare` displays those exact 2 environments (`Manage Envs (2) →`).
     - When an environment is added (via the 1-Click Environment Templates or custom form), edited, or deleted in `3. Configure → 2. Environments`, the `Env A` and `Env B` selectors in `2. Compare` immediately reflect the exact same list and count.
3. **Any-2-Environment Diff Gate (`Env A` vs `Env B`)**:
   - Comparing environments is simply choosing **`Env A`** (Candidate) and **`Env B`** (Baseline) from the property's environment list and clicking **Run Diff** (or `⇄` to swap `Env A` and `Env B`).
   - This uniformly supports `Prod vs Stage`, `Prod vs Prod (AWS vs Akamai)`, `UAT vs Prod`, `Green vs Blue`, or any custom pair without mode switches.

---

## 2. Five-Screen Application Architecture

The left-rail navigation (`TopBar.tsx`) exposes 5 primary workspaces with immediate tooltip dismissal on click and clean active indicators:

| # | Screen | Primary Component | Responsibility |
| :- | :--- | :--- | :--- |
| **1** | **1. Sites** | `SyntheticsOrchestratorView.tsx` | Fleet matrix of all properties (14 default Salesforce properties + user properties), GO/NO-GO release posture, check matrix, AWS CloudWatch Synthetics canary inventory, global Edge PoP selector, 2-step inline property deletion (`Delete?` / `Cancel`), and **Restore 14 Default Sites** recovery. |
| **2** | **2. Compare** | `WorkbenchToolbar.tsx` + `CheckListPane.tsx` + `EvidenceInspectorPane.tsx` | Switch between **Compare 2 Envs** and **Single Run** view, select **Env A** and **Env B** or any **Global Edge PoP** directly in the top bar, swap (`⇄`), and inspect per-check evidence across **Headers**, **Cookies**, **Visual** (Side-by-Side, Wipe Slider, Diff Box, or Single Run full capture), and **Flow**. |
| **3** | **3. Configure** | `SetupView.tsx` + `ConfigHubView.tsx` | Manage sites, checks, self-contained environments (URL + Edge Host + Headers without redundant Stage/Prod checkboxes), 3-Dim comparison rules, plugin registry, and AWS IaC / Terraform blueprints. Includes **Production Deployment Simulation** (`Simulate 50 Properties`, `Scale to 64 Checks`). |
| **4** | **4. Automate** | `McpStudioView.tsx` | Interactive MCP JSON-RPC 2.0 & REST API Explorer with 100% UI-to-MCP parity across 20 tools, 11 resources, and 6 prompts. |
| **5** | **5. About** | `AboutSlidesView.tsx` + `aboutSlidesModel.ts` | Interactive 6-slide presentation deck & storyboard explaining internal workings (Edge PoP routing, `hostMap` normalization, 3-Dim Gate Engine, `0.1%` cost-gated Bedrock Nova Lite Visual AI), 3 simple 60-second user journeys, and 1-click live feature launchers. |

---

## 3. Three-Dimensional Release Gate & Visual AI Judge

Implemented in `/src/engine/rules.ts` and rendered in `/src/components/EvidenceInspectorPane.tsx`:

1. **Functional HTTP Headers & Redirect Parity**:
   - Evaluates status code match (`200/200`, `301/301`) and critical CDN/security headers (`cache-control`, `content-security-policy`, `strict-transport-security`, `x-Cache-Key`, `x-amz-cf-pop`).
   - Normalizes environment-specific hostnames via `hostMap` when comparing `Location` redirect headers across different-URL environments.
   - Supports per-header **Accept Diff** (`✓ Accept` / `Accepted`) to baseline expected infrastructural variances.
2. **Set-Cookie Parity**:
   - Compares cookie presence, `Secure`, `HttpOnly`, `SameSite`, domain, and TTL parity between `Env A` and `Env B`.
   - Supports per-cookie **Accept Diff**.
3. **Visual UI Diff & Cost-Gated Bedrock Nova Lite Judge**:
   - **0.1% Cost Gate**: Pixel diffs below `0.1%` short-circuit at `$0` AI cost.
   - **Clean Visual Canvas**:
     - No redundant pill bar above the screenshots and no AI validation table below the screenshots.
     - Diff bounding boxes are highlighted directly on the `Env A` and `Env B` screenshots.
     - Hovering any diff bounding box reveals a floating caption popover with the AI/structural observation (`Env A` vs `Env B`) and an inline **Accept Region** button.
4. **Zero-Secret Reproducibility (`cURL`)**:
   - Generates `curl --resolve` commands for both `Env A` and `Env B` with all sensitive headers (`Authorization`, `Cookie`, `x-api-key`) stripped.

---

## 4. Cascading Property Lifecycle & Full MCP Parity

- **Cascading Property Deletion (`deletePropertyRecord` in `server.ts`)**:
  - Deleting a property via UI (`1. Sites` or `3. Configure`) or MCP (`delete_property`) atomically purges the property from runtime config, deletes all associated synthetic run records (`staging` and `prod` / `Env A` and `Env B`), clears active-run pointers, removes per-property check overrides, and persists `.runtime-catchpoint-config.json`.
- **1-Click Fleet Recovery (`POST /api/v1/properties/restore-defaults`)**:
  - Restores all 14 default Salesforce properties and re-seeds synthetic baseline runs at any time.

---

## 5. Real-Time Execution Streaming & Location Visibility

Every test or canary run must explicitly show **where** the execution is happening and stream progress in real time:
1. **Canary Run (`Run` / `Run Now` in `1. Sites`)**:
   - Auto-opens/focuses the **Canary Inspector Drawer** on the `Checks` tab and renders the **Live Canary Execution Monitor** (`data-testid="canary-live-run-monitor"`) plus a top-level **Live Execution & Location Strip** (`data-testid="sites-live-execution-strip"`).
   - Displays **Where**: Canary Name (`ak-www-prod-stg`), Target (`www.prod.staging`), Edge IP & PoP (`23.48.201.18 (IAD-89)`), Canonical Host (`https://www.salesforce.com`), and Run Key.
   - Streams check-by-check progress in real time (`Queued` → `1/3 HTTP Probe…` → `2/3 DOM Capture…` → `✓ Ran HH:MM:SS`) with an active check row highlight and progress bar.
   - Retains the completion card after finishing with 1-click navigation to **`Open Run in 2. Compare →`** and **`View in History`**.
2. **Compare Run (`Run Diff` / `Re-run` in `2. Compare`)**:
   - Displays a persistent live execution banner (`data-testid="compare-live-run-banner"`) showing **Where** (`Env A ↔ Env B` and paired AWS Synthetics canaries), live check progress, per-check streaming badges in `CheckListPane.tsx`, and post-run completion state.

---

## 6. Full Single Run View (`Single Run` vs `Compare 2 Envs`)

1. **Direct Navigation to Single Run View from `1. Sites` (`SyntheticsOrchestratorView.tsx`)**:
   - Clicking `Single Run` on any AWS Canary row, `View Single Run` in the Canary Inspector Drawer toolbar, `View Single Run →` in the Live Execution Monitor or History tab, or clicking any check row inside the Canary Inspector Drawer opens the workbench directly in **Single Run View** (`compareMode = 'single'`) bound to that exact `targetId` and `runKey`.
2. **First-Class Mode Switcher & Single Run Controls (`WorkbenchToolbar.tsx`)**:
   - Row 1 exposes a primary **`Compare 2 Envs` | `Single Run`** mode toggle (`data-testid="workbench-mode-toggle"`).
   - In `Single Run` mode, Row 1 displays a `SINGLE RUN · X/Y PASS` badge, active run label, a single **Env** selector (`data-testid="select-single-env"`), a **Run** snapshot selector (`data-testid="select-single-run-key"`), and a **`Run Single Env`** button (`data-testid="btn-run-single-env"`).
   - Row 2 renders `data-testid="single-run-topology-strip"` with environment URL, Edge DNS/Headers, active Run ID, AWS Synthetics Canary name, and a **`Compare vs Another Env →`** button.
3. **Single Run Queue & Evidence Inspector (`CheckListPane.tsx` & `EvidenceInspectorPane.tsx`)**:
   - `CheckListPane.tsx` displays per-check `PASS`/`FAIL` badges and captured header counts (`N hdr`) in Single Run mode.
   - `EvidenceInspectorPane.tsx` displays all captured headers (`All Captured (N)`), all captured cookies (`All Captured (N)`), and a dedicated full-width **Single Run DOM Capture** view (`data-testid="single-run-visual-view"`) with single-run HTTP/latency/assertion telemetry cards and full-width 1280×760 screenshot.

---

## 7. Global Edge PoP Selection & Execution (`GLOBAL_EXECUTION_POPS`)

Users can trigger runs from any specific global Edge Point of Presence (PoP) across all workspaces:
1. **9 Global Execution PoPs (`src/config/template.config.ts`)**:
   - `iad` (`IAD-89 · Ashburn, VA · us-east-1`), `sfo` (`SJC-51 · San Jose, CA · us-west-1`), `nrt` (`NRT-19 · Tokyo, JP · ap-northeast-1`), `sin` (`SIN-11 · Singapore, SG · ap-southeast-1`), `syd` (`SYD-06 · Sydney, AU · ap-southeast-2`), `fra` (`FRA-56 · Frankfurt, DE · eu-central-1`), `lhr` (`LHR-62 · London, UK · eu-west-2`), `ams` (`AMS-54 · Amsterdam, NL · eu-west-1`), and `gru` (`GRU-04 · São Paulo, BR · sa-east-1`), plus `auto` (Property Default PoP).
2. **First-Class PoP Selectors Everywhere Runs Are Triggered**:
   - **`1. Sites` Top Toolbar (`SyntheticsOrchestratorView.tsx`)**: Exposes `data-testid="sites-select-execution-pop"` right next to `Run All Sites`.
   - **Canary Inspector Drawer Action Bar (`SyntheticsOrchestratorView.tsx`)**: Exposes `data-testid="canary-drawer-select-pop"` right next to `Run Now`.
   - **`2. Compare` & `Single Run` Toolbar (`WorkbenchToolbar.tsx`)**: Exposes `data-testid="toolbar-select-execution-pop"` in Row 1 right next to `Run Diff` and `Run Single Env`, and displays the active PoP badge (`data-testid="topology-active-pop"`) in Row 2 and in `compare-live-run-banner`.
3. **End-to-End PoP Routing & Header Stamping (`server.ts` & `httpFlowProber.ts`)**:
   - `POST /api/v1/synthetics/canaries/:canaryName/start` and `POST /api/v1/synthetics/fan-out` accept `popId` and pass it into `executeLiveSalesforceRun({ ..., popId })`.
   - Each executed check and `RunRecord` stamps `executionPop` (`popId`, `popCode`, `city`, `country`, `awsRegion`, `stagingEdgeIp`, `prodEdgeIp`) and injects PoP-accurate edge response headers (`x-sfdc-edge-pop`, `x-akamai-edgescape`, `content-language`, `x-cache`, `x-cache-remote`).

---

## 8. Core Invariants & Verification Commands

1. **Single-Source-of-Truth Config**: Never hardcode hostnames or edge IPs inside React components; resolve through `src/config/template.config.ts` and `src/engine/targetRoutingModel.ts`.
2. **Zero-Secret Reproduction**: Never expose secrets in generated `curl` commands or webhook payloads.
3. **Cost-Gated Visual AI Judge**: Always keep Bedrock Nova Lite (`amazon.nova-lite-v1:0`) behind the `0.1%` pixel-diff gate.
4. **Verification Suite**:
   - Unit tests: `npx --yes tsx --test src/engine/rules.test.ts src/engine/mcpOperations.test.ts`
   - Type & Lint check: `compile_applet` + `lint_applet`


