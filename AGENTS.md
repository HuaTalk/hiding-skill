# Hiding — strip AI leakage from files

Before committing, pushing, or sharing files, scan them for AI-generated artifacts and user-specified sensitive content that should not leave the session.

## Core Operating Contract

- Do not inject persistent constraints into normal sessions; preserve reasoning and generation quality.
- Process files only. Agent replies and conversation output are out of scope.
- Remove leakage without changing code logic or rewriting prose like a humanizer.
- Stay silent by default; the cleanup operation must leave no trace.
- Credential safety overrides silence: warn and recommend rotation whenever credentials are found.
- Require explicit user confirmation before deleting an entire file.
- Automatically scan deliverables, not agent control-plane or planning state.
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

For automatic session or `worktree` selection, resolve output-artifact eligibility autonomously before these steps. Do not inspect file content while deciding scope.

1. **Validate**: file exists, not binary, not directory, not too large (> 10K lines / 500KB)
2. **Credential scan**: detect credentials before any purge decision; the rotation warning fires even if the file is deleted or left unchanged
3. **Purge check**: if removing transient thought-process traces, AI-facing rationale/guardrails, AI self-reference, and user-target matches leaves no section viable as standalone reference — ask before deleting
4. **Strip**: credentials first, then style leakage and user-target matches
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
| `--use-subagent` | Ask a fresh-context sub-agent to identify candidate leakage only; the main agent still performs all confirmation, security, editing, validation, output, and write logic. If unavailable, report the fallback. |
| `--mode <inplace\|newfile\|backup>` | Set output mode (invalid value → error, no silent fallback) |
| `--files <file>...` or `--files worktree` (at most once) | Select literal paths, or use the reserved single value `worktree` for files changed from the primary-branch merge base through the invocation-time Git worktree. Never mix `worktree` with paths; use `./worktree` for a literal same-named file. Without this flag, use files created or modified in the current session. |

Targets are natural-language descriptions, not regexes. In comments or prose, remove the smallest coherent unit that hides the target. Never change executable code, identifiers, or behavior-affecting config values; report those matches for human review. Unknown/misspelled flags, targets after the first flag, and malformed values → error; do not guess intent.

For `--files worktree`, locate the repository from the working directory where the skill is invoked and use local refs only. Resolve the primary branch from the current branch's configured `<remote>/HEAD`, `origin/HEAD`, `origin/main`, local `main`, `origin/master`, then local `master`; stop if unresolved or if `HEAD` has no merge base. Select tracked files changed from that merge base to the current worktree plus untracked non-ignored files. Exclude deleted files, ignored files, directories, and submodules; use NUL-safe Git output, de-duplicate, and validate all files before writing. An empty result is reported explicitly. `--dry-run` also reports the resolved base and selected files.

Resolve automatic session and `worktree` scope before validation or scanning, in this order: (1) a literal `--files <path>` is always in scope; (2) exclude known agent/tool control state such as `.planning/**`, recognizable planning-with-files state, and equivalent session plans, logs, or memory; (3) include files directly requested as task deliverables; (4) include human/project-consumed files and exclude agent-only files; (5) use task/session context to decide uncertain cases autonomously. When confidence remains low, preserve and exclude the file without scanning or asking. Ask only if this conservative exclusion would prevent completion of an explicit request. Under `--dry-run`, list conservative exclusions without scanning them. Filename and persistence alone are not decisive: a formal `findings.md` report may be an output, while persistent agent memory is control state.

## HITL Mode (no `--files`)

Inventories files created or modified through file-editing tools in the current session; Git status must not expand the set. Resolve output-artifact eligibility autonomously before scanning, conservatively excluding low-confidence files. Then scan eligible files for the five categories and any user targets. With `--use-subagent`, the sub-agent supplies candidate locations only; the main agent performs credential scanning, purge classification, tiering, confirmation, and execution. If the runtime cannot identify session-modified files, report the limitation and stop. Findings are organized into Tier 0 (Security Critical — credentials), Tier 1 (purge candidates), Tier 2 (inline leakage and user-target matches), and Tier 3 (session-level concerns). For zero findings, briefly report that no AI leakage was found; mention user-specified content only when targets were supplied.

## Rules

- **No leakage found (non-HITL)**: do nothing, say nothing, unless `--use-subagent` had to report a non-isolated fallback.
- **Multi-line leakage blocks**: remove the whole block.
- **After stripping, re-read once** to verify structural integrity.
- **Preserve line endings**: detect and preserve LF vs CRLF.

## Strip Strategy by File Type

- **Code** (.java, .py, .ts, .go, .rs, .js, .tsx, .jsx, etc.): Remove comment lines matching leakage categories or user targets. Keep executable code as-is. Remove empty comment blocks.
- **Markdown** (.md): Remove paragraphs and sentences matching leakage categories or user targets. Keep technical content.
- **Config** (.yml, .yaml, .json, .xml, .toml, .env, .properties, .ini, .cfg): Remove leakage comments. Change credential values only when a format-safe placeholder preserves structure; report other behavior-affecting values for human review.
- **Other**: Remove any comment or prose matching the leakage categories or user targets.
