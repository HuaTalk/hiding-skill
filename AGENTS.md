# Hiding — strip AI leakage from files

Before committing, pushing, or sharing files, scan them for AI-generated artifacts and user-specified sensitive content that should not leave the session.

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
2. **Purge check**: if removing thought-process traces, AI-facing rationale/guardrails, AI self-reference, and user-target matches leaves no section viable as standalone reference — ask before deleting
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

## Arguments And Flags

Leading positional arguments are one-off semantic targets that augment the five-category scan. Quote multi-word targets and place every target before the first flag:

```bash
/hiding "data sources" "internal review rules" --files report.md
```

| Flag | Effect |
|------|--------|
| `--dry-run` | Preview changes without modifying files (credential warning still fires) |
| `--use-subagent` | Ask a fresh-context sub-agent to read only the target file and applicable rules, then return edit suggestions; the main agent applies and validates them. If unavailable, report the fallback. |
| `--mode <inplace\|newfile\|backup>` | Set output mode (invalid value → error, no silent fallback) |
| `--files <file>...` or `--files worktree` (at most once) | Select literal paths, or use the reserved single value `worktree` for files changed from the primary-branch merge base through the invocation-time Git worktree. Never mix `worktree` with paths; use `./worktree` for a literal same-named file. Without this flag, use files created or modified in the current session. |

Targets are natural-language descriptions, not regexes. In comments or prose, remove the smallest coherent unit that hides the target. Never change executable code, identifiers, or behavior-affecting config values; report those matches for human review. Unknown/misspelled flags, targets after the first flag, and malformed values → error; do not guess intent.

For `--files worktree`, locate the repository from the working directory where the skill is invoked and use local refs only. Resolve the primary branch from the current branch's configured `<remote>/HEAD`, `origin/HEAD`, `origin/main`, local `main`, `origin/master`, then local `master`; stop if unresolved or if `HEAD` has no merge base. Select tracked files changed from that merge base to the current worktree plus untracked non-ignored files. Exclude deleted files, ignored files, directories, and submodules; use NUL-safe Git output, de-duplicate, and validate all files before writing. An empty result is reported explicitly. `--dry-run` also reports the resolved base and selected files.

## HITL Mode (no `--files`)

Scans all files created or modified through file-editing tools in the current session for the five categories and any user targets. Git status must not add files to this set. If the runtime cannot identify files created or modified in the current session, report the limitation and stop. Findings are organized into Tier 0 (Security Critical — credentials), Tier 1 (purge candidates), Tier 2 (inline leakage and user-target matches), and Tier 3 (session-level concerns). For zero findings, briefly report that no AI leakage was found; mention user-specified content only when targets were supplied.

## Rules

- **No leakage found (non-HITL)**: do nothing, say nothing, unless `--use-subagent` had to report a non-isolated fallback.
- **Multi-line leakage blocks**: remove the whole block.
- **After stripping, re-read once** to verify structural integrity.
- **Preserve line endings**: detect and preserve LF vs CRLF.

## Strip Strategy by File Type

- **Code** (.java, .py, .ts, .go, .rs, .js, .tsx, .jsx, etc.): Remove comment lines matching leakage categories or user targets. Keep executable code as-is. Remove empty comment blocks.
- **Markdown** (.md): Remove paragraphs and sentences matching leakage categories or user targets. Keep technical content.
- **Config** (.yml, .yaml, .json, .xml, .toml, .env, .properties, .ini, .cfg): Remove leakage comments and sensitive values. Keep config structure. For YAML block scalars, replace entire value if partial strip would alter indentation.
- **Other**: Remove any comment or prose matching the leakage categories or user targets.
