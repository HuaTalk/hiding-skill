# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Identity

A standalone Claude Code plugin repository. Only the `/hiding` skill lives here — strip AI leakage from files before committing, pushing, or sharing.

**No source code, no build, no tests.** This repo consists entirely of skill definitions and documentation.

Artifacts:
- `.claude-plugin/plugin.json` — plugin manifest (name: `hiding-skill`, version: `0.5.0`)
- `.claude-plugin/marketplace.json` — marketplace listing (plugin registered as `hiding`)
- `skills/hiding/SKILL.md` — the skill definition (English, loaded by the dispatcher, **canonical source**)
- `AGENTS.md` — leakage pattern reference card
- `commands/hiding.toml` — Claude Code native command
- `package.json` — npm publishing metadata

Hooks:
- `hooks/claude-codex-hooks.json` — Claude Code SessionStart hook config
- `hooks/hiding-activate.js` — SessionStart awareness context (primes model to avoid leakage)

Infrastructure:
- `scripts/check-versions.js` — verify version consistency across `.claude-plugin/plugin.json`, `package.json`, and `SKILL.md`
- `.github/workflows/test.yml` — CI: version check + JSON validation + frontmatter check
- `.github/workflows/publish.yml` — npm publish on `v*` tags (OIDC)

Documentation (reference only, not loaded by the dispatcher):
- `README.md` / `README-zh.md` — user-facing usage docs
- `docs/agent-portability.md` — which files map to which agent
- `docs/platform-native.md` — native replacements for common AI leakage

## Design Philosophy

### Post-hoc cleanup, not real-time constraint

The core design decision: `/hiding` is a cleanup tool, not a behavior modifier. It does not inject rules into every session to force the model to avoid AI leakage. Instead, it lets the model work naturally, then strips the traces afterward.

Rationale — see `docs/design-tradeoffs-zh.md` for the full argument. Summary:

- **Injected rules degrade thinking quality** — every token spent on self-censorship is a token not spent on reasoning.
- **Prevention doesn't eliminate cleanup** — models still leak even with rules active. The cleanup step is unavoidable.
- **Silent execution philosophy demands it** — "after `/hiding` runs, no one should be able to tell it ran." Real-time constraint produces unnatural output that betrays its origin; post-hoc cleanup can produce truly human-looking files.

### What we don't do

- Platform-specific rule copies (`.cursor/rules/`, `.windsurf/rules/`, `.clinerules/`, `.github/copilot-instructions.md`, `.agents/rules/`) — removed. These injected the hiding rules into every session, conflicting with the post-hoc philosophy.
- Rule copy verification scripts — removed. No copies to verify.
- Multi-agent plugin manifests beyond Claude Code — removed. `npx skills` handles distribution to 70+ agents.

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

1. **Post-hoc cleanup over real-time constraints**: The skill cleans files after generation, rather than injecting rules that constrain generation. See `docs/design-tradeoffs-zh.md`.

2. **Bilingual trigger words in SKILL.md `description`**: The English SKILL.md includes both English and Chinese trigger phrases in its frontmatter `description` field, so Chinese-speaking users invoking `/hiding` also match the skill. Only one SKILL.md is needed.

3. **`npx skills` as primary distribution**: `npx skills add HuaTalk/hiding-skill` distributes to 70+ agents. The Claude Code plugin marketplace is the secondary channel for users who prefer native installation.

4. **Version `0.5.0`**: Stable with session-aware HITL mode, five-pattern detection, and file-level purge check.

5. **Installation path `hiding@hiding`**: marketplace plugin name is `hiding`, repo name is `hiding-skill`.

## Installation (Consumer Repos)

### Primary: via npx skills (70+ agents)

```bash
npx skills add HuaTalk/hiding-skill
```

### Claude Code native

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
2. Update `AGENTS.md` if the leakage patterns change
3. Update documentation files (`README.md`, `README-zh.md`) if the change affects user-facing behavior
4. Bump version in `.claude-plugin/plugin.json`, `package.json`, and `SKILL.md` metadata
5. Tag the release and push — CI publishes to npm on `v*` tags
