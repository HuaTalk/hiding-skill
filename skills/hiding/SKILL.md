---
name: hiding
description: Use this skill when files have AI-generated artifacts that need to be removed before committing, pushing, or sharing, OR when the user wants to hide/clean sensitive content from the session. 当文件包含AI生成的残留内容需要在提交/推送/分享前移除时，或用户想要隐藏/清理会话中的敏感内容（如AI痕迹、规则泄露、凭证密钥、内部代号、mock数据标记）时使用此技能。Handles: (1) AI comments and reasoning in code — "as an AI", "I think", process narration, (2) design docs, research notes, and decision records that are mostly AI thought process — offers to delete, (3) credentials and secrets in config files — API keys, passwords, connection strings left from generation, (4) AI-derived rationale traces — "we chose X because Y", reasoning trails. Goal: make files read as if human-written from the start. Works on code, config (YAML/JSON/TOML), and markdown. File-scoped only — does not modify conversation output. When called without arguments, performs session-aware HITL analysis to identify and suggest what needs hiding.
metadata:
  author: HuaTalk
  version: "0.5.0"
  category: output-discipline
---

# /hiding

Strip AI leakage from files. Cleaned files should read as if written by a human — no traces of AI reasoning, no rule citations, no self-reference.

**Scope**: Files only (code, config, markdown, docs). Does NOT modify agent replies or conversation output.

## Usage

```
/hiding                       Analyze session for leakage, suggest what to hide (HITL)
/hiding <file>                Clean a specific file
/hiding <description>         Hide content matching the description (e.g., "/hiding mock data")
```

### Mode Selection

When `/hiding` is invoked:

1. **No arguments** → **Session-Aware HITL mode**. Analyze the conversation context, identify leakage candidates, present findings to the user for decision. Do NOT clean anything until the user confirms.
2. **Argument is a file path** (contains `/` or `\`, or ends with a known extension: `.java`, `.md`, `.yml`, `.py`, `.ts`, `.go`, `.rs`, `.json`, `.xml`, `.toml`) → **File mode**. Execute Steps 0–4 on the specified file.
3. **Argument is a description** (natural language, not resolvable as a file path) → **Description mode**. Identify files in context whose content matches the description, apply relevant hide patterns, execute silently.

## Session-Aware HITL (No-Argument Mode)

When `/hiding` is called without arguments, do NOT immediately clean anything. Instead, analyze the session and let the user decide.

### Step H1: Session Inventory

Review the conversation context to inventory what may contain leakage:

- **Files created or modified**: All files written or edited during this session.
- **Topics discussed**: Domains, systems, projects, or internal names that appeared.
- **Sensitive content**: Credentials, tokens, internal URLs, project codenames, server names, IPs, mock data labels mentioned in conversation.
- **AI reasoning traces**: Design discussions, rationale trails, research findings, thought processes visible in the conversation.

### Step H2: Leakage Candidate Detection

Scan each inventoried file against the 5 leakage patterns (S/R/C/A/T, defined below). Organize findings into three tiers:

**Tier 1 — File-Level Purge Candidates**
Files where removing all Pattern T/C content leaves < 20% substantive content, or files matching 2+ purge signals (see Step 1 criteria). These have no meaningful "clean" version — present as deletion candidates.

**Tier 2 — Files with Inline Leakage**
Files containing specific leakage instances but with substantial clean content. Summarize what was found (e.g., "2 AI self-reference comments, 1 credential").

**Tier 3 — Session-Level Concerns**
Content discussed in conversation that may have propagated into files, but needs user confirmation. Examples: "Mock data was discussed — check OrderService.java for mock data labels", "Internal codename 'Project Falcon' appeared — check docs for references."

### Step H3: Present Findings (HITL)

Use AskUserQuestion to present findings:

**Question**: "I analyzed this session and found potential leakage. What would you like to hide?"

Options:
- For each Tier 1 file: `Delete <filename> (appears to be AI thought process)`
- For each Tier 2 file: `Clean <filename> (<N> leakage instances)`
- For Tier 3 concerns: `Hide <concern description>`
- `Hide everything found` — apply all recommendations
- `Nothing — leave as is`

If zero leakage found across all tiers: say nothing, stop.

### Step H4: Execute User Choices

- **File deletion** → delete the file. Do not announce.
- **File cleaning** → run Steps 0–4 on the file (silent execution).
- **Description-based hiding** → apply relevant patterns to matching files. Silent execution.

After execution, do NOT announce results unless the user explicitly asks.

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

Examples: "I'll start by...", "First let me...", "接下来我...", "Here's the result:", "As requested:", "I think...", "I believe...", "I assume...", "As an AI...", "As Claude...", "I hope this helps!", "Great question!", "Let me know if...", TODO/FIXME/HACK markers, self-corrections in comments.

### Pattern T: Thought Process & Derivation

**Principle**: Content that documents how the AI arrived at a result — research logs, design rationale trails, progress entries, step-by-step reasoning. If it reads like a lab notebook rather than a reference document, it's leakage.

Examples: "we chose X because...", step-by-step reasoning trails, dated progress logs, research findings, decision records, "调研发现...", "设计决策...", "进度...", "progress".

> **Note on overlap**: Patterns intentionally overlap at the edges. When in doubt, apply the stricter judgment. The goal is not perfect classification — it's removing everything that shouldn't be there.

## Execution Order (File Mode & Description Mode)

Apply these steps in order. Each step gates the next.

### Step 0: Validate

- File doesn't exist → report error, stop.
- File is binary or empty → do nothing, say nothing, stop.
- File is too large to read in one pass → report the limitation, stop.

### Step 1: File-Level Purge Check (HITL)

Before any stripping, evaluate whether the **entire file** is AI thought process. This is the single most important check — stripping individual lines from a thought-process file is wasted work.

Use a **quantitative threshold** to make the call:

1. Mentally estimate: if all content matching Pattern T were removed, what percentage of the file's substantive content remains?
2. **If remaining content < 20%** → the file has no meaningful "clean" version. Trigger HITL deletion.

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

Strip Pattern S content first, before anything else. This is the security layer — no false negatives.

Scan every line, every key, every value for credentials and internal identifiers. When in doubt, strip it. A false positive here removes a config comment; a false negative leaks a credential.

### Step 3: Strip Style Leakage (Patterns R, C, A, T)

With secrets handled, remove the remaining leakage patterns. These are cosmetic/quality concerns — still important, but lower stakes than Step 2.

### Step 4: Verify

After stripping, quick sanity check:
- Code files: do braces/brackets still match? Are imports intact?
- Config files: is YAML/JSON/TOML still valid?
- Markdown: are headings and code blocks intact?

If stripping broke something structural, leave a minimal necessary structure (e.g., keep a valid comment wrapper with empty body rather than deleting the whole javadoc block and breaking the syntax).

## Strip Strategy by File Type

- **Code** (.java, .py, .ts, .go, .rs, etc.): Remove comment lines and doc strings containing leakage. Keep executable code as-is. If removing a comment would leave an empty comment block (e.g., `/** */`), remove the whole block.
- **Markdown** (.md): Remove leakage paragraphs and sentences. Keep technical content.
- **Config** (.yml, .json, .xml, .toml): Remove leakage comments and sensitive values. Keep config structure and non-sensitive values.
- **Other**: Remove any comment or prose matching the leakage patterns.

## Execution Rules

### Why Silence Is Essential

The `/hiding` operation creates an illusion: that these files were originally written by a human. Every trace of cleanup threatens this illusion. Consider three levels of failure:

1. **Explicit markers**: Adding "// cleaned by /hiding" or "--- /hiding applied ---" to the file. **Worst** — directly contradicts the illusion.
2. **Verbal acknowledgment**: Saying "file cleaned" or "removed 5 instances of leakage". **Bad** — the reader of the conversation now knows `/hiding` was applied, breaking trust in the file's authenticity.
3. **Silent artifacts**: Leaving extra blank lines where content was removed, changing indentation, normalizing whitespace. **Subtle but real** — careful readers will notice something changed.

The target: **after `/hiding` runs, no one should be able to tell it ran** — not from the file content, not from the conversation, not from any side effect.

**Do not:**
- Announce what was removed or list cleaned items
- Say "file cleaned", "/hiding applied", or any equivalent phrase
- Add cleanup markers, annotations, or metadata to the file
- Leave visible gaps where content was removed (collapse empty lines naturally)
- Change indentation, line endings, or any formatting unrelated to the leakage itself
- Mention the skill has been applied in any conversation output

**If the user asks** "what did you remove?" or "did you clean the file?" — respond factually but briefly: "X patterns were addressed." Do not itemize. Do not celebrate.

> **Exception — HITL interactions**: The Session-Aware HITL mode (no-argument) and Step 1 File-Level Purge Check are the only cases where `/hiding` produces visible output. These are user-facing decisions, not cleanup announcements. After the user confirms and execution runs, revert to silence.

### Behavior Guardrails

- No leakage found → do nothing, say nothing
- File doesn't exist → report the error only
- Code logic is NEVER changed — only comments and prose are stripped
- Multi-line leakage blocks → remove the whole block
- After stripping, re-read the file once to verify structural integrity
