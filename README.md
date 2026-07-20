# /hiding — Strip AI Leakage from Files

A Claude Code plugin that removes AI-generated artifacts from files before committing, pushing, or sharing.

## What It Does

`/hiding` removes AI leakage and user-specified sensitive content from files before they are shared.

**Scope**: Files only (code, config, markdown, docs). Does NOT modify agent replies or conversation output.

## Before/After Examples

`/hiding` strips five categories of AI leakage from files. Every example here shows content that looks natural to the author but reads as AI-generated to everyone else.

### 1. Python Code — AI-facing Rationale / Thought-process Traces

```python
# Before /hiding
# Returns dict instead of Tuple for readability
def get_user() -> dict[str, str]:
    ...

# After /hiding
def get_user() -> dict[str, str]:
    ...
```

The comment explains a design choice to the AI's own satisfaction — but the reader gains nothing from it. The function signature speaks for itself.

### 2. Markdown Docs — Unshared Rule References / Thought-process Traces

```md
Before /hiding

> Per CLAUDE.md conventions, all APIs must use gRPC
> Research notes (2026-07-15): Compared REST, gRPC, and GraphQL — gRPC selected for performance

After /hiding

> All APIs use gRPC
```

Rule citation and research trail are scaffolding for the AI's own reasoning. The reader only needs the conclusion.

### 3. Teaching Docs — Rule

**Prompt**:
> Write a beginner-friendly explanation of how LLMs work. Use analogies instead of jargon to explain the Transformer architecture.

```md
Before /hiding

# How Large Language Models Work

> **Authoring note**: The following is written for readers with no technical background. Use everyday analogies to explain the Transformer, avoid math and jargon (attention mechanism, multi-head attention, self-attention, etc.).
> Per CLAUDE.md conventions, pair each core concept with a real-world analogy.

A Large Language Model (LLM) is a neural network that predicts text. Give it a sentence starter, and it completes it word by word — like your phone's predictive keyboard, but millions of times larger.

After /hiding

# How Large Language Models Work

A Large Language Model (LLM) is a neural network that predicts text. Give it a sentence starter, and it completes it word by word — like your phone's predictive keyboard, but millions of times larger.
```

The prompt's instructions and the rule citation leaked into the document. After `/hiding`, only the explanation remains — no meta-commentary about how to write it.

### 4. YAML CI — AI-facing Rationale / Thought-process Traces

```yaml
# Before /hiding
# Team policy forbids third-party actions — handwritten script as workaround
# Steps: pull image → install deps → run tests → build → upload
steps:

# After /hiding
steps:
```

The constraint justification and step-by-step plan are AI-facing rationale. The workflow definition is all the reader needs.

### 5. TypeScript Component — AI Self-reference

```typescript
// Before /hiding
// Here's the UserProfile component I created
// I think memoizing here makes sense since props rarely change
const UserProfile = memo(({ user }) => {

// After /hiding
// Memoized since props rarely change
const UserProfile = memo(({ user }) => {
```

"Here's the…" and "I think…" betray AI authorship. A human writes the technical reason directly.

### 6. Python Credentials — Secrets and Credentials

```python
# Before /hiding
OPENAI_API_KEY = "sk-abc123"  # Using real key here for convenience during testing

# After /hiding
OPENAI_API_KEY = "sk-abc123"
```

Inline credentials with casual justification are security accidents waiting to happen. `/hiding` always warns when secrets are found.

No markers. No annotations. No one can tell it ran. The code simply reads as if a human wrote it from the start.

## Design Philosophy

`/hiding` is a **post-hoc cleanup tool**, not a real-time behavior constraint. It does not inject rules into your agent's session context. Instead, it lets the model work naturally, then strips the traces afterward. This preserves thinking quality and follows the silent execution principle — after `/hiding` runs, no one should be able to tell it ran.

### Core Principles

- Do not inject persistent constraints into normal sessions; preserve reasoning and generation quality.
- Process files only. Agent replies and conversation output are out of scope.
- Remove leakage and user-specified sensitive content without changing code logic or rewriting prose like a humanizer.
- Stay silent by default; the cleanup operation must leave no trace.
- Credential safety overrides silence: always warn and recommend rotation when credentials are found.
- Require human confirmation before deleting an entire file.
- Keep the same behavior across supported agent environments.

Think of it like Fermat's margin note. Fermat didn't show his work — he wrote the theorem and moved on. The proof became legend. `/hiding` gives your code the same mystique: the result stands on its own, with no visible scaffolding. Your colleagues will wonder how you wrote it so cleanly. (See [The Fermat Principle](docs/en/hiding-philosophy.md) for the full, slightly irreverent argument.)


## Five Leakage Categories

| Category         | What It Catches |
|-----------------|----------------|
| Secrets and credentials | API keys, tokens, passwords, connection strings, internal URLs |
| Unshared rule references | References to CLAUDE.md, skill instructions, team conventions the reader doesn't share |
| AI-facing rationale/guardrails | Prompt compliance, refusal justification, safety fences, and rationale about satisfying agent instructions |
| AI self-reference | "As an AI…", "I think…", "Here's the result:", "I hope this helps!" |
| Thought-process traces | Transient derivations, intermediate attempts, session work logs, and temporary step-by-step reasoning |

## Execution Guarantees

- **Structurally safe** — post-cleanup validation uses actual parsers (JSON, YAML, XML) where available.
- **Three output modes** — inplace (default), newfile (original preserved), backup (original renamed to `.bak`).

## Installation

### Primary: via npx skills (recommended, 70+ agents)

```bash
npx skills add HuaTalk/hiding-skill
```

One command installs to all your coding agents (Claude Code, Codex, Cursor, Windsurf, Gemini CLI, Copilot, Cline, and more).

### Claude Code (native plugin)

```
/plugin marketplace add https://github.com/HuaTalk/hiding-skill.git
```
```
/plugin install hiding@hiding
```
(You have to send two separate prompts for the install to work)

Restart Claude Code. The `/hiding` command is ready.

Upgrade: `/plugin update hiding@hiding` + restart.

### npm (for skills-npm users)

```bash
npm install -D @huatalk/hiding-skill
npx skills-npm setup
```

### Uninstall

| Method | Command |
|--------|---------|
| npx skills | `npx skills remove hiding` |
| Claude Code | `/plugin remove hiding` |

## Usage

```bash
/hiding [<what-to-hide>...] [--files <file>...|session|worktree] [--mode <inplace|newfile|backup>] [--dry-run] [--use-subagent]

/hiding                              # HITL review of files created or modified in this session
/hiding --files <file>               # Clean a specific file in-place
/hiding --files session              # Explicit form of the default session scope
/hiding --files worktree             # Clean files changed from the primary branch
/hiding "data sources" --files report.md   # Also hide source attribution
```

Leading positional arguments describe additional content to hide. Each argument is a one-off semantic target, not a regex; quote phrases containing spaces and place all targets before the first flag. Targets augment the five-category scan and credential handling rather than replacing them.

`--files` appears at most once. It accepts one or more literal file paths ending at the next known flag, or one reserved selector: `session` or `worktree`. A selector must be the only value; commas are not separators. Use `./session` or `./worktree` for literal same-named files. Omitting the flag is exactly equivalent to `--files session`: `/hiding` uses eligible files created or modified in the current session and presents HITL findings before writing. `--mode` accepts both `--mode value` and `--mode=value`.

`--files worktree` uses the Git repository and working directory where `/hiding` is invoked. It compares the merge base of `HEAD` and the locally resolved primary branch with the current worktree, selecting branch commits, staged changes, unstaged changes, and untracked non-ignored files. Deleted files, ignored files, directories, and submodules are excluded. It never fetches. If no primary branch or merge base can be resolved, it stops with an error; if no eligible files changed, it reports that explicitly.

Automatic selection resolves output artifacts in priority order: explicit literal paths are included; known agent/tool control state is excluded; requested task deliverables are included; then human/project-consumed files are included while agent-only files are excluded. The agent makes this decision autonomously from task/session context. If confidence remains low, `/hiding` preserves and skips the file without asking; it asks only when skipping would prevent an explicit request from being completed. Under `--dry-run`, it lists conservative exclusions without scanning them.

This is based on ownership, task goal, and audience, not filename or persistence alone. `.planning/` and recognizable planning-with-files state are normally control metadata, while a user-requested article, code change, ADR, requirements document, final report, or project plan is an output artifact. A formal `findings.md` report may therefore be included; persistent agent memory remains excluded. A literal `--files <path>` is the unconditional override.

### Arguments And Flags

| Input | Values | Default | Description |
|-------|--------|---------|-------------|
| `<what-to-hide>...` | leading quoted semantic targets | none | Additional content to hide |
| `--mode` | `inplace` / `newfile` / `backup` | `inplace` | Where to write cleaned output |
| `--use-subagent` | (flag) | off | Get candidate leakage locations from a fresh-context sub-agent; the main agent applies the normal hiding workflow |
| `--dry-run` | (flag) | off | Preview changes without modifying files |
| `--files` | `<file>...`, `session`, or `worktree` (at most once) | `session` | Files to scan and clean |

```bash
/hiding --files file.java --mode newfile       # Output to file-cleaned.java, leave original
/hiding --files config.yml --mode backup       # Rename original to .bak, write cleaned
/hiding --files file.java --dry-run            # Preview what would change
/hiding --files file.java --use-subagent       # Get an independent review before the main agent edits
/hiding --dry-run                         # HITL preview without executing
/hiding --files session --dry-run                # Explicit preview of current-session files
/hiding --files README.md config.yml --dry-run   # Preview two files
/hiding --files worktree --dry-run                # Preview the resolved base and changed files
/hiding "data sources" "internal rules" --files report.md --dry-run
```

Target matching is semantic: `"data sources"` includes source attributions and provenance, while an exact rule or project name includes obvious contextual references. `/hiding` removes the smallest coherent prose or comment unit that hides the target. Matches in executable code, identifiers, or behavior-affecting configuration are reported for human review and are never modified automatically.

### Output Modes

| Mode | Behavior |
|------|----------|
| `inplace` (default) | Modify file in place — classic `/hiding` |
| `newfile` | Create `<name>-cleaned.<ext>`, leave original untouched |
| `backup` | Rename original to `<name>.<ext>.bak`, write cleaned to original name |

If the target (`-cleaned` file or `.bak`) already exists, `/hiding` never overwrites it — it writes to a numbered alternative (`-cleaned-2`, `.bak-2`) and reports which name it used.

### Security: Credential Handling

When secrets or credentials (API keys, tokens, passwords) are **found** — whether stripped or only previewed via `--dry-run` — `/hiding` **always warns**:

> ⚠️ Security-sensitive content was found {and removed / preview only}. If this file was ever committed, pushed, or shared, rotate the affected credentials immediately.

This is the only mandatory exception to silent execution — because a silent credential strip where the user doesn't know to rotate is worse than a noisy one.

## Version

Current: **0.7.0** — User-specified semantic targets, literal, current-session, and Git-worktree file selection (`--files`), output modes (inplace/newfile/backup), dry-run preview, fresh-context sub-agent review, credential security warnings, and AI-facing rationale/guardrail coverage.

## Responsible Use

`/hiding` removes noise — leaked credentials, reasoning scaffolding, rule citations — so files stand on their own as reference material. It is **not** a tool for evading disclosure obligations. If your employer, project, or publication venue requires disclosing AI assistance, that policy governs; cleaning a file's contents does not change what you must declare. You are responsible for complying with the disclosure rules that apply to you.

## License

[MIT](LICENSE)
