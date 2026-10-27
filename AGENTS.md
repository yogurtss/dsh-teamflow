# Project maintenance skills

Before using a DSH plugin lifecycle skill in this repository, read `skills/README.md` for its source, version, and project-specific applicability. Prefer the project copy when a global skill has the same name.

Vendored skills are community guidance. Historical version examples are not the current support policy; verify exact Harness tags, npm artifacts, the resolved dependency graph, and AgentTeams behavior. Preserve upstream skill files; record local integration rules separately.

User instructions and authorization take precedence over skill defaults. Do not repeat confirmation for work the user has already authorized.

# Git workflow and standing push authorization

Manage project changes with Git. After completing a major update (a feature, substantial fix, or meaningful documentation milestone), review the diff, fix discovered issues, and run checks appropriate to the changed surface. Include required build artifacts and documentation in the commit.

The user explicitly authorizes proactively committing and pushing completed, validated updates without asking again. Push to this user's fork, `origin` (`https://github.com/yogurtss/dsh-teamflow.git`), on the current task branch; confirm the branch and remote before pushing. Do not push to `upstream` or force-push under this standing authorization. Honor any later instruction to keep changes local or defer a push.

Stage only task-related changes; preserve unrelated user work and keep secrets, local state, and temporary test outputs out of commits. After pushing, verify synchronization and report the commit and branch. If checks or the push fail, resolve the issue where possible and report any remaining blocker accurately.

# Browser automation

For interactive browser automation, use the `ego-browser` skill from Ego Lite. Do not use `agent-browser` or another browser-control skill unless the user explicitly requests it or Ego Lite is unavailable.
