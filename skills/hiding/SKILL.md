---
name: hiding
description: Strip AI leakage from files before committing, pushing, or sharing. 在提交/推送/分享前清理文件中的AI残留痕迹。Supports inplace/newfile/backup output modes, dry-run preview, sub-agent execution, and credential-security warnings. 支持原地修改/新建文件/备份修改三种输出模式、预览模式、子代理执行、凭证安全告警。
metadata:
  author: HuaTalk
  version: "0.6.0"
  category: output-discipline
---

# /hiding

Strip AI leakage from files. Cleaned files should read as if written by a human — no traces of AI reasoning, no rule citations, no self-reference.

**Scope**: Files only (code, config, markdown, docs). Does NOT modify agent replies or conversation output.

## Usage

```
/hiding                              Analyze session + git uncommitted for leakage (HITL)
/hiding <file>                       Clean a specific file
/hiding <description>                Hide content matching the description (e.g., "/hiding mock data")
```

### Flags (optional, can appear anywhere in the argument)

| Flag | Values | Default | Description |
|------|--------|---------|-------------|
| `--mode` | `inplace` / `newfile` / `backup` | `inplace` | Output mode (see Output Modes below) |
| `--subagent` | (boolean flag) | off | Delegate stripping to a sub-agent for cleaner isolation |
| `--dry-run` | (boolean flag) | off | Preview what would change without modifying any files |

**Examples:**
```
/hiding --mode newfile file.java          Clean file.java, output to file-cleaned.java
/hiding --mode backup file.java           Rename original to file.java.bak, write cleaned version
/hiding --dry-run file.java               Show what would be stripped, don't modify
/hiding --subagent file.java              Use sub-agent to strip leakage
/hiding --mode newfile --subagent --dry-run file.java   Preview sub-agent output to new file
/hiding --dry-run                         HITL preview: show findings without executing
```

### Flag Parsing

Before mode selection, parse flags from the argument string. Remove parsed flags; the remaining text is the mode argument (file path, description, or empty for HITL).

**Flag syntax**: `--name value` (valued flags) or `--name` (boolean flags). `--name=value` form also accepted. If a `--` token starts a known flag name, it is a flag — otherwise the leading `--` tokens are treated as an unknown flag.

**Validation (report error, stop — do NOT silently fall back to default):**
- `--mode` without a value, or value not in `{inplace, newfile, backup}` → report: "Invalid --mode value. Use inplace, newfile, or backup." If the token after `--mode` itself starts with `--` (e.g. `--mode --dry-run`), treat `--mode` as missing its value — do NOT consume the next flag as the mode value.
- Any token starting with `--` that is not a recognized flag → report: "Unknown flag: <flag>. Known flags: --mode, --subagent, --dry-run."

These are explicit errors, not silent fallbacks. A misspelled flag (e.g. `--dryrun`, `--mod newfile`) must surface, not be swallowed into Description mode.

### Mode Selection

When `/hiding` is invoked (after flag parsing):

1. **No non-flag arguments** → **Session-Aware HITL mode**. Analyze conversation context + git uncommitted files, identify leakage candidates, present findings to the user for decision. Do NOT clean anything until the user confirms.
2. **Argument is a file path** (resolves to an existing file, OR contains `/` or `\`, OR ends with a known extension: `.java`, `.md`, `.yml`, `.yaml`, `.py`, `.ts`, `.js`, `.tsx`, `.jsx`, `.go`, `.rs`, `.json`, `.xml`, `.toml`, `.env`, `.sh`, `.tf`, `.rb`, `.cs`, `.kt`, `.swift`, `.c`, `.h`, `.cpp`, `.hpp`, `.css`, `.html`, `.sql`, `.properties`, `.ini`, `.cfg`, `.dockerfile`) → **File mode**. Execute Steps 0–4 on the specified file.
3. **Argument is a description** (natural language, not resolvable as a file path) → **Description mode**. Identify files in context whose content matches the description, apply relevant hide patterns.

## Output Modes

The `--mode` flag controls where cleaned content is written. Applies to File mode and Description mode (for HITL mode, the user selects per-file actions in Step H3).

### `inplace` (default)

Modify the file in place. This is the classic `/hiding` behavior — read → strip → write to the same file.

### `newfile`

Create a new file with cleaned content; leave the original untouched.
- Naming: `<stem>-cleaned.<ext>` (e.g., `UserService.java` → `UserService-cleaned.java`)
- Extension-less files: `<name>-cleaned` (e.g., `Dockerfile` → `Dockerfile-cleaned`)
- If the cleaned file already exists, overwrite it.
- Do NOT announce the new file name. The file simply appears.

### `backup`

Rename the original file as a backup, then write the cleaned content to the original filename.
- Rename original: `<name>.<ext>` → `<name>.<ext>.bak` (e.g., `config.yml` → `config.yml.bak`)
- Write cleaned content to `<name>.<ext>` (the original name)
- If `.bak` already exists, overwrite it.
- Do NOT announce the backup operation.

### `--dry-run` (Preview Mode)

When `--dry-run` is set, do NOT modify any files. Instead:
- **File mode**: Read the file, identify all leakage instances (which patterns, which lines), and present a summary: "Would remove N instances: X Pattern S, Y Pattern A, Z Pattern T/C... [show each instance with line context]". Use AskUserQuestion only if Step 1 purge check triggers; otherwise present the summary directly.
- **Description mode**: Identify matching files, show what would be cleaned in each, do not modify.
- **HITL mode**: Run H1-H3 normally, present findings, but when user confirms, show what would be done instead of executing.
- This is a user-requested preview — it is NOT a violation of the silence principle.

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
- **Sensitive content**: Credentials, tokens, internal URLs, project codenames, server names, IPs, mock data labels mentioned in conversation.
- **AI reasoning traces**: Design discussions, rationale trails, research findings, thought processes visible in the conversation.

### Step H2: Leakage Candidate Detection

Scan each inventoried file against the 5 leakage patterns (S/R/C/A/T, defined below). Organize findings into four tiers:

**Tier 0 — Security Critical (always shown first)**
Files containing Pattern S (credentials, tokens, API keys, passwords). These are actual security risks, not cosmetic issues. Must be called out separately and prominently. If a credential has ever been committed, pushed, or shared, the user MUST be warned to rotate it.

**Tier 1 — File-Level Purge Candidates**
Files that fail the Step 1 qualitative purge test (no section survives as standalone reference after removing Patterns T, C, and A), or files matching 2+ purge signals (see Step 1 criteria). These have no meaningful "clean" version — present as deletion candidates.

**Tier 2 — Files with Inline Leakage**
Files containing specific leakage instances but with substantial clean content. Summarize what was found (e.g., "2 AI self-reference comments, 1 credential").

**Tier 3 — Session-Level Concerns**
Content discussed in conversation that may have propagated into files, but needs user confirmation. Examples: "Mock data was discussed — check OrderService.java for mock data labels", "Internal codename 'Project Falcon' appeared — check docs for references."

### Step H3: Present Findings (HITL)

If zero leakage found across all tiers (including zero files in the inventory): respond with a brief confirmation — **"未在此会话和未提交文件中发现 AI 泄露痕迹。No AI leakage found in this session and uncommitted files."** This is NOT a cleanup announcement; it is a completion signal for an interactive mode. Stop here.

If leakage found, use AskUserQuestion to present findings:

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

- **File deletion** → delete the file. Do not announce.
- **File cleaning** → run Steps 0–4 on the file, applying the output mode.
- **Description-based hiding** → apply relevant patterns to matching files, applying the output mode.

After execution, do NOT announce results unless the user explicitly asks. Exception: credential warnings (see Step 2).

## What to Strip — Guided by Principles, Not Keywords

Don't grep for specific phrases. Use these **principles** to judge whether content is leakage. The examples help calibrate your judgment, but the principle is what matters.

### Pattern S: Secret & Sensitive

**Principle**: Any credential, endpoint, or identifier that grants access or reveals internal infrastructure. These are actual security risks, not cosmetic issues.

Examples: API keys, tokens, passwords, connection strings, internal URLs (`.internal.example.com`), project codenames, mock data labels, server names, IPs.

### Pattern R: Rule & Context Leakage

**Principle**: Content that references knowledge the reader doesn't have — skill instructions, CLAUDE.md conventions, architecture documents, team standards. If a reader who only has this file would be confused by a reference, it's leakage.

Examples: "as instructed by...", "following the convention...", "per the skill...", "I recall from the docs...", "the codebase follows a pattern where...", "根据 CLAUDE.md...", "按照...的约定".

### Pattern C: Constraint & Rationale

**Principle**: Content that explains why a choice was made rather than documenting what was chosen. The output should state decisions, not justify them. If the reasoning is about constraints the AI faced (not business constraints), it's leakage.

Examples: "I can't use X because the team standard requires...", "不能使用 X 因为团队用 Y", "由于规范要求...", "we chose X because...", "the reason for Y is...", "调研发现...", "设计决策...".

### Pattern A: AI Self-Reference

**Principle**: Any language that reveals the author is an AI — first-person narration of actions, confidence hedging, identity disclosure, meta-commentary on the output itself. Human-written files don't say "Here's the result:" or "I hope this helps!".

Examples: "I'll start by...", "First let me...", "接下来我...", "Here's the result:", "As requested:", "I think...", "I believe...", "I assume...", "As an AI...", "As Claude...", "I hope this helps!", "Great question!", "Let me know if...", self-corrections in comments.

> **Note: TODO/FIXME/HACK markers are NOT automatically AI leakage.** Human developers write these all the time. Judge them by context — if accompanied by AI narration ("TODO: I'll implement this later after I figure out..."), strip the narration but the marker itself may be legitimate.

### Pattern T: Thought Process & Derivation

**Principle**: Content that documents how the AI arrived at a result — research logs, design rationale trails, progress entries, step-by-step reasoning. If it reads like a lab notebook rather than a reference document, it's leakage.

Examples: "we chose X because...", step-by-step reasoning trails, dated progress logs, research findings, decision records, "调研发现...", "设计决策...", "进度...", "progress".

> **Note on overlap**: Patterns intentionally overlap at the edges. When in doubt, apply the stricter judgment. The goal is not perfect classification — it's removing everything that shouldn't be there. Pattern C (constraint rationale) and Pattern T (thought process) have significant overlap; when they blur together, stripping is the correct action.

## Execution Order (File Mode & Description Mode)

Apply these steps in order. Each step gates the next.

### Step 0: Validate

- File doesn't exist → report error, stop.
- File is a directory → report error: "/hiding works on individual files, not directories."
- File is binary (detected by null bytes or `file` command indicating non-text) → report error: "This appears to be a binary file. /hiding only works on text files."
- File is empty → report briefly: "File is empty — nothing to clean." (An empty file is user-visible and gets a response)
- File is too large to read in one pass (> 10,000 lines or > 500KB) → report the limitation, suggest splitting.

### Step 1: File-Level Purge Check (HITL)

Before any stripping, evaluate whether the **entire file** is AI thought process. This is the single most important check — stripping individual lines from a thought-process file is wasted work.

Use this **qualitative test** (not a percentage estimate):

> After removing all content matching Patterns T, C, and A, would any section of the file survive as standalone reference documentation? If NO section would be useful on its own — every paragraph is process narration, every section is derivation — the file is a purge candidate.

Additional purge signals (any 2+ strongly suggest purge):
- File name or top-level heading contains: "findings", "progress", "decision", "调研", "进度", "决策", "记录", "research", "design rationale"
- Contains dated log entries (e.g., "2026-06-10: did X", "2026-06-11: did Y")
- Content structure alternates between "what I did" and "why I did it" — reads like a work journal
- No section in the file would survive as standalone reference documentation
- File describes the *process* of arriving at a decision, not the decision itself

**HITL protocol:**

1. Do NOT strip in-place.
2. Ask the user via AskUserQuestion: "This file appears to be AI thought process documentation (research notes, design rationale, derivation trail). Delete it?"
3. If confirmed → delete the file, nothing more to do.
4. If declined → leave untouched, stop here.

### Step 2: Strip Secrets (Pattern S) — Zero Tolerance

Strip Pattern S content first, before anything else. This is the security layer.

Scan every line, every key, every value for credentials and internal identifiers. When in doubt, strip it. A false positive here removes a config comment; a false negative leaks a credential.

**⚠️ CREDENTIAL WARNING — Mandatory Exception to Silence:**

If ANY Pattern S content is **found** (regardless of whether it was stripped or only previewed in dry-run), you MUST output this warning after Step 4 completes:

> **"⚠️ 发现了安全敏感内容（凭据/密钥/令牌）{已移除/仅预览}。如果此文件曾被提交、推送或分享，请立即轮换受影响的凭证。Security-sensitive content (credentials/keys/tokens) was found {and removed / preview only}. If this file was ever committed, pushed, or shared, rotate the affected credentials immediately."**

Use the version matching the mode: "已移除 / and removed" when actually stripped; "仅预览 / preview only" when in `--dry-run` (nothing modified). The warning MUST fire in both cases — the credential was **found** regardless.

This is the ONLY mandatory exception to silent execution. Do NOT itemize what was removed — just warn that credentials were present and need rotation. A silent credential strip where the user doesn't know to rotate is worse than a noisy one.

If a secret is embedded in executable code (not a comment, not a config value), do NOT silently modify the code. Flag the file and line for human review, and report: "凭据出现在可执行代码中，需要人工审查。Credential found in executable code — human review required."

### Step 3: Strip Style Leakage (Patterns R, C, A, T)

With secrets handled, remove the remaining leakage patterns. These are cosmetic/quality concerns — still important, but lower stakes than Step 2.

### Step 4: Verify

After stripping, verify structural integrity. Use actual parsers when available:
- **JSON**: run `python3 -c "import json; json.load(open('FILE'))"` or `jq . FILE`
- **YAML**: run `python3 -c "import yaml; yaml.safe_load(open('FILE'))" 2>/dev/null`. If this fails with `ModuleNotFoundError` (PyYAML is NOT standard library), fall back to visual inspection — do NOT treat the missing module as a YAML syntax error.
- **XML**: run `xmllint --noout FILE`
- **Code files**: visually check brace/bracket matching, import/directive integrity
- **Markdown**: check heading hierarchy and code block delimiter matching

If stripping broke something structural, restore the original content and report the issue — structural repair is too risky to attempt autonomously. Report: "Structural issue detected after cleaning — file left unchanged. Human review needed."

If a deterministic parser is not available, report: "⚠️ Structural verification was visual only. Consider validating the file with a parser before committing."

## Sub-Agent Execution (`--subagent`)

When the `--subagent` flag is set, do NOT perform the stripping yourself. Instead:

1. **Spawn a sub-agent** using the Agent tool. The sub-agent's task is to strip AI leakage from the specified file(s) following Steps 0–4.
2. **Pass the file content** (the full text) and these execution instructions (Steps 0–4, the five patterns, and strip strategy by file type) to the sub-agent.
3. **The sub-agent returns the result** as its final response — format depends on dry-run (see below).
4. **Apply the output mode** (`--mode`) to write the result — the main agent handles file I/O based on the sub-agent's output.

**Why use a sub-agent?** A sub-agent has a fresh context without the conversation history. It sees only the file content and the hiding instructions. This isolation can produce more disciplined stripping — the sub-agent has no attachment to the content it didn't create and no knowledge of the "intent" behind the original generation. It judges purely by the principles.

**What to pass to the sub-agent (scope guard):**
- The five leakage patterns (S/R/C/A/T) with principles and examples
- Steps 0–4 execution order
- Strip strategy by file type
- The dry-run instruction appropriate to the mode (see below)
- An explicit no-recursion rule: "You are a leaf task. Do NOT spawn further sub-agents. Return your result directly."

**Do NOT pass to the sub-agent:** the Usage section, Mode Selection, Output Modes, the Sub-Agent Execution section itself, the HITL flow, or Execution Rules. The sub-agent needs only the stripping logic. (The no-recursion rule above is the only meta-instruction it receives — keep it in the pass-list so it actually reaches the sub-agent.)

**Dry-run determines the sub-agent's task and return format:**
- **Without `--dry-run`**: instruct the sub-agent: "Return ONLY the cleaned file content. Do not add explanations, markers, or commentary." The main agent writes this per the output mode.
- **With `--dry-run`**: instruct the sub-agent: "Identify all leakage instances in the file. For each, report the pattern (S/R/C/A/T), the line number, and the matched text. Do NOT return cleaned content." The main agent presents this list without writing any file. (The credential warning from Step 2 still fires if any Pattern S is found.)

**HITL + `--subagent`**: in no-argument HITL mode, after the user selects files to clean in Step H3, spawn ONE sub-agent per selected file (passing that file's content). Apply the chosen output mode to each sub-agent's result. Sub-agent is skipped for the user's "delete" choices (deletion needs no stripping).

**Default: sub-agent is OFF.** Most invocations don't need the overhead of spawning a sub-agent. Use `--subagent` for sensitive or important files where extra discipline is warranted.

## Strip Strategy by File Type

- **Code** (.java, .py, .ts, .go, .rs, .js, etc.): Remove comment lines and doc strings containing leakage. Keep executable code as-is. If removing a comment would leave an empty comment block (e.g., `/** */`), remove the whole block.
- **Markdown** (.md): Remove leakage paragraphs and sentences. Keep technical content.
- **Config** (.yml, .yaml, .json, .xml, .toml, .env, .properties, .ini, .cfg): Remove leakage comments and sensitive values. Keep config structure and non-sensitive values. For YAML block scalars (`|`, `>`), if stripping a line would alter indentation, replace the entire scalar value rather than performing partial strip.
- **Other**: Remove any comment or prose matching the leakage patterns.

## Execution Rules

### Why Silence Is Essential

The `/hiding` operation creates an illusion: that these files were originally written by a human. Every trace of cleanup threatens this illusion.

The target: **after `/hiding` runs, no one should be able to tell it ran** — not from the file content, not from the conversation, not from any side effect.

**Do not:**
- Announce what was removed or list cleaned items
- Say "file cleaned", "/hiding applied", or any equivalent phrase
- Add cleanup markers, annotations, or metadata to the file
- Leave visible gaps where content was removed (collapse empty lines naturally)
- Change indentation, line endings, or any formatting unrelated to the leakage itself
- Mention the skill has been applied in any conversation output

**If the user asks** "what did you remove?" or "did you clean the file?" — respond factually but briefly: "X patterns were addressed." Do not itemize. Do not celebrate.

### Explicit Exceptions to Silence

These are the ONLY cases where `/hiding` produces output beyond the HITL decision flow:

1. **HITL findings presentation** (Steps H1-H3) — user-facing decisions, not cleanup announcements.
2. **Step 1 purge check** — asking the user whether to delete a file.
3. **Pattern S credential warning** (Step 2) — mandatory security warning. "⚠️ 发现并移除了安全敏感内容... rotate credentials immediately."
4. **`--dry-run` preview** — user explicitly requested a preview.
5. **Zero findings in HITL** — brief confirmation: "未在此会话和未提交文件中发现 AI 泄露痕迹。"
6. **Structural verification failure** (Step 4) — report the issue, don't silently corrupt.
7. **Binary file / directory / empty file / invalid flag** — report the input error.
8. **External modification during operation** (mtime check) — warn and abort, don't overwrite concurrent changes.

### Behavior Guardrails

- No leakage found (non-HITL modes) → do nothing, say nothing
- File doesn't exist → report the error only
- Code logic is NEVER changed — only comments and prose are stripped
- Multi-line leakage blocks → remove the whole block
- After stripping, re-read the file once to verify structural integrity
- Preserve the file's original line ending style (LF vs CRLF)
- Before writing, check if the file was modified since reading (compare mtime); if changed, warn and abort
