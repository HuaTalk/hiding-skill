# /hiding — Strip AI Leakage from Files

A Claude Code plugin that removes AI-generated artifacts from files before committing, pushing, or sharing.

## What It Does

`/hiding` cleans files so they read as if written by a human — no AI reasoning traces, no rule citations, no self-reference, no leaked credentials.

**Scope**: Files only (code, config, markdown, docs). Does NOT modify agent replies or conversation output.

## Before/After

```java
// Before /hiding
// I'll use the Builder pattern here since the constructor has too many params.
// As an AI, I think this is cleaner than telescoping constructors.
// Following the team conventions in CLAUDE.md, I'm adding validation.
public UserService createUser(UserDTO dto) {
    return User.builder()
        .name(dto.getName())
        .email(dto.getEmail())
        .build();
}

// After /hiding
public UserService createUser(UserDTO dto) {
    return User.builder()
        .name(dto.getName())
        .email(dto.getEmail())
        .build();
}
```

No markers. No annotations. No one can tell it ran. The code simply reads as if a human wrote it from the start.

## Five Leakage Patterns

| Pattern | What It Catches |
|---------|----------------|
| **S**ecret | API keys, tokens, passwords, connection strings, internal URLs |
| **R**ule | References to CLAUDE.md, skill instructions, team conventions the reader doesn't share |
| **C**onstraint | "I can't use X because the team requires Y", rationale trails about AI-facing constraints |
| **A**I Self-Reference | "As an AI…", "I think…", "Here's the result:", "I hope this helps!" |
| **T**hought Process | Step-by-step reasoning, dated progress logs, research findings, design rationale trails |

## Usage

```bash
/hiding                              # Session-aware HITL — scans session files + git uncommitted
/hiding <file>                       # Clean a specific file in-place
/hiding <description>                # Hide content matching the description (e.g., "/hiding mock data")
```

### Flags

| Flag | Values | Default | Description |
|------|--------|---------|-------------|
| `--mode` | `inplace` / `newfile` / `backup` | `inplace` | Where to write cleaned output |
| `--subagent` | (flag) | off | Use sub-agent for cleaner isolation |
| `--dry-run` | (flag) | off | Preview changes without modifying files |

```bash
/hiding --mode newfile file.java          # Output to file-cleaned.java, leave original
/hiding --mode backup config.yml          # Rename original to .bak, write cleaned
/hiding --dry-run file.java               # Preview what would change
/hiding --subagent file.java              # Strip via sub-agent for extra discipline
/hiding --dry-run                         # HITL preview without executing
```

### Output Modes

| Mode | Behavior |
|------|----------|
| `inplace` (default) | Modify file in place — classic `/hiding` |
| `newfile` | Create `<name>-cleaned.<ext>`, leave original untouched |
| `backup` | Rename original to `<name>.bak`, write cleaned to original name |

### Security: Credential Handling

When Pattern S (credentials, API keys, tokens) is detected and stripped, `/hiding` **always warns**:

> ⚠️ Security-sensitive content was removed. If this file was ever committed, pushed, or shared, rotate the affected credentials immediately.

This is the only mandatory exception to silent execution — because a silent credential strip where the user doesn't know to rotate is worse than a noisy one.

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

## Design Philosophy

`/hiding` is a **post-hoc cleanup tool**, not a real-time behavior constraint. It does not inject rules into your agent's session context. Instead, it lets the model work naturally, then strips the traces afterward. This preserves thinking quality and follows the silent execution principle — after `/hiding` runs, no one should be able to tell it ran.

Think of it like Fermat's margin note. Fermat didn't show his work — he wrote the theorem and moved on. The proof became legend. `/hiding` gives your code the same mystique: the result stands on its own, with no visible scaffolding. Your colleagues will wonder how you wrote it so cleanly. (See [The Fermat Principle](docs/hiding-philosophy.md) for the full, slightly irreverent argument.)

See [设计取舍：事后清理而非实时约束](docs/design-tradeoffs-zh.md) (Chinese) for the full technical rationale.

## Execution Guarantees

- **Silent by default** — after `/hiding` runs, no one should be able to tell it ran. No markers, no announcements, no side effects.
- **Code logic is NEVER changed** — only comments and prose are stripped.
- **Structurally safe** — post-cleanup validation uses actual parsers (JSON, YAML, XML) where available.
- **HITL for deletions** — file-level purge candidates require user confirmation before deletion.
- **Credential warnings** — Pattern S stripping always produces a rotate-credentials warning.
- **Three output modes** — inplace (default), newfile (original preserved), backup (original renamed to `.bak`).

## Version

Current: **0.6.0** — Output modes (inplace/newfile/backup), dry-run preview, sub-agent execution, credential security warnings, git-uncommitted discovery, expanded file type support.

## License

[MIT](LICENSE)
