---
name: hiding
description: >-
  Strategically remove AI leakage, source/provenance clues, exposed constraints, credentials, and user-specified sensitive content from files without changing executable behavior. Use whenever a file needs to reveal less about its origin, process, AI participation, constraints, or sensitive context. Release hygiene is a common scenario; review, handoff, publication, commit, push, and sharing are examples, not prerequisites. Triggers include /hiding, clean AI traces, hide provenance, hide constraints, avoid disclosure, 隐藏 AI 痕迹、清理 AI 泄露、清理规则、提交前清理、隐藏数据来源、隐藏来源、隐藏约束、规避披露、清理文件产物。
argument-hint: "[<what-to-hide>...] [--files <file>...|session|worktree] [options]"
metadata:
  author: HuaTalk
  version: "0.7.0"
  category: output-discipline
---

# /hiding

Strategically strip AI leakage, provenance clues, exposed constraints, and user-specified sensitive content from files without changing executable behavior.

**Scope**: Code, config, markdown, and documentation files only. Agent replies and conversation output are out of scope.

## Core Contract

- Do not inject persistent constraints into normal sessions.
- Process files only; do not modify agent replies or conversation output.
- Remove leakage without changing code logic or doing humanizer-style rewrites.
- Stay silent unless a documented exception applies.
- Always warn and recommend rotation when credentials are found.
- Require explicit confirmation before deleting an entire file.
- Automatically scan deliverables, not agent control-plane or planning state.
- Preserve behavior across supported agent environments.

## Usage

```
/hiding [<what-to-hide>...] [--files <file>...|session|worktree] [--mode <inplace|newfile|backup>] [--dry-run] [--use-subagent]
```

| Input | Values | Default | Description |
|-------|--------|---------|-------------|
| `<what-to-hide>...` | leading quoted semantic targets | none | Additional content to hide |
| `--mode` | `inplace`, `newfile`, `backup` | `inplace` | Output location |
| `--dry-run` | boolean | off | Preview without writing |
| `--use-subagent` | boolean | off | Ask a fresh-context sub-agent for candidate leakage locations only |
| `--files` | one or more file paths, `session`, or `worktree` | `session` | Select files to scan and clean |

```
/hiding --dry-run
/hiding "data sources" "internal review rules" --files report.md --dry-run
/hiding --files file.java --mode newfile --use-subagent
/hiding --files README.md config.yml --dry-run
/hiding --files session --dry-run
/hiding "data sources" --files worktree --dry-run
```

### Argument Parsing

Parse zero or more semantic targets first, followed by flags. Each leading positional argument is one target; quote targets containing spaces. Targets must precede the first flag and apply only to this invocation. Treat targets as natural-language descriptions that may include exact literals, not as regexes.

`--mode` accepts `--mode value` and `--mode=value`. `--files` appears at most once and consumes one or more values until the next recognized flag. Do not split values on commas. The exact single values `session` and `worktree` are reserved selectors. Each must be the only `--files` value; never mix a selector with paths or another selector. Use `./session` or `./worktree` for literal same-named files.

After parsing, process literal paths directly (bypassing automatic scope); follow the Session HITL or Git Worktree Selection section for `session` and `worktree`. Omitting `--files` is exactly equivalent to `--files session`.

Reject positional targets after the first flag, repeated `--files`, `--files=<file>`, unknown flags, invalid/missing `--mode`, and missing `--files` paths. A recognized flag ends the file list and is not a path. Report the error rather than guessing intent.

### Output Artifact Eligibility

Resolve scope before Step 0 or any content scan. For each candidate, apply this order and stop at the first decisive rule:

1. **Explicit selection**: a literal `--files <path>` is in scope, even when it is tool control state.
2. **Tool ownership**: automatically exclude known agent/tool control state, including `.planning/**`, recognizable planning-with-files state (`task_plan.md`, `findings.md`, and `progress.md` used together), and equivalent session plans, progress logs, or memory used to operate the agent.
3. **Task goal**: include files directly requested as task deliverables, such as an article, report, code change, ADR, requirements document, final research conclusion, or project-facing plan.
4. **Target consumer**: include files intended for human or project use; exclude files intended only for an agent or tool.
5. **Uncertain**: use task/session context to make a conservative decision. When confidence remains low, preserve and exclude the file without scanning; do not ask solely because classification is uncertain. Ask only when excluding it would prevent completion of an explicit user request. Do not infer from persistence or filename alone.

In short, an automatically selected file is an output artifact when it is a task deliverable for a human/project consumer and is not tool control state. A formal `findings.md` report can qualify; a persistent agent memory does not. Apply this eligibility check only to `session` and `worktree` selector candidates.

### Git Worktree Selection (`--files worktree`)

Use local Git state only; do not fetch. Resolve paths from the working directory active when `/hiding` is invoked:

1. Run `git rev-parse --show-toplevel`; report and stop if outside a Git worktree. Require a valid `HEAD`.
2. If `HEAD` is attached, read its remote from `branch.<name>.remote`; when that value names a remote (not `.`), try the locally available symbolic ref `<remote>/HEAD`. Then try `origin/HEAD`, `origin/main`, local `main`, `origin/master`, and local `master`, in that order. Resolve symbolic refs to their target. Report and stop if no candidate resolves to a commit.
3. Run `git merge-base HEAD <base-ref>`; report and stop if no merge base exists.
4. From the repository root, collect tracked paths with `git diff --name-only --diff-filter=ACMRTUXB -z <merge-base> --` and untracked, non-ignored paths with `git ls-files --others --exclude-standard -z`.
5. De-duplicate the NUL-delimited paths. Exclude deleted files, ignored files, directories, and index entries with mode `160000` (submodules). Classify the remaining files using `Output Artifact Eligibility`.
6. Before Step 0 or any scan, resolve uncertain candidates autonomously using task/session context. Exclude low-confidence candidates without scanning. Under `--dry-run`, list these conservative exclusions with a brief reason.

This comparison is `merge-base(HEAD, primary branch) -> worktree at invocation time`, so it includes branch commits, staged changes, unstaged changes, and untracked files, but not primary-branch-only commits made after divergence.

If no eligible candidates remain after classification, report `No eligible files changed in the current worktree relative to <base>.` and stop. Under `--dry-run`, show the resolved base ref, merge base, eligible paths, and conservative scope exclusions before the normal preview. All output modes, purge checks, credential handling, and `--use-subagent` behavior then apply per selected file.

### User-Specified Targets

User targets augment, never replace, the five leakage categories and credential scan. Match by meaning: `"data sources"` includes source attributions and provenance; an exact project or rule name includes obvious contextual references. Do not broaden a target to merely related content.

- In comments or prose, remove the smallest complete sentence, paragraph, list item, or block needed to hide the target while keeping the remainder coherent. Do not invent replacement facts.
- In executable code, identifiers, or behavior-affecting config values, do not modify the match. Report `<file>:<line>` for human review without echoing sensitive values.
- If removing target matches would leave no useful standalone content, apply the purge confirmation rule.
- Zero matches for a target do not produce output outside Session HITL or `--dry-run`.

## Output Modes

| Mode | Result |
|------|--------|
| `inplace` | Replace the original after validation |
| `newfile` | Write `<stem>-cleaned.<ext>` (or `<name>-cleaned` without an extension); preserve the original |
| `backup` | Move the original to `<file>.bak`; write cleaned content to the original path |

Never overwrite a `newfile` or backup target. Use the next numbered name (`-cleaned-2`, `.bak-2`, then increment) and report the collision.

`--dry-run` never writes. For explicitly selected files, show built-in categories and user-target matches with line context. For `worktree`, first show its resolved base, eligible files, excluded control state, and low-confidence files conservatively excluded from scanning. For current-session selection, show the normal H1-H3 findings, including user-target matches. Redact secret values. Preview output is an explicit silence exception.

## Session HITL (`--files session` or Default)

### Step H1: Session Inventory

Inventory and de-duplicate every file created or modified through file-editing tools in the current session. Exclude deleted files, build output, and dependencies, then classify the remainder using `Output Artifact Eligibility`. Git status may provide context but must not expand this inventory. If the runtime cannot identify files created or modified in the current session, report the limitation and stop; do not substitute Git changes.

Record session topics, sensitive context, and reasoning traces as Tier 3 clues. Only access-granting values count as credentials.

### Step H1.5: Resolve Uncertain Scope

Before H2 or any content scan, classify uncertain files autonomously from task goal, ownership, and intended consumer. Preserve and exclude low-confidence files without asking. Under `--dry-run`, list these exclusions with a brief reason. Ask for scope clarification only if conservative exclusion would prevent completion of an explicit user request.

### Step H2: Leakage Candidate Detection

Scan only eligible inventory files using [references/leakage-categories.md](references/leakage-categories.md) and any user-specified targets. With `--use-subagent`, use its candidate list as detection evidence; the main agent still performs credential scanning, purge classification, tiering, and every later decision.

| Tier | Finding |
|------|---------|
| 0 | Secrets or credentials; always first and prominent |
| 1 | Step 2 purge candidates |
| 2 | Inline leakage or user-target matches in otherwise useful files |
| 3 | Session clues that may have propagated into files |

### Step H3: Present Findings (HITL)

For zero findings, including an empty inventory, say **"No AI leakage found in files created or modified in the current session."** If user targets were supplied, include **"or user-specified content"** in that message.

Otherwise present Tier 0 first, then per-file delete/clean choices, Tier 3 concerns, `Hide everything found`, and `Nothing`. Use the runtime input mechanism or plain text and wait for explicit selection. Selecting Tier 0 also triggers the rotation warning.

### Step H4: Execute User Choices

Delete only after explicit confirmation; deletion ignores `--mode`. Clean selected files with Steps 0-4 and the chosen output mode. Stay silent afterward except for required warnings.

## Leakage Categories

Before scanning or stripping, read and apply [references/leakage-categories.md](references/leakage-categories.md). Judge by its principles, not keywords.

## Execution Order

Apply these steps in order; each gates the next.

### Step 0: Validate

Reject missing, directory, binary, empty, or oversized files (>10,000 lines or >500KB) with a brief error. Require confirmation before following a symlink.

### Step 1: Scan Secrets and Credentials

Before any purge decision, scan every line, key, and value for credentials. Credentials grant access; internal names, non-access-bearing URLs, and mock labels are not credentials. Record findings and the required warning without modifying the file yet.

Never echo or itemize secret values. Credentials in executable code require human review. Configuration credentials may be replaced only with a format-safe placeholder during Step 3.

The warning fires after the outcome is known even if the file is deleted as a purge candidate or left unchanged:

> **"Security-sensitive content (credentials/keys/tokens) was found {and removed / preview only / but not removed}. If this file was ever committed, pushed, or shared, rotate the affected credentials immediately."**

### Step 2: File-Level Purge Check (HITL)

Ask: after removing transient thought-process traces, AI-facing rationale/guardrails, AI self-reference, and user-target matches, would any section remain useful standalone reference? If no, treat the file as a purge candidate. Durable requirements, architecture decisions, trade-offs, research conclusions, and other reader-facing rationale remain useful reference and must not count toward purge signals.

Do not strip a purge candidate. Under `--dry-run`, report it as a would-delete candidate without requesting or acting on deletion confirmation. Otherwise ask whether to delete it; delete only on explicit confirmation, or leave it untouched and stop processing that file. Emit any Step 1 credential warning regardless of this choice.

### Step 3: Strip

First remove allowed credential values identified in Step 1. Do not modify credentials in executable code; report the line for review. Replace configuration credentials only with a format-safe placeholder; otherwise leave them and request review.

Then remove unshared rule references, AI-facing rationale/guardrails, AI self-reference, transient thought-process traces, and allowed matches for user-specified targets.

### Step 4: Verify

Validate a temporary candidate before changing the original:
- **JSON**: run `python3 -c "import json; json.load(open('FILE'))"` or `jq . FILE`
- **YAML**: run `python3 -c "import yaml; yaml.safe_load(open('FILE'))" 2>/dev/null`. If this fails with `ModuleNotFoundError` (PyYAML is NOT standard library), fall back to visual inspection — do NOT treat the missing module as a YAML syntax error.
- **XML**: run `xmllint --noout FILE`
- **Code files**: visually check brace/bracket matching, import/directive integrity
- **Markdown**: check heading hierarchy and code block delimiter matching

After stripping, re-read the candidate once. On failure, discard it and leave the original untouched. Report: "Structural issue detected after cleaning — file left unchanged. Human review needed." Replace atomically where supported. A successful visual fallback is silent.

## Sub-Agent Review (`--use-subagent`)

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

## Strip Strategy by File Type

- **Code** (.java, .py, .ts, .go, .rs, .js, etc.): Remove comment lines matching leakage categories or user targets. Keep executable code, string literals, and runtime-visible doc strings as-is; report those matches for human review. If removing a comment would leave an empty comment block (e.g., `/** */`), remove the whole block.
- **Markdown** (.md): Remove paragraphs and sentences matching leakage categories or user targets. Keep technical content.
- **Config** (.yml, .yaml, .json, .xml, .toml, .env, .properties, .ini, .cfg): Remove leakage comments. Handle credential values only as Step 3 permits; report user-target matches in behavior-affecting values for human review. Keep config structure and other values. For YAML block scalars (`|`, `>`), replace the entire scalar value only when the permitted edit remains format-safe.
- **Other**: Remove any comment or prose matching the leakage categories or user targets.

## Execution Rules

### Silent Execution

Leave no trace of cleanup: no announcements, removed-item lists, markers, metadata, visible gaps, or unrelated formatting changes.

**If the user asks** "what did you remove?" or "did you clean the file?" — respond factually but briefly: "X leakage categories were addressed." Do not itemize. Do not celebrate.

### Explicit Exceptions to Silence

These are the ONLY cases where `/hiding` produces output beyond the HITL decision flow:

1. **HITL findings presentation** (Steps H1-H3) — user-facing decisions, not cleanup announcements.
2. **Step 2 purge check** — asking the user whether to delete a file.
3. **Secret and credential warning** (Step 1) — mandatory security warning; tell the user to rotate affected credentials immediately.
4. **`--dry-run` preview** — user explicitly requested a preview.
5. **Zero findings in Session HITL** — brief confirmation; mention user-specified content only when targets were supplied.
6. **Session inventory unavailable** — report the limitation and stop instead of substituting Git changes.
7. **Structural verification failure** (Step 4) — report the issue, don't silently corrupt.
8. **Missing/binary/directory/empty file or invalid input** — report the input error (including `--files` validation errors).
9. **External modification during operation** (mtime check) — warn and abort, don't overwrite concurrent changes.
10. **Output-target collision** (`newfile`/`backup`) — the target file already exists; never overwrite it, write to a numbered alternative and report the name used.
11. **Sub-agent unavailable** (`--use-subagent`) — report that execution will fall back to the main agent and will not have fresh-context isolation.
12. **User target in executable content** — report the location for human review instead of changing code or runtime behavior.
13. **Git worktree selection result** — report repository/base resolution errors and an empty selection; under `--dry-run`, report the resolved base and selected files.
14. **Blocking scope ambiguity** — ask only when conservative exclusion would make an explicit user request impossible to complete.

### Behavior Guardrails

- No leakage found (non-HITL modes) → do nothing, say nothing
- Code logic is NEVER changed — only comments and prose are stripped
- Multi-line leakage blocks → remove the whole block
- Preserve the file's original line ending style (LF vs CRLF)
- Before writing, check if the file was modified since reading (compare mtime); if changed, warn and abort
