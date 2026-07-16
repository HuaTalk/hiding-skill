# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.0] - Unreleased

### Added

- **Output modes** (`--mode inplace|newfile|backup`): write cleaned content in place (default), to a `<name>-cleaned.<ext>` sibling, or to the original name with the original renamed to `<name>.<ext>.bak`.
- **Output-target collision safety**: `newfile`/`backup` never overwrite an existing target — a numbered alternative (`-cleaned-2`, `.bak-2`) is used and reported in one line.
- **`--dry-run`**: preview all would-be changes without modifying files, in every mode (File, Description, HITL).
- **`--subagent`**: delegate stripping to an isolated sub-agent that sees only the file content and the stripping rules (scope-guarded, no recursion).
- **Credential-rotation warnings**: whenever Pattern S content is *found* — stripped or merely previewed — a mandatory rotate-credentials warning fires. The only mandatory exception to silent execution.
- **Git-uncommitted discovery**: no-argument HITL mode inventories session files *and* uncommitted git changes (tracked modifications + untracked user artifacts).
- **Flag validation**: unknown or malformed flags are explicit errors, never silently swallowed into Description mode.
- Expanded known-extension list for File-mode detection.

### Changed

- Distribution consolidated to two channels: `npx skills add HuaTalk/hiding-skill` (70+ agents) and the Claude Code native plugin marketplace.

### Removed

- Always-on rule files (`.cursor/rules/`, `.windsurf/rules/`, …), per-platform plugin manifests, SessionStart awareness hook, and statusline badges — all conflicted with the post-hoc cleanup philosophy (see `docs/design-tradeoffs-zh.md`).

## Earlier history

Pre-0.6.0 development was not tagged or published; see the git log for details.
