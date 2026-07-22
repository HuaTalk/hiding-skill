# Hiding

[![CI](https://github.com/HuaTalk/hiding-skill/actions/workflows/test.yml/badge.svg)](https://github.com/HuaTalk/hiding-skill/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Chinese](https://img.shields.io/badge/lang-Chinese-blue.svg)](README-zh.md)

**Ship the work, not the agent's working notes.**

Hiding is a strategic content-cleanup Skill for coding agents. Use it whenever a file needs to reveal less about its origin, process, AI participation, constraints, or sensitive context. It removes private instruction and constraint references, source and provenance clues, AI narration, transient reasoning, credentials, and user-specified content while preserving executable behavior. Release hygiene is a common use case; review, handoff, publication, commit, push, and sharing are examples, not prerequisites.

> Hiding can remove provenance and disclosure clues from selected files. It does not rewrite repository history, metadata, or records outside the selected scope.

## Quickstart

Install `/hiding` from npm:

```bash
npm install -D @huatalk/hiding-skill
npx skills-npm setup
```

Then ask your agent to preview files changed in the current session:

```text
/hiding --dry-run
```

Review the findings, then apply the cleanup:

```text
/hiding
```

Choose another scope when needed: [specific files](#specific-files), [the Git worktree](#git-worktree), or [additional content to hide](#semantic-targets).

## How It Works

`/hiding` runs on demand after content exists, not throughout the agent's normal reasoning process. The target may be a draft, an existing file, a review or handoff artifact, or release-ready output.

For automatic `session` and `worktree` scopes, it resolves which files are user-facing outputs and excludes agent control state, planning metadata, build output, and unrelated files.

Next, it scans eligible files for five built-in leakage categories, credentials, and any one-off semantic targets supplied by the user. It distinguishes removable comments and prose from executable code and behavior-affecting configuration.

Before writing, it checks whether the cleanup would leave a useful standalone file and validates a temporary candidate. Unsafe edits are reported for human review; whole-file deletion always requires confirmation.

For example:

```typescript
// Before
// Per CLAUDE.md, here's the UserProfile component I created.
// I think memoizing makes sense because props rarely change.
const UserProfile = memo(({ user }) => {

// After
// Memoized because props rarely change.
const UserProfile = memo(({ user }) => {
```

The unavailable rule reference and AI narration disappear. The useful technical reason and executable code remain. See [more examples](docs/en/examples.md).

## Installation

Installation depends on how your coding agent loads Skills.

### npm

For environments using `skills-npm`:

```bash
npm install -D @huatalk/hiding-skill
npx skills-npm setup
```

### Agent Skills

Use this for Codex, Cursor, Windsurf, Gemini CLI, GitHub Copilot, Cline, and other agents supported by the Agent Skills ecosystem:

```bash
npx skills add HuaTalk/hiding-skill
```

Agent compatibility and install location are determined by the installer and each agent's Skill implementation.

### Claude Code

Register the repository as a plugin marketplace:

```text
/plugin marketplace add https://github.com/HuaTalk/hiding-skill.git
```

Then install the plugin in a separate prompt:

```text
/plugin install hiding@hiding
```

Restart Claude Code after installation.

## The Basic Workflow

1. **Select outputs** - Use current-session files by default, explicit paths for precise control, or the Git worktree for branch-wide review.
2. **Preview** - Add `--dry-run` to see scope, findings, and conservative exclusions without modifying files.
3. **Classify** - Credentials are handled first, followed by file-level purge candidates, inline leakage, and user-specified targets.
4. **Confirm** - Session review is human-in-the-loop. Whole-file deletion and symlink traversal always require explicit confirmation.
5. **Clean** - Remove the smallest coherent comment or prose unit. Executable code, string literals, and behavior-affecting values are not silently changed.
6. **Verify** - Re-read the candidate, validate structure, check for concurrent edits, then apply the selected output mode.

When there are no findings in direct file modes, `/hiding` stays silent. Security warnings, previews, validation failures, and input errors remain visible.

## What's Inside

### Five Leakage Categories

| Category | What it catches |
|---|---|
| Secrets and credentials | API keys, tokens, passwords, connection strings, and access-bearing endpoints |
| Unshared rule references | References to `CLAUDE.md`, Skill instructions, or private conventions the reader cannot access |
| AI-facing rationale and guardrails | Prompt compliance, refusal justification, safety fences, and reasoning about satisfying agent instructions |
| AI self-reference | "As an AI", "I think", "Here's the result", and similar narration |
| Thought-process traces | Transient derivations, intermediate attempts, session logs, and temporary step-by-step reasoning |

These are judgment principles, not a keyword list. `TODO`, `FIXME`, and `HACK` are not leakage by themselves. Durable architecture decisions, requirements, trade-offs, and research conclusions remain valid documentation.

### Semantic Targets

Leading positional arguments add one-off content goals to the built-in scan:

```text
/hiding "data sources" "internal project name" --files report.md --dry-run
```

Targets are semantic phrases, not regular expressions. They must appear before the first flag. Matches in executable code, identifiers, or behavior-affecting configuration are reported for human review rather than modified automatically.

### File Selection

#### Current Session

```text
/hiding
/hiding --files session --dry-run
```

The default scope is files created or modified through file-editing tools in the current agent session. Git status may provide context but does not expand this inventory.

#### Specific Files

```text
/hiding --files README.md config.yml --dry-run
```

Literal paths are unconditional scope overrides. `--files` may appear once and accepts paths until the next recognized flag.

#### Git Worktree

```text
/hiding --files worktree --dry-run
```

Worktree scope compares `HEAD` with the merge base of the locally resolved primary branch. It includes branch commits, staged changes, unstaged changes, and untracked non-ignored files. It never fetches remote refs.

`session` and `worktree` are reserved standalone selectors. Use `./session` or `./worktree` for literal files with those names.

### Output Modes

| Mode | Behavior |
|---|---|
| `inplace` | Replace the original after validation; this is the default |
| `newfile` | Write `<name>-cleaned.<ext>` and preserve the original |
| `backup` | Move the original to `<file>.bak` and write cleaned content to the original path |

Existing output targets are never overwritten. Numbered alternatives such as `-cleaned-2` and `.bak-2` are used instead.

### Credential Safety

Credentials are scanned before any style cleanup or purge decision.

- A discovered credential always triggers a rotation warning, including under `--dry-run`.
- Secret values are redacted from reports.
- Credentials in executable code are not silently edited.
- Configuration credentials are replaced only when a format-safe placeholder preserves structure; otherwise they remain unchanged and are reported for human review.
- If a credential may have been committed, pushed, or shared, rotate it even if the local file is cleaned.

`/hiding` is defense in depth, not a replacement for a dedicated secret scanner.

### Fresh-Context Review

```text
/hiding --files report.md --use-subagent --dry-run
```

`--use-subagent` asks a fresh-context sub-agent to identify candidate leakage locations. The main agent still owns scope, credential scanning, purge decisions, edits, confirmations, validation, and file writes.

## Command Reference

```text
/hiding [<what-to-hide>...] [--files <file>...|session|worktree] [--mode <inplace|newfile|backup>] [--dry-run] [--use-subagent]
```

| Input | Values | Default |
|---|---|---|
| `<what-to-hide>...` | Leading semantic target phrases | None |
| `--files` | Literal paths, `session`, or `worktree` | `session` |
| `--mode` | `inplace`, `newfile`, or `backup` | `inplace` |
| `--dry-run` | Preview without writes | Off |
| `--use-subagent` | Fresh-context candidate detection | Off |

Unknown flags, targets placed after flags, repeated `--files`, and ambiguous selector combinations are errors.

## Philosophy

- **Strategic cleanup, not release-only** - Run it whenever a file should reveal less; release hygiene is one common application.
- **Post-hoc, not always-on** - Cleanup runs on demand and does not consume every session with persistent self-censorship instructions.
- **Content, not style** - The Skill removes selected content and clues; it does not rewrite prose to imitate a human voice.
- **Decisions over derivations** - Keep durable conclusions and reader-facing rationale; remove private instructions and transient process trails.
- **Behavior preservation** - Code logic and runtime-visible content are never silently changed.
- **Evidence over claims** - Preview, parse where possible, re-read, and preserve the original when verification fails.

Read more about [agent portability](docs/en/agent-portability.md), [platform-native integration](docs/en/platform-native.md), and the [project philosophy](docs/en/hiding-philosophy.md).

## Validation and Limitations

Repository CI validates version consistency, static Skill contract anchors, local references, plugin JSON, English-document language separation, and Skill frontmatter. The project does not yet publish runtime accuracy benchmarks.

Detection relies on contextual model judgment and may miss or over-classify content. Files over 10,000 lines or 500 KB, binary files, directories, and empty files are rejected. JSON, YAML, and XML use parsers where available; other formats may receive visual structural verification.

For important files, start with `--dry-run`, inspect credential and configuration findings manually, then run the host project's formatter, linter, parser, tests, and secret scanner.

## Updating

Agent Skills:

```bash
npx skills add HuaTalk/hiding-skill
```

Claude Code:

```text
/plugin update hiding@hiding
```

Restart Claude Code after updating. See the [changelog](CHANGELOG.md) for release details.

## Scope Boundaries

`/hiding` can remove source, provenance, attribution, constraint, audit, licensing, or disclosure clues when they appear in editable comments or prose and match the built-in categories or a user-specified target.

Its scope is the selected file content. It does not rewrite Git history, external metadata, access logs, signed records, or copies outside that scope, and it does not silently change executable code or behavior-affecting configuration.

## Contributing

Changes to Skill behavior must preserve the same contract across supported agent environments. Follow [CONTRIBUTING.md](CONTRIBUTING.md), update both language versions of the README, and run:

```bash
npm test
```

Issues and feature requests are tracked in [GitHub Issues](https://github.com/HuaTalk/hiding-skill/issues).

## License

MIT License - see [LICENSE](LICENSE).
