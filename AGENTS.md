# Hiding — strip AI leakage from files

Before committing, pushing, or sharing files, scan them for AI-generated artifacts that should not leave the session. Cleaned files should read as if written by a human.

## Core Operating Contract

- Do not inject persistent constraints into normal sessions; preserve reasoning and generation quality.
- Process files only. Agent replies and conversation output are out of scope.
- Remove leakage without changing code logic or rewriting prose like a humanizer.
- Stay silent by default; the cleanup operation must leave no trace.
- Credential safety overrides silence: warn and recommend rotation whenever credentials are found.
- Require explicit user confirmation before deleting an entire file.
- Keep behavior consistent across supported agent environments.

## Five Leakage Categories

| Category | Principle | Strip |
|---------|-----------|-------|
| **Secrets and credentials** | Credentials, tokens, internal URLs — actual security risks | Always. Zero tolerance. **Mandatory credential-rotation warning.** |
| **Unshared rule references** | References to knowledge the reader doesn't share (CLAUDE.md, skill instructions, team conventions) | Remove — the reader only has this file |
| **AI-facing rationale/guardrails** | Rationale about AI-facing constraints rather than business decisions | Remove — state decisions, don't justify them |
| **AI self-reference** | Language revealing the author is an AI: first-person narration, hedging, meta-commentary | Remove — human-written files don't say "Here's the result:" |
| **Thought-process traces** | Derivation trails, research logs, step-by-step reasoning | Remove — reads like a lab notebook, not a reference document |

These are **principles**, not keywords. Judge by intent, not by grep.
Note: TODO/FIXME/HACK markers are NOT automatically AI leakage — human developers write these too. Judge by context.

## Execution Order

1. **Validate**: file exists, not binary, not directory, not too large (> 10K lines / 500KB)
2. **Purge check**: if removing thought-process traces, AI-facing rationale/guardrails, and AI self-reference leaves no section viable as standalone reference — ask before deleting
3. **Strip secrets and credentials** first, before anything else. Mandatory warning if credentials found.
4. **Strip style leakage** (unshared rule references, AI-facing rationale/guardrails, AI self-reference, and thought-process traces): cosmetic/quality concerns
5. **Verify**: use actual parsers (Python json/yaml, xmllint, jq) where available; visual check as fallback

## Output Modes

| Mode | Behavior |
|------|----------|
| `inplace` (default) | Modify file in place |
| `newfile` | Create `<name>-cleaned.<ext>`, leave original untouched |
| `backup` | Rename original to `<file>.bak` (e.g. `config.yml` → `config.yml.bak`), write cleaned to original name |

Target collision (`newfile`/`backup`): never overwrite an existing target — use a numbered alternative (`-cleaned-2`, `.bak-2`, incrementing) and report the name used in one line.

## Flags

| Flag | Effect |
|------|--------|
| `--dry-run` | Preview changes without modifying files (credential warning still fires) |
| `--subagent` | Delegate stripping to a sub-agent for cleaner isolation (scope: leakage categories + Steps 0–4 + strip strategy only; no recursion) |
| `--mode <inplace\|newfile\|backup>` | Set output mode (invalid value → error, no silent fallback) |

Unknown/misspelled flags → error (not swallowed into description mode).

## HITL Mode (no arguments)

Scans TWO sources: (1) files created/modified in the current session, (2) git uncommitted changes (`git diff --name-only HEAD` + untracked files). Findings organized into Tier 0 (Security Critical — credentials), Tier 1 (purge candidates), Tier 2 (inline leakage), Tier 3 (session-level concerns). Zero findings → brief confirmation: "未在此会话和未提交文件中发现 AI 泄露痕迹。No AI leakage found."

## Rules

- **No leakage found (non-HITL)**: do nothing, say nothing.
- **Multi-line leakage blocks**: remove the whole block.
- **After stripping, re-read once** to verify structural integrity.
- **Preserve line endings**: detect and preserve LF vs CRLF.

## Strip Strategy by File Type

- **Code** (.java, .py, .ts, .go, .rs, .js, .tsx, .jsx, etc.): Remove comment lines containing leakage. Keep executable code as-is. Remove empty comment blocks.
- **Markdown** (.md): Remove leakage paragraphs and sentences. Keep technical content.
- **Config** (.yml, .yaml, .json, .xml, .toml, .env, .properties, .ini, .cfg): Remove leakage comments and sensitive values. Keep config structure. For YAML block scalars, replace entire value if partial strip would alter indentation.
- **Other**: Remove any comment or prose matching the leakage categories.
