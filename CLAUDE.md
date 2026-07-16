# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Identity

A standalone Claude Code plugin repository. Only the `/hiding` skill lives here — strip AI leakage from files before committing, pushing, or sharing.

**No source code, no build, no tests.** This repo consists entirely of skill definitions and documentation.

## Commands

```bash
npm test              # Verify version consistency across all version-bearing files
node scripts/check-versions.js   # Same, without npm
```

CI (`.github/workflows/test.yml`) additionally validates JSON syntax of plugin manifests and SKILL.md frontmatter integrity. CI runs on push to `main`, PRs, and `v*` tags.

## Core Architecture

The canonical skill: `skills/hiding/SKILL.md` (~360 lines). Everything else is packaging or documentation.

### Distribution: Two channels

| Channel | Reach | Mechanism |
|---------|-------|-----------|
| `npx skills add HuaTalk/hiding-skill` | 70+ agents | Discovers `skills/hiding/SKILL.md` from GitHub, symlinks to each agent |
| `/plugin install hiding@hiding` | Claude Code only | Native plugin marketplace via `.claude-plugin/` |

### Version tracking

Three files carry the version number:
- `.claude-plugin/plugin.json`
- `package.json`
- `skills/hiding/SKILL.md` (frontmatter `metadata.version`)

`scripts/check-versions.js` ensures all three agree. On `v*` tags, it also verifies the tag matches the version.

## Design Philosophy

### Post-hoc cleanup, not real-time constraint

`/hiding` is a cleanup tool, not a behavior modifier. It does NOT inject rules into agent sessions. It lets the model work naturally, then strips traces afterward.

Rationale (full argument in `docs/design-tradeoffs-zh.md`):
- **Injected rules degrade thinking quality** — tokens spent on self-censorship are not spent on reasoning.
- **Prevention doesn't eliminate cleanup** — models still leak even with rules active. The cleanup step is unavoidable.
- **Silent execution demands it** — real-time constraint produces unnatural output that betrays its origin; post-hoc cleanup can produce truly human-looking files. Silence is the default; it has documented exceptions (HITL interactions, credential-rotation warnings, `--dry-run` preview, structural-failure reporting, input errors). The credential exception is mandatory: a silent credential strip where the user doesn't know to rotate is worse than a noisy one.

### What we don't do

- **Always-on rule files** — removed (`.cursor/rules/`, `.windsurf/rules/`, etc.). They conflicted with the post-hoc philosophy by injecting constraints into every session.
- **Multi-agent plugin manifests** — removed (Codex, Devin, Gemini, Hermes, OpenCode, etc.). `npx skills` handles all agent distribution.
- **Statusline badges / flag files** — removed. Side effects outside the plugin directory violate the silent execution principle.
- **SessionStart awareness hook** — removed (`hooks/`). Even a "lightweight nudge" is a rule injection into every session, contradicting the post-hoc philosophy. The `/hiding` command is available on demand; no persistent reminder is needed.

## Key Design Decisions

1. **Bilingual trigger words in SKILL.md `description`**: The single SKILL.md includes both English and Chinese trigger phrases. No separate Chinese skill file needed.

2. **`npx skills` as primary distribution**: One command reaches 70+ agents. Claude Code native plugin is the secondary channel.

3. **Chinese documentation is user-facing only**: `README-zh.md` and `docs/design-tradeoffs-zh.md` exist for Chinese-speaking users. All maintainer-facing content (this file, scripts, CI, SKILL.md body) is English.

4. **Version `0.6.0`**, installation path `hiding@hiding`. Features: output modes (inplace/newfile/backup), `--dry-run`, `--subagent`, credential-rotation warnings, git-uncommitted discovery.

## Maintenance

When updating the skill:

1. Edit `skills/hiding/SKILL.md` — the only canonical skill file
2. Update `AGENTS.md` if the leakage pattern reference card changes
3. Update `README.md` / `README-zh.md` if user-facing behavior changes — the two are language versions of one document and must stay structurally identical (same section order, same headings, equivalent content); any change to one must be mirrored in the other. Known allowed divergence: the zh version's extra "能力边界" paragraph in 设计哲学.
4. Bump version in `.claude-plugin/plugin.json`, `package.json`, and `SKILL.md` frontmatter
5. Run `npm test` to verify consistency
6. Tag the release (`v0.6.1`, etc.) and push — CI publishes to npm on `v*` tags

### File map (what to edit for what change)

| Change | Files to edit |
|--------|--------------|
| Leakage pattern logic | `skills/hiding/SKILL.md` |
| Pattern reference card | `AGENTS.md` |
| User-facing install/usage | `README.md`, `README-zh.md` |
| Version bump | `.claude-plugin/plugin.json`, `package.json`, `SKILL.md` frontmatter |
| CI checks | `.github/workflows/test.yml` |
