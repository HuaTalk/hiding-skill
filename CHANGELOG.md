# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.0] - Unreleased

### Added

- **User-specified semantic targets** (`/hiding "data sources" "internal rules" ...`): leading positional arguments add one-off content-hiding goals to the built-in five-category and credential scan. Targets must precede flags; executable-code and behavior-affecting config matches require human review.
- **File selection** (`--files <file>...` or `--files worktree`): pass literal paths or select files changed from the primary-branch merge base through the invocation-time Git worktree. The worktree selector includes committed branch changes, staged and unstaged changes, and untracked non-ignored files. Without `--files`, `/hiding` uses eligible files created or modified in the current session.
- **Guardrail leakage coverage**: the AI-facing rationale/guardrails category explicitly covers AI safety limits, refusal justifications, and behavioral fences.

### Changed

- File paths are accepted only through `--files`; leading positional arguments are semantic content targets, never inferred file paths.
- `worktree` is a reserved, standalone `--files` value; it cannot be mixed with paths, while `./worktree` addresses a literal same-named file. Selection uses local refs only and never fetches.
- Automatic session and worktree selection now resolves output artifacts autonomously by explicit selection, tool ownership, task goal, and target consumer, in that order. Known control state is excluded, literal paths override all automatic rules, and low-confidence files are preserved and skipped without prompting (`--dry-run` lists them unscanned). Scope clarification is reserved for cases where conservative exclusion would block an explicit request. Filename and persistence alone are not decisive.
- Unknown or malformed flags, targets after the first flag, and ambiguous values are explicit errors.
- Credential handling distinguishes access-bearing secrets from sensitive context, preserves executable code and unsafe-to-rewrite configuration values, and validates a temporary candidate before replacing the original.
- Credential detection now precedes purge decisions, and `--use-subagent` is detection-only; the main agent retains the original purge, security, editing, validation, and output workflow.

## [0.6.0] - Unreleased

### Added

- **Output modes** (`--mode inplace|newfile|backup`): write cleaned content in place (default), to a `<name>-cleaned.<ext>` sibling, or to the original name with the original renamed to `<name>.<ext>.bak`.
- **Output-target collision safety**: `newfile`/`backup` never overwrite an existing target — a numbered alternative (`-cleaned-2`, `.bak-2`) is used and reported in one line.
- **`--dry-run`**: preview all would-be changes without modifying files, in every mode (File, Description, HITL).
- **`--use-subagent`**: a fresh-context sub-agent identifies candidate leakage locations only; the main agent retains all purge, credential, editing, validation, output, and write decisions. Report fallback when sub-agents are unavailable.
- **Credential-rotation warnings**: whenever secrets or credentials are *found* — stripped or merely previewed — a mandatory rotate-credentials warning fires. The only mandatory exception to silent execution.
- **Current-session modified-file discovery**: no-`--files` HITL mode inventories only files created or modified in the current session; unrelated Git changes are excluded.
- **Flag validation**: unknown or malformed flags and unsupported positional arguments are explicit errors.
- Expanded known-extension list for File-mode detection.

### Changed

- Distribution consolidated to two channels: `npx skills add HuaTalk/hiding-skill` (70+ agents) and the Claude Code native plugin marketplace.

### Removed

- Always-on rule files (`.cursor/rules/`, `.windsurf/rules/`, …), per-platform plugin manifests, SessionStart awareness hook, and statusline badges — all conflicted with the post-hoc cleanup philosophy (see `docs/zh/design-tradeoffs.md`).

## Earlier history

Pre-0.6.0 development was not tagged or published; see the git log for details.
