---
name: hiding
description: Strip AI leakage and user-specified sensitive content from files before committing, pushing, or sharing. 在提交/推送/分享前清理文件中的 AI 残留痕迹和用户指定的敏感内容。Supports leading semantic targets, explicit paths or Git worktree changes, discovery of files created or modified in the current session, output modes, dry-run preview, fresh-context sub-agent review, and credential-security warnings. 支持使用前置语义目标指定需隐藏的内容、选择明确路径或 Git worktree 改动、发现当前 session 中创建或修改的文件、输出模式、预览、独立子代理审阅和凭证安全告警。
argument-hint: "[<what-to-hide>...] [--files <file>...|worktree] [options]"
metadata:
  author: HuaTalk
  version: "0.8.0"
  category: output-discipline
---

# /hiding

Strip AI leakage and user-specified sensitive content from files without changing executable behavior.

**Scope**: Code, config, markdown, and documentation files only. Agent replies and conversation output are out of scope.

## Core Contract

- Do not inject persistent constraints into normal sessions.
- Process files only; do not modify agent replies or conversation output.
- Remove leakage without changing code logic or doing humanizer-style rewrites.
- Stay silent unless a documented exception applies.
- Always warn and recommend rotation when credentials are found.
- Require explicit confirmation before deleting an entire file.
- Preserve behavior across supported agent environments.

## Usage

```
/hiding [<what-to-hide>...] [--files <file>...|worktree] [--mode <inplace|newfile|backup>] [--dry-run] [--use-subagent]
```

| Input | Values | Default | Description |
|-------|--------|---------|-------------|
| `<what-to-hide>...` | leading quoted semantic targets | none | Additional content to hide |
| `--mode` | `inplace`, `newfile`, `backup` | `inplace` | Output location |
| `--dry-run` | boolean | off | Preview without writing |
| `--use-subagent` | boolean | off | Ask a fresh-context sub-agent for edit suggestions; the main agent applies them |
| `--files` | one or more file paths, or `worktree` | files created or modified in the current session | Select files to scan and clean |

```
/hiding --dry-run
/hiding "data sources" "internal review rules" --files report.md --dry-run
/hiding --files file.java --mode newfile --use-subagent
/hiding --files README.md config.yml --dry-run
/hiding "data sources" --files worktree --dry-run
```

### Argument Parsing

Parse zero or more semantic targets first, followed by flags. Each leading positional argument is one target; quote targets containing spaces. Targets must precede the first flag and apply only to this invocation. Treat targets as natural-language descriptions that may include exact literals, not as regexes.

`--mode` accepts `--mode value` and `--mode=value`. `--files` appears at most once and consumes one or more values until the next recognized flag. Do not split values on commas. The exact single value `worktree` is a reserved selector; write `./worktree` to select a literal file with that name. Reject `worktree` mixed with paths.

1. **Explicit files**: resolve, de-duplicate, and pass Step 0 for every listed file before modifying any of them; then run Steps 1-4 on each. Never interpret a file path as content to hide. Every file receives the built-in scan plus any user targets.
2. **Git worktree selector**: `--files worktree` selects files changed in the Git worktree where the skill is invoked, relative to its primary branch. Follow `Git Worktree Selection` below; do not use conversation/session file inventory.
3. **Current-session default**: without `--files`, use every file created or modified through file-editing tools in the current session. Do not add files merely because they have uncommitted Git changes. Run the Session HITL flow before writing.

Reject positional targets after the first flag, repeated `--files`, `--files=<file>`, unknown flags, invalid/missing `--mode`, and missing `--files` paths. A recognized flag ends the file list and is not a path. Report the error rather than guessing intent.

### Git Worktree Selection (`--files worktree`)

Use local Git state only; do not fetch. Resolve paths from the working directory active when `/hiding` is invoked:

1. Run `git rev-parse --show-toplevel`; report and stop if outside a Git worktree. Require a valid `HEAD`.
2. If `HEAD` is attached, read its remote from `branch.<name>.remote`; when that value names a remote (not `.`), try the locally available symbolic ref `<remote>/HEAD`. Then try `origin/HEAD`, `origin/main`, local `main`, `origin/master`, and local `master`, in that order. Resolve symbolic refs to their target. Report and stop if no candidate resolves to a commit.
3. Run `git merge-base HEAD <base-ref>`; report and stop if no merge base exists.
4. From the repository root, collect tracked paths with `git diff --name-only --diff-filter=ACMRTUXB -z <merge-base> --` and untracked, non-ignored paths with `git ls-files --others --exclude-standard -z`.
5. De-duplicate the NUL-delimited paths. Exclude deleted files, ignored files, directories, and index entries with mode `160000` (submodules). Resolve and pass Step 0 for every remaining file before modifying any.

This comparison is `merge-base(HEAD, primary branch) -> worktree at invocation time`, so it includes branch commits, staged changes, unstaged changes, and untracked files, but not primary-branch-only commits made after divergence.

If selection is empty, report `No files changed in the current worktree relative to <base>.` and stop. Under `--dry-run`, show the resolved base ref, merge base, and selected paths before the normal preview. All output modes, purge checks, credential handling, and `--use-subagent` behavior then apply per selected file.

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

`--dry-run` never writes. For explicitly selected files, show built-in categories and user-target matches with line context. For `worktree`, first show its resolved base and selected paths. For current-session selection, show the normal H1-H3 findings, including user-target matches. Redact secret values. Preview output is an explicit silence exception.

## Session HITL (No `--files`)

### Step H1: Session Inventory

Inventory and de-duplicate every file created or modified through file-editing tools in the current session. Exclude deleted files, build output, and dependencies. Git status may provide context but must not expand this inventory. If the runtime cannot identify files created or modified in the current session, report the limitation and stop; do not substitute Git changes.

Record session topics, sensitive context, and reasoning traces as Tier 3 clues. Only access-granting values count as credentials.

### Step H2: Leakage Candidate Detection

Scan inventory files using [references/leakage-categories.md](references/leakage-categories.md) and any user-specified targets:

| Tier | Finding |
|------|---------|
| 0 | Secrets or credentials; always first and prominent |
| 1 | Step 1 purge candidates |
| 2 | Inline leakage or user-target matches in otherwise useful files |
| 3 | Session clues that may have propagated into files |

### Step H3: Present Findings (HITL)

For zero findings, including an empty inventory, say **"未在当前 session 中创建或修改的文件中发现 AI 泄露痕迹。No AI leakage found in files created or modified in the current session."** If user targets were supplied, include **"或用户指定的内容 / or user-specified content"** in that message.

Otherwise present Tier 0 first, then per-file delete/clean choices, Tier 3 concerns, `Hide everything found`, and `Nothing`. Use the runtime input mechanism or plain text and wait for explicit selection. Selecting Tier 0 also triggers the rotation warning.

### Step H4: Execute User Choices

Delete only after explicit confirmation; deletion ignores `--mode`. Clean selected files with Steps 0-4 and the chosen output mode. Stay silent afterward except for required warnings.

## Leakage Categories

Before scanning or stripping, read and apply [references/leakage-categories.md](references/leakage-categories.md). Judge by its principles, not keywords.

## Execution Order

Apply these steps in order; each gates the next.

### Step 0: Validate

Reject missing, directory, binary, empty, or oversized files (>10,000 lines or >500KB) with a brief error. Require confirmation before following a symlink.

### Step 1: File-Level Purge Check (HITL)

Ask: after removing thought-process traces, AI-facing rationale/guardrails, AI self-reference, and user-target matches, would any section remain useful standalone reference? If no, treat the file as a purge candidate. Also treat two or more of these as a purge candidate: process-oriented file names/headings, dated work logs, alternating "what/why" narration, or documentation of the decision process rather than the decision.

Do not strip a purge candidate. Under `--dry-run`, report it as a would-delete candidate without requesting or acting on deletion confirmation. Otherwise ask whether to delete it; delete only on explicit confirmation, or leave it untouched and stop processing that file.

### Step 2: Strip Secrets and Credentials — Zero Tolerance

Scan every line, key, and value. Credentials grant access; internal names, non-access-bearing URLs, and mock labels do not trigger rotation warnings by themselves.

If any credential is found, always output after Step 4:

> **"⚠️ 发现了安全敏感内容（凭据/密钥/令牌）{已移除/仅预览}。如果此文件曾被提交、推送或分享，请立即轮换受影响的凭证。Security-sensitive content (credentials/keys/tokens) was found {and removed / preview only}. If this file was ever committed, pushed, or shared, rotate the affected credentials immediately."**

Use `and removed`, `preview only`, or `found but not removed` to match the outcome. Never echo or itemize secret values. Do not modify credentials in executable code; report the line for review. Replace config credentials only with a format-safe placeholder; otherwise leave them and request review.

### Step 3: Strip Style Leakage and User Targets

Remove unshared rule references, AI-facing rationale/guardrails, AI self-reference, thought-process traces, and allowed matches for user-specified targets.

### Step 4: Verify

Validate a temporary candidate before changing the original:
- **JSON**: run `python3 -c "import json; json.load(open('FILE'))"` or `jq . FILE`
- **YAML**: run `python3 -c "import yaml; yaml.safe_load(open('FILE'))" 2>/dev/null`. If this fails with `ModuleNotFoundError` (PyYAML is NOT standard library), fall back to visual inspection — do NOT treat the missing module as a YAML syntax error.
- **XML**: run `xmllint --noout FILE`
- **Code files**: visually check brace/bracket matching, import/directive integrity
- **Markdown**: check heading hierarchy and code block delimiter matching

After stripping, re-read the candidate once. On failure, discard it and leave the original untouched. Report: "Structural issue detected after cleaning — file left unchanged. Human review needed." Replace atomically where supported. If only visual verification is available, report that limitation.

## Sub-Agent Review (`--use-subagent`)

The sub-agent reviews only; the main agent applies edits and owns all validation, confirmation, warnings, output modes, and writes.

1. Resolve and validate selected files in the main agent. For session-default selection, wait for the user's H3 choices and skip delete choices. Then spawn one fresh-context sub-agent per selected file. If unavailable, report the non-isolated fallback and review in the main agent.
2. Give the sub-agent references, not copied content:
   - the selected target file path;
   - [references/leakage-categories.md](references/leakage-categories.md) plus this file's Step 1-3 review criteria;
   - every user-specified target, preserving its exact wording;
   - the relevant rule in `Strip Strategy by File Type`.
3. Scope the sub-agent: read only those references; do not inspect other files, Git history, or conversation context; do not write/delete files, run validation, choose output modes, or spawn agents.
4. Return edit suggestions only. Each suggestion includes `<file>:<line-range>`, built-in category or `user target: <target>`, and action (`remove sentence/block/comment`, `replace config credential with a safe placeholder`, or `human review`). Also signal `credential found` or `purge candidate` without echoing secrets. Return an empty list for zero matches.
5. The main agent checks every suggestion against the original file and this skill, applies allowed edits, then runs Step 4 and the selected output mode. `--dry-run` presents the suggestions instead.

Suggestions are advisory: executable code remains unchanged, and the main agent may reject any suggestion outside the permitted scope.

## Strip Strategy by File Type

- **Code** (.java, .py, .ts, .go, .rs, .js, etc.): Remove comment lines and doc strings matching leakage categories or user targets. Keep executable code as-is. If removing a comment would leave an empty comment block (e.g., `/** */`), remove the whole block.
- **Markdown** (.md): Remove paragraphs and sentences matching leakage categories or user targets. Keep technical content.
- **Config** (.yml, .yaml, .json, .xml, .toml, .env, .properties, .ini, .cfg): Remove leakage comments and sensitive values. Keep config structure and non-sensitive values. For YAML block scalars (`|`, `>`), if stripping a line would alter indentation, replace the entire scalar value rather than performing partial strip.
- **Other**: Remove any comment or prose matching the leakage categories or user targets.

## Execution Rules

### Silent Execution

Leave no trace of cleanup: no announcements, removed-item lists, markers, metadata, visible gaps, or unrelated formatting changes.

**If the user asks** "what did you remove?" or "did you clean the file?" — respond factually but briefly: "X leakage categories were addressed." Do not itemize. Do not celebrate.

### Explicit Exceptions to Silence

These are the ONLY cases where `/hiding` produces output beyond the HITL decision flow:

1. **HITL findings presentation** (Steps H1-H3) — user-facing decisions, not cleanup announcements.
2. **Step 1 purge check** — asking the user whether to delete a file.
3. **Secret and credential warning** (Step 2) — mandatory security warning. "⚠️ 发现并移除了安全敏感内容... rotate credentials immediately."
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

### Behavior Guardrails

- No leakage found (non-HITL modes) → do nothing, say nothing
- Code logic is NEVER changed — only comments and prose are stripped
- Multi-line leakage blocks → remove the whole block
- Preserve the file's original line ending style (LF vs CRLF)
- Before writing, check if the file was modified since reading (compare mtime); if changed, warn and abort
