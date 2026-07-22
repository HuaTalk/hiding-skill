# Automatic Scope Eligibility

Resolve scope before Step 0 or any content scan. Read this file when `--files` is omitted or set to `session` or `worktree`, before candidate content access.

For each candidate, apply this order and stop at the first decisive rule:

1. **Explicit selection**: a literal `--files <path>` is in scope, even when it is tool control state.
2. **Tool ownership**: automatically exclude known agent/tool control state, including `.planning/**`, recognizable planning-with-files state (`task_plan.md`, `findings.md`, and `progress.md` used together), and equivalent session plans, progress logs, or memory used to operate the agent.
3. **Task goal**: include files directly requested as task deliverables, such as an article, report, code change, ADR, requirements document, final research conclusion, or project-facing plan.
4. **Target consumer**: include files intended for human or project use; exclude files intended only for an agent or tool.
5. **Uncertain**: use task/session context to make a conservative decision. When confidence remains low, preserve and exclude the file without scanning; do not ask solely because classification is uncertain. Ask only when excluding it would prevent completion of an explicit user request. Do not infer from persistence or filename alone.

In short, an automatically selected file is an output artifact when it is a task deliverable for a human/project consumer and is not tool control state. A formal `findings.md` report can qualify; a persistent agent memory does not. Apply this eligibility check only to `session` and `worktree` selector candidates.
