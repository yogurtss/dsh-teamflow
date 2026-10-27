English · [简体中文](./README_ZH.md)

# AgentTeams · Human-reviewed workflows

This is the [yogurtss/dsh-agent-teams](https://github.com/yogurtss/dsh-agent-teams) development fork of [NanmiCoder/dsh-agent-teams](https://github.com/NanmiCoder/dsh-agent-teams). Discuss a goal, form an initial team, then adjust member instructions, task handoffs and human checkpoints.

**Install this fork from GitHub or a local build.** Its package name remains `@nanmicoder/dsh-agent-teams` and its version remains `0.1.27`. These changes are not published to npm; the npm package installs upstream.

Click **团队与流程** at the top of the AgentTeams activity panel or team page to open the workbench. The button shows pending changes and human reviews; archived teams open read-only records.

## What this fork adds

| Feature | Behavior |
| --- | --- |
| Member summaries, roles and PE | Inspect responsibilities and execution instructions, edit directly or discuss changes in an isolated configuration conversation. |
| One editable workflow | Discuss an initial team, then adjust the canvas. No separate automatic/manual modes. A member can own multiple tasks. |
| Drag-to-connect handoffs | Snap to target nodes. Keep the graph visible while adding tasks/checkpoints, select upstream/downstream nodes and preview dashed links before applying. |
| Native DSH discussions | All model interaction uses the central native conversation. Configuration and review sessions stay isolated from execution. |
| Discussion context | Inspect saved prompts, requirements, submitted results and verification records beside the conversation. Missing information is labeled. |
| Human approval and rework | Discuss evidence with a dedicated reviewer, then approve or reject yourself. Rework creates new rounds and preserves earlier results. |
| Simple role portraits | Equal roles share an icon; controls follow the existing panel's theme. |

Edges mean execution order: B waits for A. Inserting a checkpoint replaces A → B with A → checkpoint → B, preserving B's other dependencies. Rejected checkpoints block their dependents while unrelated branches continue.

<img src="./assets/readme/workflow-editor.png" width="620" alt="Original graph stays visible while editing a checkpoint">

*Actual UI preview with simulated data. Narrow windows stack graph and editor; wide windows place them side by side. New workbench labels are currently Chinese; the inherited activity panel retains its localization.*

<details><summary>Discussion context panel</summary>

<img src="./assets/readme/discussion-context.png" width="620" alt="Member instructions, saved prompt and submitted results">

</details>

## Validation scope

The workflow previously passed isolated **Harness `0.2.1-rc.2`** runtime checks with deterministic model fixtures and the full `pnpm verify` suite. On 2026-10-27, a live test in **Desktop `0.2.1-rc.3` with a real DeepSeek model** exercised team creation, instruction changes, checkpoint insertion, rejection, rework, second-round approval, downstream execution and restart recovery. Two issues found during that test were fixed; all 24 workflow tests and core checks pass.

See the **[Desktop walkthrough with 15 real screenshots](./docs/desktop-live-test-2026-10-27/README.md)** (Chinese). The downstream reviewer returned `needs_revision`: the workflow was exercised successfully, but the sample content did not receive an all-pass result. The report records the remaining coverage limits.

Also see the **[Live DSH Web screenshots and instructions](./docs/web-live-test-2026-10-27/README.md)** (Chinese): Web startup, real-model team creation, the workflow canvas and drag-to-connect were exercised. Testing stopped at the user's request; the Web approval flow was not completed.

The [compatibility matrix](./compatibility.json) and [upstream release notes](./release-notes/v0.1.27.md) describe the inherited baseline, not validation of every new feature on every listed host. The unchanged version number alone does not identify the installed source.

## Replace an existing installation

Stop or pause active teams and save plugin settings you need. Upstream and this fork share a package name: replace them in the **same profile**. Removing the package does not require deleting workspace `.agent-teams/` records.

### Desktop: install from GitHub

1. Find AgentTeams (`@nanmicoder/dsh-agent-teams`) in DSH's plugin manager and uninstall the previous installation.
2. Open **Add plugin** and enter:

~~~text
https://github.com/yogurtss/dsh-agent-teams
~~~

3. Install, enable and restart DSH Desktop. The AgentTeams workspace should expose the workflow canvas and discussion context.

**Desktop has its own core and profile. Standalone CLI `--profile web` does not replace Desktop plugins.** Prefer Desktop's plugin manager. Local packages require Desktop's CLI carrier and its actual profile, rather than an assumed standalone profile name. Upgrading a global CLI does not upgrade Desktop's embedded core.

### CLI / Web: install from GitHub

Check `dsh --version`. Replace `web` with your actual profile and stop that Harness process. Skip remove for a first installation.

~~~sh
dsh plugin --profile web remove @nanmicoder/dsh-agent-teams
dsh plugin --profile web add github:yogurtss/dsh-agent-teams#main
dsh --profile web
~~~

Refresh the browser after restarting. The Git branch includes built `lib/` artifacts; direct Git installs need GitHub access but no manual build.

### Install cloned or downloaded source (Windows PowerShell)

Clone with `git clone https://github.com/yogurtss/dsh-agent-teams.git`, or extract **Code → Download ZIP**. These examples assume `G:\dsh_agents`; substitute your path. Use Node.js `^22.19.0 || >=24` and pnpm.

**Option A: build a tarball for regular use or another machine.**

~~~powershell
Set-Location G:\dsh_agents
pnpm install --frozen-lockfile
pnpm build
pnpm pack --out "$env:TEMP\agent-teams-fork.tgz"

# Stop the target Harness profile; skip remove on first installation
dsh plugin --profile web remove @nanmicoder/dsh-agent-teams
dsh plugin --profile web add --save-exact "$env:TEMP\agent-teams-fork.tgz"
dsh --profile web
~~~

For an already built `.tgz`, install its absolute path directly. A GitHub source ZIP must be extracted first; it is not a plugin tarball.

**Option B: link a local directory for development.** After installing dependencies and building as above, stop Harness and run:

~~~powershell
dsh plugin --profile web remove @nanmicoder/dsh-agent-teams
dsh plugin --profile web add "G:\dsh_agents"
dsh --profile web
~~~

Directory installation saves a `link:` dependency. Keep that directory in place. After source changes, run `pnpm build`, restart Harness and refresh the browser; reinstall dependencies with `pnpm install --frozen-lockfile` when needed. Tarball installations require repacking and reinstalling. On macOS/Linux use the same DSH commands with your platform's absolute paths.

### Verify the source, update or uninstall

~~~sh
dsh plugin --profile web list @nanmicoder/dsh-agent-teams --depth 0
~~~

Inspect the actual profile's `package.json` if needed: the dependency must point to `github:yogurtss/...`, your `file:...tgz` or your `link:...directory`. A plain npm version identifies upstream. Check for workflow, discussion-context and human-checkpoint controls. The preview at `http://127.0.0.1:8371/` does not prove installation in DSH.

To update Git installs, remove/add in the same profile and restart. For reproducibility, replace `#main` with a full commit SHA from this fork. If a same-version tarball at the same path is cached, repack to a new filename and verify the installed source.

To uninstall:

~~~sh
dsh plugin --profile web remove @nanmicoder/dsh-agent-teams
~~~

To return to upstream, uninstall and install `@nanmicoder/dsh-agent-teams@0.1.27`, then restart. Back up team state: downgrading fork-specific checkpoint/discussion state has not been verified. Do not resume those teams with upstream.

## Workflow and boundaries

Describe a goal → discuss the initial team → inspect members/tasks → edit the canvas → confirm execution → discuss and decide at checkpoints.

Proposals require human confirmation. Stop running tasks before editing, then resume; completed tasks use new rework rounds. Configuration/review agents can only read context and propose, not execute or approve. Review uses agent-submitted results and host-computed file digests, not independent test execution. Role-prompt snapshots are not complete model requests. Rework crossing another human checkpoint must be handled in segments.

The inherited activity panel, slash command and configuration remain available, as described below.

## View teams in the workspace

Click **View team** in the current chat header or the team card below a reply to open the native **Team collaboration** tab. The entry belongs to its chat, rather than the general workspace start page.

Team and task content starts immediately: wide panes use columns and narrow panes stack them. Select a task to locate its owner; member icons open their conversations. Closing the tab does not stop the team, and its chat can reopen it. Completed teams retain their archives. Older hosts keep the activity panel.

## How it works

1. For a request to use AgentTeams, the captain follows the core protocol already in its system instructions. It continues an existing team and uses `agent_teams_status` when current state needs checking. When no team exists, the goal becomes a staged plan for review.
2. The captain adds role-specific members backed by continuable sub-agents.
3. The goal becomes tasks with owners and explicit dependencies.
4. The shared scheduler uses real `running / idle / ready` state to atomically claim one ready task per idle member and wake it. An interrupted resident attempt stays parked and can resume through a direct message without losing its capability; after a cold process restart, the scheduler retries stranded open work with a fresh attempt.
5. Members update with the current `attempt_id`; reassignment or captain takeover revokes the old attempt and waits for the old worker to quiesce before a new attempt starts.
6. The captain presents the combined result, then archives the complete team record.

Team state is stored under `<workspace>/.agent-teams/`; the Web panel reads that disk truth and combines it with live sub-agent activity.

Member creation is zero-interaction by default: a member on the captain's current LLM route snapshots that provider, model, and reasoning effort, while a member on a requested alternative route snapshots the target model's default effort; later continuations restore the resolved snapshot. Only an explicit heterogeneous-team request (for example, “backend on provider A/model X, frontend on provider B/model Y”) supplies a member-specific `provider` + `model`; there is no per-member model or reasoning prompt.

Captain sessions keep the concise core protocol and the original 14 native team tools from their first request. All business tools are directly available; no loading tool or extra activation call is needed. Configured profiles retain their bounded directory in the fixed system prompt. Creating, approving, continuing or ending a team does not rewrite the system prompt or tool schemas. Core rules remain available after history compaction or discarded code-mode tool results. Members receive four team tools, fixed member instructions, and their ordinary coding/research tools. Web approval wakes the captain with a control message; later member reports wake it again. See the [fixed protocol and benchmark contract](./docs/progressive-loading.md).

## Slash command

No “use AgentTeams” phrasing required. The plugin registers the
closed-namespace `/agent-teams` host command, so the Web GUI slash menu shows
an `agent-teams` placeholder with an input hint: pick it (or type the
command), describe the goal, and press Enter.

```
/agent-teams research the pricing pages of three competitors
```

The command pipeline claims the line, then preserves that exact input as an
ordinary user follow-up so it remains visible in the main chat. The gesture
boundary adds the deterministic activation directive at pre-step, so the
first model request follows the staged planning protocol without a mandatory helper call. The invocation is also durably
logged (`command/run` / `command/done`).

Surfaces without command adjudication (for example the headless CLI) get the
same deterministic activation through a gesture boundary: any genuine user
message starting with `/agent-teams` activates the protocol for the rest of
the text. Mid-sentence mentions stay ordinary prose.

Historical panels require saved team state or archives. Sessions from early versions that deleted teams without retaining archives do not yet support reconstructing the full panel from logs.

## Configuration

Defaults work without extra setup. A trusted profile can override member behavior:

```yaml
- id: agent-teams
  config:
    stateDir: .agent-teams
    memberProvider: spawn
    memberModel: deepseek-v4
    memberMaxDepth: 0
    maxMembers: 8
    toolPolicies:
      researcher:
        allow: [read, glob, grep]
      implementer:
        deny: [web_search]
```

`memberMaxDepth` defaults to `0`: team members cannot create nested subagents. Set `1` to explicitly permit one descendant level; the limit also covers runtime/code-tool calls. Default members report through team messages only, avoiding duplicate native parent reports. Idle roster members make no model requests. Task assignments start distinct turns; coordination joins the nearest model step. Acceptance and consumption are tracked separately. Removal/archive drains the selected branch and its pending input before reporting success.

`toolPolicies` is owner configuration: reusable per-member tool policies keyed by id. A member *selects* one by id — `tool_policy` on `agent_teams_add_member`, a member row of an inline `plan`, or a profile member row. The Captain model can select a declared policy but can never submit raw allow/deny lists or invent one at runtime.

- `deny` hides the named global tools from that member's schemas and rejects their invocation.
- `allow` keeps only the named global tools. The four coordination tools (`agent_teams_claim_task`, `agent_teams_update_task`, `agent_teams_send_message`, `agent_teams_status`) are always added to an allow list.
- The captain-only tool list is always denied and cannot be reopened by a policy; a policy may not deny a required coordination tool.
- Unknown ids, empty policies, and empty lists fail at mount or before a member is persisted.
- `agent_teams_status` shows the selected policy id per member; the complete resolved filter is kept in `team.json` for audit, and the child's durable descriptor reapplies it after a restart.
- Teams and members created without a policy keep their previous tool set and record shape. An empty `tool_policy` on `agent_teams_edit_plan` clears a staged member's policy.

This is model tool visibility and invocation policy for global tools, not an OS sandbox or an authorization boundary.

`memberProvider` is the sub-agent runtime backend (`spawn` / `fork`), not an LLM provider. Cross-LLM-provider routing uses the optional `provider` + `model` fields of `agent_teams_add_member`; `memberModel` is only a model default for all members. A member on the captain's current provider/model inherits the captain's reasoning effort, while a changed provider or model automatically uses the target model's default. To request a particular effort, pass the optional `reasoning_effort` field — one of the target model's supported effort ids, or `"default"` to force the model's own default.

`slashCommand: false` disables the deterministic `/agent-teams` activation surfaces (slash command and gesture boundary), leaving the natural-language trigger as the only entry point.

## Boundaries

- One captain leads one active team at a time.
- Idle members with no open task are automatically reused for ready work. An idle member that still owns an open attempt is parked until messaged or explicitly reassigned; messages that cannot be delivered live remain durable and are retried at a later status boundary.
- State is file-backed and serialized within one DSH process; concurrent processes editing the same team are not coordinated.
- The activity panel reports persisted state as-is. Models may occasionally finish work without performing the expected task-state update.

See [docs/usage.md](./docs/usage.md) for the full tool reference, state model, Web UI behavior, configuration, and known limits.

## Plugin development Skill

Community upgrade, audit, benchmark, testing and release skills are vendored with a pinned source revision. See [skills/README.md](./skills/README.md) for local rules and [CONTRIBUTING.md](./CONTRIBUTING.md) for the contribution workflow.

The repository also ships the open Agent Skills package [`dsh-plugin-development`](./skills/dsh-plugin-development/SKILL.md):

```sh
npx skills add yogurtss/dsh-agent-teams --skill dsh-plugin-development
```

## Documentation

| Guide | Covers |
| --- | --- |
| [Usage](./docs/usage.md) | Architecture, UI behavior, tools, configuration, limits, and validation |
| [Verification](./docs/verification-guide.md) | Offline, composition, real e2e, and GUI verification |
| [Plugin development](./docs/developing-dsh-plugins.md) | Human-readable guide built from this plugin |
| [README writing](./docs/readme-writing-guide.md) | Repository documentation conventions |

## Development

```sh
pnpm install
pnpm build
pnpm verify
```

## Named multi-role profiles

Configure one or more complete team profiles in `cordis.patch.yml`. A profile always supplies the roster (independent provider/model/role/reasoning effort). Set `taskPlanning: captain` when the Captain should derive the DAG from the user's goal; omit it or set `taskPlanning: seed` to keep a fixed template workflow:

```yaml
profiles:
  demo-delivery:
    description: Ship a small feature
    protocol: Discuss requirements, review, test, then prepare release; do not deploy automatically.
    members:
      - name: analyst
        model: gpt-5.6-sol
        role: Analyze requirements
      - name: implementer
        model: gpt-5.6-terra
        role: Implement the approved solution
    tasks:
      - id: requirements
        subject: Requirements discussion
        assignee: analyst
      - id: implementation
        subject: Implement solution
        assignee: implementer
        dependencies: [requirements]
```

Use an explicit profile flag: `/agent-teams --profile demo-delivery implement the feature`. The first ordinary token is never treated as an implicit profile. Normal command runs call `agent_teams_create({ profile, approval: "required" })`: the roster and seed/Captain-designed DAG remain staged, no child session is created, and no task is claimed. Edit the plan in the activity panel using the host model catalog, return to chat so the Captain asks what to revise and then atomically updates the same draft, discard it, or click **Approve & Run**. Return/discard actions cancel any planning turn still running; discard also parks model-facing context that forbids silently creating a replacement team. Approval resolves the final provider/model/reasoning choices, commits the roster, and creates each member session only when its first task is ready. A running team is stopped from its own panel header through a confirmation dialog rather than from the composer. Direct tool clients may pass `approval: "automatic"` for the legacy immediate path. Failed review/test tasks do not unlock downstream work; automatic repair/review tasks do not depend on the failed review.

## License

[MIT](./LICENSE)
