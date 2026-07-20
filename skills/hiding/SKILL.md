---
name: hiding
description: Strip AI leakage from files before committing, pushing, or sharing. 在提交/推送/分享前清理文件中的AI残留痕迹。Supports targeted artifact removal, inplace/newfile/backup output modes, dry-run preview, sub-agent execution, and credential-security warnings. 支持定向清理、原地修改/新建文件/备份修改三种输出模式、预览模式、子代理执行、凭证安全告警。
argument-hint: "[<file-or-description>] [--mode <inplace|newfile|backup>] [--dry-run] [--use-subagent] [--artifacts <target>]..."
metadata:
  author: HuaTalk
  version: "0.8.0"
  category: output-discipline
---

# /hiding

Strip AI leakage from files so they read as human-written: no AI reasoning traces, rule citations, or self-reference.

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
/hiding [<file-or-description>] [--mode <inplace|newfile|backup>] [--dry-run] [--use-subagent] [--artifacts <target>]...

/hiding                              Analyze session + git uncommitted for leakage (HITL)
/hiding <file>                       Clean a specific file
/hiding <description>                Hide content matching the description (e.g., "/hiding mock data")
/hiding --artifacts "<target>" [...]   Targeted mode: hide ONLY the specified content (see Targeted Strip)
```

### Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `<file-or-description>` | No | Existing or file-like path selects File mode; other text selects Description mode; omitted selects HITL mode |
| `--artifacts <target>` | No, repeatable | Selects the content to hide and enables Targeted mode |

Flags may appear before or after the positional argument. Valued flags accept both `--name value` and `--name=value`.

### Flags

| Flag | Values | Default | Description |
|------|--------|---------|-------------|
| `--mode` | `inplace` / `newfile` / `backup` | `inplace` | Output mode (see Output Modes below) |
| `--use-subagent` | (boolean flag) | off | Delegate stripping to a sub-agent for cleaner isolation |
| `--dry-run` | (boolean flag) | off | Preview what would change without modifying any files |
| `--artifacts` | `"<target>"` (repeatable) | (none) | Targeted mode: hide only content matching the given target(s); the five built-in leakage categories are NOT scanned (see Targeted Strip below) |

**Examples:**
```
/hiding --mode newfile file.java          Clean file.java, output to file-cleaned.java
/hiding --dry-run file.java               Show what would be stripped, don't modify
/hiding --mode newfile --use-subagent --dry-run file.java   Preview sub-agent output to new file
/hiding --dry-run                         HITL preview: show findings without executing
/hiding --artifacts "ProjectX" file.java    Remove only ProjectX references from file.java
/hiding --artifacts "ProjectX" --artifacts "内部域名" --dry-run file.java   Preview matches for two targets
```

### Argument Parsing

Before mode selection, parse flags from the argument string. Remove parsed flags; the remaining text is the mode argument (file path, description, or empty for HITL).

**Flag syntax**: `--name value` (valued flags) or `--name` (boolean flags). `--name=value` form also accepted. If a `--` token starts a known flag name, it is a flag — otherwise the leading `--` tokens are treated as an unknown flag.

**Validation (report error, stop — do NOT silently fall back to default):**
- `--mode` without a value, or value not in `{inplace, newfile, backup}` → report: "Invalid --mode value. Use inplace, newfile, or backup." If the token after `--mode` itself starts with `--` (e.g. `--mode --dry-run`), treat `--mode` as missing its value — do NOT consume the next flag as the mode value.
- `--artifacts` without a value, with an empty-string value, or where the token after `--artifacts` itself starts with `--` (e.g. `--artifacts --dry-run`) → report: "Invalid --artifacts value. Provide a non-empty target description." Do NOT consume the next flag as the target value. `--artifacts` is repeatable — each occurrence must independently pass this validation.
- Any token starting with `--` that is not a recognized flag → report: "Unknown flag: <flag>. Known flags: --mode, --use-subagent, --dry-run, --artifacts."

These are explicit errors, not silent fallbacks. A misspelled flag (e.g. `--dryrun`, `--mod newfile`) must surface, not be swallowed into Description mode.

### Mode Selection

When `/hiding` is invoked (after flag parsing):

1. **No non-flag arguments** → **Session-Aware HITL mode**. Analyze conversation context + git uncommitted files, identify leakage candidates, present findings to the user for decision. Do NOT clean anything until the user confirms.
2. **Argument is a file path** (resolves to an existing file, OR contains `/` or `\`, OR ends with a known extension: `.java`, `.md`, `.yml`, `.yaml`, `.py`, `.ts`, `.js`, `.tsx`, `.jsx`, `.go`, `.rs`, `.json`, `.xml`, `.toml`, `.env`, `.sh`, `.tf`, `.rb`, `.cs`, `.kt`, `.swift`, `.c`, `.h`, `.cpp`, `.hpp`, `.css`, `.html`, `.sql`, `.properties`, `.ini`, `.cfg`, `.dockerfile`) → **File mode**. Execute Steps 0–4 on the specified file.
3. **Argument is a description** (natural language, not resolvable as a file path) → **Description mode**. Identify files in context whose content matches the description, apply relevant leakage categories.

**Description mode confirmation:** First produce a bounded candidate list (respecting the current repository and session inventory), including each file's planned action and output mode. Ask the user which candidates to process. Do not write, delete, or follow symlink targets until the user explicitly confirms the selected files. If no candidates are found, report that and stop.

**Targeted mode overlay**: if one or more `--artifacts` targets were parsed, the mode selection above still applies (File / Description / HITL by the remaining non-flag argument), but execution follows the **Targeted Strip (`--artifacts`)** section instead of the five-category flow. In Description mode the duties are separated: the description selects the FILES, the `--artifacts` targets select the CONTENT.

## Output Modes

The `--mode` flag controls where cleaned content is written. Applies to File mode and Description mode (for HITL mode, the user selects per-file actions in Step H3).

### `inplace` (default)

Modify the file in place. This is the classic `/hiding` behavior — read → strip → write to the same file.

### `newfile`

Create a new file with cleaned content; leave the original untouched.
- Naming: `<stem>-cleaned.<ext>` (e.g., `UserService.java` → `UserService-cleaned.java`)
- Extension-less files: `<name>-cleaned` (e.g., `Dockerfile` → `Dockerfile-cleaned`)
- If the target name already exists, do NOT overwrite it — it may be a hand-written file. Write to `<stem>-cleaned-2.<ext>` instead, incrementing (`-3`, `-4`, …) until a free name is found, and report one line: "`<target>` already existed — wrote to `<alternative>` instead." (Exception 9 — output-target collision.)

### `backup`

Rename the original file as a backup, then write the cleaned content to the original filename.
- Rename original: `<name>.<ext>` → `<name>.<ext>.bak` (e.g., `config.yml` → `config.yml.bak`)
- Write cleaned content to `<name>.<ext>` (the original name)
- If `<name>.<ext>.bak` already exists, do NOT overwrite it — it may hold the true original from an earlier run. Rename the original to `<name>.<ext>.bak-2` instead, incrementing until a free name is found, and report one line: "`<name>.<ext>.bak` already existed — original saved as `<alternative>`." (Exception 9 — output-target collision.)

### `--dry-run` (Preview Mode)

When `--dry-run` is set, do NOT modify any files. Instead:
- **File mode**: Read the file, identify all leakage instances (which categories, which lines), and present a summary: "Would remove N instances: X secrets, Y AI self-references, Z thought-process traces...". Show line context for non-secret categories only; for secrets show only the secret type and a redacted value (never the original value).
- **Description mode**: Identify and list matching candidate files and the planned action for each, then ask the user to confirm the selected files before any write. Do not modify during candidate discovery or preview.
- **HITL mode**: Run H1-H3 normally, present findings, but when user confirms, show what would be done instead of executing.
- Preview output is an explicit exception to silent execution.

## Session-Aware HITL (No-Argument Mode)

When `/hiding` is called without a file or description argument, do NOT immediately clean anything. Instead, analyze the session and let the user decide.

### Step H1: Session Inventory

Inventory all user artifacts from TWO sources:

**Source A — Current session files:**
Review the conversation context. Identify ALL files created or modified via Write/Edit tool calls during this session. List every file path that was touched.

**Source B — Git uncommitted changes:**
Run these commands to discover files the user has modified but hasn't committed:

```bash
git diff --name-only HEAD          # Modified tracked files (staged + unstaged)
git diff --name-only --diff-filter=D HEAD  # Deleted files (for awareness, not hiding)
```

Also list untracked files that look like user artifacts (skip build artifacts, node_modules):
```bash
git ls-files --others --exclude-standard
```

Merge Source A and Source B into a unified inventory. De-duplicate — a file that appears in both sources is counted once. This is the complete set of files that may contain leakage.

Also note from conversation context:
- **Topics discussed**: Domains, systems, projects, or internal names that appeared.
- **Sensitive content**: Credentials, tokens, internal URLs, project codenames, server names, IPs, and mock data labels mentioned in conversation. Treat only access-granting values as credentials for rotation warnings.
- **AI reasoning traces**: Design discussions, rationale trails, research findings, thought processes visible in the conversation.

### Step H2: Leakage Candidate Detection

Scan each inventoried file against the five leakage categories defined in [references/leakage-categories.md](references/leakage-categories.md). Organize findings into four tiers:

**Tier 0 — Security Critical (always shown first)**
Files containing secrets or credentials (tokens, API keys, passwords). These are actual security risks, not cosmetic issues. Must be called out separately and prominently. If a credential has ever been committed, pushed, or shared, the user MUST be warned to rotate it.

**Tier 1 — File-Level Purge Candidates**
Files that fail the Step 1 qualitative purge test (no section survives as standalone reference after removing thought-process traces, AI-facing rationale/guardrails, and AI self-reference), or files matching 2+ purge signals (see Step 1 criteria). These have no meaningful "clean" version — present as deletion candidates.

**Tier 2 — Files with Inline Leakage**
Files containing specific leakage instances but with substantial clean content. Summarize what was found (e.g., "2 AI self-reference comments, 1 credential").

**Tier 3 — Session-Level Concerns**
Content discussed in conversation that may have propagated into files, but needs user confirmation. Examples: "Mock data was discussed — check OrderService.java for mock data labels", "Internal codename 'Project Falcon' appeared — check docs for references."

### Step H3: Present Findings (HITL)

If zero leakage found across all tiers (including zero files in the inventory): respond with a brief confirmation — **"未在此会话和未提交文件中发现 AI 泄露痕迹。No AI leakage found in this session and uncommitted files."** This is NOT a cleanup announcement; it is a completion signal for an interactive mode. Stop here.

If leakage found, use the runtime's user-input mechanism to present findings. If unavailable, present the same choices in plain text and wait for an explicit selection:

**Question**: "I analyzed this session and found potential leakage. What would you like to hide?"

Always present Tier 0 (Security Critical) findings FIRST and most prominently.

Options:
- For Tier 0 files: `⚠️ SECURITY: Clean <filename> (credential found — rotate if ever committed!)`
- For each Tier 1 file: `Delete <filename> (appears to be AI thought process)`
- For each Tier 2 file: `Clean <filename> (<N> leakage instances)`
- For Tier 3 concerns: `Hide <concern description>`
- `Hide everything found` — apply all recommendations
- `Nothing — leave as is`

If the user selects a Tier 0 (credential) action, you MUST additionally warn: **"如果此文件曾被提交、推送或分享，请立即轮换受影响的凭证。If this file was ever committed, pushed, or shared, rotate the affected credentials immediately."**

### Step H4: Execute User Choices

Apply the user's selected output mode (`--mode`) to each action:

- **File deletion** → delete the file only after explicit confirmation. This action overrides `--mode` because it has no cleaned output; state that the file will be deleted before asking.
- **File cleaning** → run Steps 0–4 on the file, applying the output mode.
- **Description-based hiding** → apply relevant leakage categories to matching files, applying the output mode.

After execution, do NOT announce results unless the user explicitly asks. Exception: credential warnings (see Step 2).

## Leakage Categories

Detailed principles and examples are in [references/leakage-categories.md](references/leakage-categories.md). Read that file before scanning or stripping content. This table is only an index.

| Category | Summary |
|---------|---------|
| Secrets and credentials | Credentials and access-bearing endpoints; handle first and warn about rotation. |
| Unshared rule references | References to instructions or context unavailable to the file's reader. |
| AI-facing rationale/guardrails | AI-facing rationale instead of the chosen decision. |
| AI self-reference | Language that reveals AI authorship or narrates the output. |
| Thought-process traces | Research logs, derivation trails, and progress documentation. |

## Execution Order (File Mode & Description Mode)

Apply these steps in order. Each step gates the next.

Before Steps 1–3, read [references/leakage-categories.md](references/leakage-categories.md) and apply its principles rather than matching keywords.

### Step 0: Validate

- File doesn't exist → report error, stop.
- File is a directory → report error: "/hiding works on individual files, not directories."
- File is binary (detected by null bytes or `file` command indicating non-text) → report error: "This appears to be a binary file. /hiding only works on text files."
- File is empty → report briefly: "File is empty — nothing to clean." (An empty file is user-visible and gets a response)
- File is too large to read in one pass (> 10,000 lines or > 500KB) → report the limitation, suggest splitting.
- If the path is a symlink, do not replace the link target implicitly; report it and require explicit confirmation before following it.
- If the current directory is not a Git repository, or `HEAD` does not exist, skip Git inventory and continue with session files only; report the limitation in HITL mode.

### Step 1: File-Level Purge Check (HITL)

Before any stripping, evaluate whether the **entire file** is AI thought process. This is the single most important check — stripping individual lines from a thought-process file is wasted work.

Use this **qualitative test** (not a percentage estimate):

> After removing all thought-process traces, AI-facing rationale/guardrails, and AI self-reference, would any section of the file survive as standalone reference documentation? If NO section would be useful on its own — every paragraph is process narration, every section is derivation — the file is a purge candidate.

Additional purge signals (any 2+ strongly suggest purge):
- File name or top-level heading contains: "findings", "progress", "decision", "调研", "进度", "决策", "记录", "research", "design rationale"
- Contains dated log entries (e.g., "2026-06-10: did X", "2026-06-11: did Y")
- Content structure alternates between "what I did" and "why I did it" — reads like a work journal
- No section in the file would survive as standalone reference documentation
- File describes the *process* of arriving at a decision, not the decision itself

**HITL protocol:**

1. Do NOT strip in-place.
2. Ask the user via the runtime's user-input mechanism: "This file appears to be AI thought process documentation (research notes, design rationale, derivation trail). Delete it?" If no user-input tool exists, ask the same question in plain text and wait for an explicit yes/no reply.
3. If confirmed → delete the file, nothing more to do.
4. If declined → leave untouched, stop here.

### Step 2: Strip Secrets and Credentials — Zero Tolerance

Strip secrets and credentials first, before anything else. This is the security layer.

Scan every line, every key, and every value. Distinguish credentials (keys, tokens, passwords, connection strings) from merely sensitive context (internal names, URLs, mock labels). Credential findings trigger the rotation warning. Sensitive context may be removed from prose, but must not be treated as a credential unless it grants access.

**⚠️ CREDENTIAL WARNING — Mandatory Exception to Silence:**

If ANY secret or credential is **found** (regardless of whether it was stripped or only previewed in dry-run), you MUST output this warning after Step 4 completes:

> **"⚠️ 发现了安全敏感内容（凭据/密钥/令牌）{已移除/仅预览}。如果此文件曾被提交、推送或分享，请立即轮换受影响的凭证。Security-sensitive content (credentials/keys/tokens) was found {and removed / preview only}. If this file was ever committed, pushed, or shared, rotate the affected credentials immediately."**

Use the version matching the outcome: "已移除 / and removed" when the credential was actually stripped, "仅预览 / preview only" in `--dry-run`, and "发现但未移除 / found but not removed" when it remains in executable code or an invalid configuration value. The warning MUST fire in all cases — the credential was **found** regardless.

This is the ONLY mandatory exception to silent execution. Do NOT itemize or echo secret values — just warn that credentials were present and need rotation.

If a credential is embedded in executable code, do NOT modify it. Flag the file and line for human review, and report: "凭据出现在可执行代码中，需要人工审查。Credential found in executable code — human review required." Never include the credential value.

For configuration values, do not silently delete a value that changes runtime behavior. Replace a credential with a format-safe placeholder only when the format remains valid; otherwise leave the value unchanged, report that human review is required, and still issue the rotation warning.

### Step 3: Strip Style Leakage (unshared rule references, AI-facing rationale/guardrails, AI self-reference, and thought-process traces)

With secrets handled, remove the remaining leakage categories. These are cosmetic/quality concerns — still important, but lower stakes than Step 2.

### Step 4: Verify

After stripping, verify structural integrity on a temporary candidate before changing the original. Use actual parsers when available:
- **JSON**: run `python3 -c "import json; json.load(open('FILE'))"` or `jq . FILE`
- **YAML**: run `python3 -c "import yaml; yaml.safe_load(open('FILE'))" 2>/dev/null`. If this fails with `ModuleNotFoundError` (PyYAML is NOT standard library), fall back to visual inspection — do NOT treat the missing module as a YAML syntax error.
- **XML**: run `xmllint --noout FILE`
- **Code files**: visually check brace/bracket matching, import/directive integrity
- **Markdown**: check heading hierarchy and code block delimiter matching

If stripping broke something structural, discard the temporary candidate and leave the original content untouched. Report: "Structural issue detected after cleaning — file left unchanged. Human review needed." Only replace the original after validation succeeds; use an atomic replacement where the runtime supports it.

If a deterministic parser is not available, report: "⚠️ Structural verification was visual only. Consider validating the file with a parser before committing."

## Targeted Strip (`--artifacts`)

When one or more `--artifacts` targets are present, `/hiding` hides ONLY what the user specified. The five built-in leakage categories are NOT scanned, including secrets and credentials. This is a deliberate design decision: targeted mode does exactly what the user asked, nothing more.

**Targets are semantic descriptions**, which naturally include exact literals — `--artifacts "ProjectX"` matches the literal name and its obvious variants in context; `--artifacts "所有公司内部域名"` matches by meaning. No regex support. Targets are one-off: nothing is persisted between invocations.

### Execution Order (Targeted)

- **Step 0 (Validate)**: unchanged — same input checks as the standard flow.
- **Step 1 (Purge check)**: SKIPPED.
- **Step 2 (Secrets and credentials)**: SKIPPED.
- **Step 2' (Targeted Strip)**: for each target, locate semantic matches in the file:
  - Match in a **comment or prose** → delete the matched line; multi-line blocks are removed whole.
  - Match in **executable code, an identifier, or a config value** → do NOT modify the code. Flag the location and report: "目标内容出现在可执行代码中，需要人工审查。Target content found in executable code — human review required. (<file>:<line>)" This report is mandatory — a silently skipped match would leave the user believing it was hidden.
  - **Zero matches** for a target → silent. No "nothing found" message (use `--dry-run` to verify a target matches before running).
- **Step 3 (Five-pattern strip)**: SKIPPED.
- **Step 4 (Verify)**: unchanged — structural verification with parsers, restore on failure.

### Mode Combinations

- **File mode**: run the targeted flow on that file.
- **Description mode**: the description selects FILES; the `--artifacts` targets select CONTENT within them.
- **HITL mode** (no non-flag arguments): Step H1 inventory unchanged; Step H2 reports ONLY target matches (no five-category scan); Step H3 per-file confirmation, then targeted strip on confirmed files. Zero findings → "未发现匹配指定目标的内容。No content matching the specified targets was found."
- **`--mode`**: orthogonal — inplace/newfile/backup apply to the targeted result as usual.
- **`--dry-run`**: list each target with its matches (`<target>` → `<file>:<line>`: matched text). No writes.
- **`--use-subagent`**: pass the targets, Steps 0/2'/4, the strip strategy by file type, and the no-recursion rule. Do NOT pass the leakage categories reference — the sub-agent must not scan for them.

### Silence (Targeted)

The silence rules and exceptions apply unchanged, with these adjustments:
- Exceptions 2 (purge check) and 3 (credential warning) never fire — their steps are skipped.
- Exception 10 (target in executable code) is the only targeted-specific mandatory output.
- HITL zero-findings wording is target-specific (see Mode Combinations above).

## Sub-Agent Execution (`--use-subagent`)

When the `--use-subagent` flag is set, do NOT perform the stripping yourself. Instead:

1. **Spawn a sub-agent** using the runtime's sub-agent mechanism. If no sub-agent mechanism exists, continue in the main agent and apply the same scope guard.
2. **Pass the file content** (the full text) and these execution instructions (Steps 0–4, the five leakage categories, and strip strategy by file type) to the sub-agent.
3. **The sub-agent returns the result** as its final response — format depends on dry-run (see below).
4. **Apply the output mode** (`--mode`) to write the result — the main agent handles file I/O based on the sub-agent's output.

**What to pass to the sub-agent (scope guard):**
- The contents of [references/leakage-categories.md](references/leakage-categories.md)
- Steps 0–4 execution order
- Strip strategy by file type
- The dry-run instruction appropriate to the mode (see below)
- An explicit no-recursion rule: "You are a leaf task. Do NOT spawn further sub-agents. Return your result directly."

**Do NOT pass to the sub-agent:** the Usage section, Mode Selection, Output Modes, the Sub-Agent Execution section itself, the HITL flow, or Execution Rules. The sub-agent needs only the stripping logic. (The no-recursion rule above is the only meta-instruction it receives — keep it in the pass-list so it actually reaches the sub-agent.)

**Targeted mode (`--artifacts` + `--use-subagent`):** replace the pass-list above with: the `--artifacts` targets, Steps 0/2'/4 (the targeted execution order), the strip strategy by file type, the dry-run instruction appropriate to the mode, and the no-recursion rule. Do NOT pass the leakage categories reference — the sub-agent must strip only the user's targets.

**Dry-run determines the sub-agent's task and return format:**
- **Without `--dry-run`**: instruct the sub-agent: "Return ONLY the cleaned file content. Do not add explanations, markers, or commentary." The main agent writes this per the output mode.
- **With `--dry-run`**: instruct the sub-agent: "Identify all leakage instances in the file. For each, report the category, line number, and a short description. For secrets, report only the secret type and a redacted value; never return the matched secret. Do NOT return cleaned content." The main agent presents this list without writing any file. (The credential warning from Step 2 still fires if any secret is found.)

**HITL + `--use-subagent`**: in no-argument HITL mode, after the user selects files to clean in Step H3, spawn ONE sub-agent per selected file (passing that file's content). Apply the chosen output mode to each sub-agent's result. Sub-agent is skipped for the user's "delete" choices (deletion needs no stripping).

**Default: sub-agent is OFF.** Most invocations don't need the overhead of spawning a sub-agent. Use `--use-subagent` for sensitive or important files where extra discipline is warranted.

## Strip Strategy by File Type

- **Code** (.java, .py, .ts, .go, .rs, .js, etc.): Remove comment lines and doc strings containing leakage. Keep executable code as-is. If removing a comment would leave an empty comment block (e.g., `/** */`), remove the whole block.
- **Markdown** (.md): Remove leakage paragraphs and sentences. Keep technical content.
- **Config** (.yml, .yaml, .json, .xml, .toml, .env, .properties, .ini, .cfg): Remove leakage comments and sensitive values. Keep config structure and non-sensitive values. For YAML block scalars (`|`, `>`), if stripping a line would alter indentation, replace the entire scalar value rather than performing partial strip.
- **Other**: Remove any comment or prose matching the leakage categories.

## Execution Rules

### Silent Execution

After `/hiding` runs, no one should be able to tell it ran from the file content, conversation, or side effects.

**Do not:**
- Announce what was removed or list cleaned items
- Say "file cleaned", "/hiding applied", or any equivalent phrase
- Add cleanup markers, annotations, or metadata to the file
- Leave visible gaps where content was removed (collapse empty lines naturally)
- Change indentation, line endings, or any formatting unrelated to the leakage itself
- Mention the skill has been applied in any conversation output

**If the user asks** "what did you remove?" or "did you clean the file?" — respond factually but briefly: "X leakage categories were addressed." Do not itemize. Do not celebrate.

### Explicit Exceptions to Silence

These are the ONLY cases where `/hiding` produces output beyond the HITL decision flow:

1. **HITL findings presentation** (Steps H1-H3) — user-facing decisions, not cleanup announcements.
2. **Step 1 purge check** — asking the user whether to delete a file. (Not applicable in targeted mode — Step 1 is skipped.)
3. **Secret and credential warning** (Step 2) — mandatory security warning. "⚠️ 发现并移除了安全敏感内容... rotate credentials immediately." (Not applicable in targeted mode — Step 2 is skipped.)
4. **`--dry-run` preview** — user explicitly requested a preview.
5. **Zero findings in HITL** — brief confirmation: "未在此会话和未提交文件中发现 AI 泄露痕迹。" (Targeted mode wording: "未发现匹配指定目标的内容。")
6. **Structural verification failure** (Step 4) — report the issue, don't silently corrupt.
7. **Binary file / directory / empty file / invalid flag** — report the input error (including `--artifacts` validation errors).
8. **External modification during operation** (mtime check) — warn and abort, don't overwrite concurrent changes.
9. **Output-target collision** (`newfile`/`backup`) — the target file already exists; never overwrite it, write to a numbered alternative and report the name used.
10. **Target in executable code** (targeted mode, Step 2') — a `--artifacts` target matched executable code, an identifier, or a config value; report the location for human review instead of silently modifying code.

### Behavior Guardrails

- No leakage found (non-HITL modes) → do nothing, say nothing
- File doesn't exist → report the error only
- Code logic is NEVER changed — only comments and prose are stripped
- Multi-line leakage blocks → remove the whole block
- After stripping, re-read the file once to verify structural integrity
- Preserve the file's original line ending style (LF vs CRLF)
- Before writing, check if the file was modified since reading (compare mtime); if changed, warn and abort
