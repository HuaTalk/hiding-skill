# Sub-Agent Review

Read this file only for `--use-subagent`.

The sub-agent detects candidate leakage only. The main agent always executes Steps 0-4 and owns scope, credential scanning, purge decisions, confirmations, edits, warnings, validation, output modes, and writes.

1. Resolve scope and run Step 0 and Step 1 in the main agent. Before spawning, resolve the target file to an absolute path. Resolve `references/leakage-categories.md` against the directory containing the loaded `SKILL.md`, normalize it to an absolute path, and verify it is a readable regular file. Never resolve this reference against the invocation working directory or pass it as a relative path. If the reference is missing or unreadable, report a Skill installation error and stop. Then spawn one fresh-context sub-agent per eligible file. In Session HITL, use the returned candidates during H2 before presenting H3. If sub-agents are unavailable, report the non-isolated fallback and detect candidates in the main agent.
2. Give the sub-agent references, not copied content:
   - the absolute selected target file path;
   - the absolute resolved path to `references/leakage-categories.md`;
   - every user-specified target, preserving its exact wording;
   - the relevant file-type context for interpreting comments and prose.
3. Scope the sub-agent: identify possible category and user-target matches only. Do not decide whether the whole file is a purge candidate, recommend an edit action, classify executable versus safe-to-edit content, handle credentials, inspect other files or Git history, write/delete files, run Steps 0-4, choose output modes, or spawn agents.
4. Return a candidate list only. Each item includes `<file>:<line-range>`, built-in category or `user target: <target>`, and a brief reason. Redact any possible credential value and label it `credential candidate`. Return an empty list for zero matches.
5. The main agent treats the list as evidence, not a decision. Independently run Step 2, decide which candidates are editable under Step 3 and `Strip Strategy by File Type`, apply allowed edits, then run Step 4 and the selected output mode. `--dry-run` presents main-agent findings, not raw sub-agent instructions.

Candidate detection is the sub-agent's entire responsibility. All behavior after detection remains identical to main-agent execution without `--use-subagent`.
