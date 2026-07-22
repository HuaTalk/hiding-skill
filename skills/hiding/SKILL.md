---
name: hiding
description: Strategically remove AI leakage, provenance clues, exposed constraints, credentials, and any user-specified content from files without changing executable behavior. Use for concealment or release hygiene. Triggers include clean AI traces, hide source, hide constraints, 隐藏 AI 痕迹、清理规则、隐藏数据来源、隐藏约束、清理 xxx 痕迹。
argument-hint: "[<what-to-hide>...] [--files <file>...|session|worktree] [options]"
metadata:
  author: HuaTalk
  version: "0.7.1"
  category: output-discipline
---

# /hiding

Strategically strip AI leakage, provenance clues, exposed constraints, and user-specified sensitive content from files without changing executable behavior.

**Scope**: Code, config, markdown, and documentation files only. Agent replies and conversation output are out of scope.

## Core Contract

- Do not inject persistent constraints into normal sessions.
- Process files only; do not modify agent replies or conversation output.
- Remove leakage without changing code logic or doing humanizer-style rewrites.
- Leave no cleanup trace, visible gap, marker, metadata, or unrelated formatting change.
- Stay silent unless a documented exception applies; with no findings outside Session HITL or `--dry-run`, do nothing and say nothing.
- On silent paths, emit tool calls only from the start and do not narrate analysis; after successful verification, end the turn with no text.
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

After parsing, process literal paths directly (bypassing automatic scope). For automatic selectors, load the matching conditional references below. Omitting `--files` is exactly equivalent to `--files session`.

Reject positional targets after the first flag, repeated `--files`, `--files=<file>`, unknown flags, invalid/missing `--mode`, and missing `--files` paths. A recognized flag ends the file list and is not a path. Report the error rather than guessing intent.

## Conditional References

Read only the references whose condition matches. For automatic selectors, load only the scope and selector references first; do not preload scan-only references while resolving scope.

| Condition | Read |
|-----------|------|
| Omitted `--files`, `--files session`, or `--files worktree` | [Automatic scope eligibility](references/automatic-scope.md) before validation or content access |
| Omitted `--files` or `--files session` | [Session HITL](references/session-mode.md) |
| `--files worktree` | [Git worktree selection](references/worktree-mode.md) |
| One or more semantic targets | [User-specified targets](references/user-targets.md) |
| `--dry-run` or a non-default output mode | [Output modes](references/output-modes.md) |
| `--use-subagent` | [Sub-agent review](references/subagent-review.md) |
| Before any user-visible output | [Reporting contract](references/reporting.md) |

## Execution Order

Apply these steps in order; each gates the next.

### Step 0: Validate

Reject missing, directory, binary, empty, or oversized files (>10,000 lines or >500KB) with a brief error. Require confirmation before following a symlink.

### Step 1: Scan Secrets and Credentials

After literal selection or automatic scope chooses a file and Step 0 validates it, read [Leakage categories](references/leakage-categories.md) before leakage scanning. Do not load it while resolving automatic scope or for an empty selection.

Before any purge decision, scan every line, key, and value for credentials. Credentials grant access; internal names, non-access-bearing URLs, and mock labels are not credentials. Record findings and the required warning without modifying the file yet.

In output, identify credentials only by a fixed `[REDACTED]` label and file/line/key location. Never emit or describe a value substring, recognizable prefix or suffix, format, pattern, provider-specific scheme or token type, original length, or shape. Credentials in executable code require human review. Configuration credentials may be replaced only with a format-safe placeholder during Step 3.

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

After stripping, re-read the candidate once. On failure, discard it and leave the original untouched. Report: "Structural issue detected after cleaning — file left unchanged. Human review needed." A successful visual fallback is silent.

The default `inplace` mode replaces the original only after successful validation. Before any write, preserve the file's original line ending style (LF vs CRLF) and compare mtime with the value observed when reading; if it changed, warn and abort. Replace atomically where supported.

On a silent path, the last required tool result is terminal: send no assistant text and end the turn immediately.

## Strip Strategy by File Type

- **Code** (.java, .py, .ts, .go, .rs, .js, etc.): Remove comment lines matching leakage categories or user targets. Keep executable code, string literals, and runtime-visible doc strings as-is; report those matches for human review. If removing a comment would leave an empty comment block (e.g., `/** */`), remove the whole block.
- **Markdown** (.md): Remove paragraphs and sentences matching leakage categories or user targets. Keep technical content.
- **Config** (.yml, .yaml, .json, .xml, .toml, .env, .properties, .ini, .cfg): Remove leakage comments. Handle credential values only as Step 3 permits; report user-target matches in behavior-affecting values for human review. Keep config structure and other values. For YAML block scalars (`|`, `>`), replace the entire scalar value only when the permitted edit remains format-safe.
- **Other**: Remove any comment or prose matching the leakage categories or user targets.

Remove a multi-line leakage block as a whole.
