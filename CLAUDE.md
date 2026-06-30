# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Identity

A standalone Claude Code plugin repository. Only the `/hiding` skill lives here — strip AI leakage from files before committing, pushing, or sharing.

**No source code, no build, no tests.** This repo consists entirely of skill definitions and documentation.

Artifacts:
- `.claude-plugin/plugin.json` — plugin manifest (name: `hiding-skill`, version: `0.5.0`)
- `.claude-plugin/marketplace.json` — marketplace listing (plugin registered as `hiding`)
- `skills/hiding/SKILL.md` — the skill definition (English, loaded by the dispatcher, **canonical source**)
- `AGENTS.md` — canonical portable rules (source of truth for multi-platform copies)
- `package.json` — npm publishing metadata

Plugin manifests (one per agent host):
- `.codex-plugin/plugin.json` — Codex
- `.devin-plugin/plugin.json` — Devin CLI
- `plugin.yaml` + `__init__.py` + `after-install.md` — Hermes Agent
- `gemini-extension.json` — Gemini CLI / Antigravity
- `opencode.json` + `.opencode/command/hiding.md` — OpenCode
- `.agents/plugins/marketplace.json` — Agent Protocol

Multi-platform rule adapters (generated from `AGENTS.md`, verified by `scripts/check-rule-copies.js`):
- `.cursor/rules/hiding.mdc` — Cursor
- `.windsurf/rules/hiding.md` — Windsurf
- `.clinerules/hiding.md` — Cline
- `.github/copilot-instructions.md` — GitHub Copilot
- `.kiro/steering/hiding.md` — Kiro
- `.agents/rules/hiding.md` — Agent Protocol

Skill packages:
- `commands/hiding.toml` — Claude Code native command
- `.openclaw/skills/hiding/SKILL.md` — OpenClaw skill

Infrastructure:
- `scripts/check-rule-copies.js` — verify multi-platform copies match `AGENTS.md`
- `.github/workflows/test.yml` — CI: rule copy check + JSON validation + frontmatter check

Documentation (reference only, not loaded by the dispatcher):
- `README.md` / `README-zh.md` — user-facing usage docs
- `CLAUDE-zh.md` — Chinese translation of this file
- `ROADMAP-zh.md` — planned improvements (Chinese)
- `docs/agent-portability.md` — which files map to which agent

## Skill Architecture

The entire `/hiding` logic lives in `skills/hiding/SKILL.md` (~207 lines). Key architecture:

### Leakage Detection: 5 Patterns (S/R/C/A/T)

| Pattern | Principle |
|---------|-----------|
| **S**ecret | Credentials, tokens, internal URLs — security risks |
| **R**ule | References to knowledge the reader doesn't share (CLAUDE.md, skill instructions) |
| **C**onstraint | Rationale about AI-facing constraints rather than business decisions |
| **A**I Self-Reference | Language revealing the author is an AI (first-person narration, hedging) |
| **T**hought Process | Derivation trails, research logs, step-by-step reasoning |

Patterns are **principle-driven**, not keyword-matched. The examples calibrate judgment; the principle is what matters.

### Execution Modes: 3 Entry Points

1. **No arguments** → Session-Aware HITL: scan conversation context, present findings, user decides
2. **File path** → File mode: execute Steps 0–4 on one file
3. **Description** → Description mode: match content by meaning, apply patterns silently

### Execution Steps: 4 Sequential Gates

- **Step 0**: Validate (exists, not binary, not too large)
- **Step 1**: File-level purge check — if < 20% substantive content remains after removing Pattern T, ask to delete the whole file
- **Step 2**: Strip secrets (Pattern S) — zero tolerance, runs before anything else
- **Step 3**: Strip style leakage (Patterns R, C, A, T) — cosmetic/quality concerns
- **Step 4**: Verify structural integrity (brace matching, JSON/YAML validity, heading continuity)

### Silent Execution

The core design philosophy: after `/hiding` runs, no one should be able to tell it ran. Three levels of failure:
1. Explicit markers (`// cleaned by /hiding`) — worst
2. Verbal acknowledgment ("file cleaned") — bad
3. Silent artifacts (extra blank lines, whitespace changes) — subtle but real

The only exceptions to silence: HITL interactions (user-facing decisions, not cleanup announcements).

## Design Decisions

1. **Bilingual trigger words in SKILL.md `description`**: The English SKILL.md includes both English and Chinese trigger phrases in its frontmatter `description` field, so Chinese-speaking users invoking `/hiding` also match the skill. This means only one SKILL.md is needed — no separate Chinese skill file.

2. **Chinese content is documentation only**: `README-zh.md`, `CLAUDE-zh.md`, and `ROADMAP-zh.md` exist as reference translations for Chinese-speaking contributors. They are NOT loaded by the dispatcher. Only `SKILL.md` needs to be maintained as the canonical skill definition.

3. **Multi-platform distribution**: The same hiding rules are available for 5+ agents via platform-specific adapter files. `AGENTS.md` is the canonical source; `scripts/check-rule-copies.js` verifies all copies stay in sync. See `docs/agent-portability.md` for the full mapping.

4. **Version `0.5.0`**: Stable with session-aware HITL mode, five-pattern detection, and file-level purge check.

5. **Installation path `hiding@hiding`**: marketplace plugin name is `hiding`, repo name is `hiding-skill`.

## Installation (Consumer Repos)

```bash
/plugin marketplace add https://github.com/HuaTalk/hiding-skill.git
/plugin install hiding@hiding
```

Restart Claude Code. The `/hiding` command is loaded.

Upgrade: `/plugin update hiding@hiding` + restart.

### Local Testing (symlink fallback)

```bash
ln -sf ~/path/to/hiding-skill/skills /path/to/project/.claude/skills
```

## Maintenance

When updating the skill:
1. Edit `skills/hiding/SKILL.md` — this is the only canonical skill file
2. If the core rules change, update `AGENTS.md` and run `node scripts/check-rule-copies.js` to sync multi-platform copies
3. Update documentation files (`README.md`, `README-zh.md`) if the change affects user-facing behavior
4. Bump version in `.claude-plugin/plugin.json`, `package.json`, and `SKILL.md` metadata
5. Tag the release and push — CI publishes to npm on `v*` tags
6. Notify consumers to run `/plugin update hiding@hiding` + restart Claude Code

See `ROADMAP-zh.md` for planned improvements.
