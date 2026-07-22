# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Identity

A standalone Claude Code plugin repository. Only the `/hiding` skill lives here — strategic content cleanup that strips AI leakage, exposed constraints, source/provenance clues, and user-specified sensitive content whenever a file needs to reveal less. Release hygiene is a common context, not a prerequisite.

**No runtime implementation or build.** This repo consists of skill definitions, documentation, and static contract checks.

## Commands

```bash
npm test                              # Run version and Skill contract checks
node scripts/check-versions.js        # Verify version consistency only
node scripts/check-skill-contract.js  # Verify static discovery, safety, and reference anchors
```

CI (`.github/workflows/test.yml`) runs these checks and additionally validates plugin JSON, SKILL.md frontmatter integrity, and English-document language separation. It runs on push to `main`, PRs, and `v*` tags.

## Core Architecture

The canonical skill is `skills/hiding/SKILL.md`; its directly linked references are runtime resources. Everything else is packaging, validation, or documentation.

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

### Core Contract

- Do not inject persistent constraints into normal sessions; preserve reasoning and generation quality.
- Process files only. Agent replies and conversation output are out of scope.
- Remove leakage without changing code logic or rewriting prose like a humanizer.
- Stay silent by default; the cleanup operation must leave no trace.
- Credential safety overrides silence: warn and recommend rotation whenever credentials are found.
- Require explicit user confirmation before deleting an entire file.
- Keep behavior consistent across supported agent environments.

### Product Positioning

`/hiding` is a strategic concealment tool, not only release hygiene. Its psychological use case is visibility control: the user decides which parts of a file's origin, process, AI participation, exposed constraints, and sensitive context remain inferable to the next reader. This includes source/provenance concealment and avoiding disclosure when that is the user's intent. Do not assume transparency or attribution is a product goal unless the user asks for it.

The core invariant is that the user controls the visible artifact while executable behavior remains unchanged. Review, handoff, archiving, publication, commit, push, and sharing are downstream contexts; none is required to invoke the skill.

### Post-hoc cleanup, not real-time constraint

`/hiding` is a cleanup tool, not a behavior modifier. It does NOT inject rules into agent sessions. It lets the model work naturally, then strips traces afterward.

Rationale (full argument in `docs/zh/design-tradeoffs.md`):
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

3. **Chinese documentation is user-facing only**: `README-zh.md` and `docs/zh/` exist for Chinese-speaking users. English docs live in `docs/en/`. All maintainer-facing content (this file, scripts, CI, SKILL.md body) is English.

4. **Version `0.7.1`**, installation path `hiding@hiding`. Features: leading user-specified semantic targets, literal-path, current-session, and Git-worktree file selection (`--files`), output modes (inplace/newfile/backup), `--dry-run`, `--use-subagent`, and credential-rotation warnings. `--files worktree` compares the primary-branch merge base with the worktree where the skill is invoked; omitting `--files` is equivalent to `--files session`.

## Maintenance

When updating the skill:

1. Keep universal workflow and reference routing in `skills/hiding/SKILL.md`; keep condition-specific details in its directly linked one-level references
2. Update `AGENTS.md` if the leakage category reference card changes
3. Update `README.md` / `README-zh.md` if user-facing behavior changes — the two are language versions of one document and must stay structurally identical (same section order, same headings, equivalent content); any change to one must be mirrored in the other. Known allowed divergence: the zh version's extra "能力边界" paragraph in 设计哲学.
4. Bump version in `.claude-plugin/plugin.json`, `package.json`, and `SKILL.md` frontmatter
5. Run `npm test` to verify versions and Skill contracts
6. Tag the release (`v0.6.1`, etc.) and push — CI publishes to npm on `v*` tags

### File map (what to edit for what change)

| Change | Files to edit |
|--------|--------------|
| Leakage category logic | `skills/hiding/SKILL.md` and its directly linked references |
| Pattern reference card | `AGENTS.md` |
| User-facing install/usage | `README.md`, `README-zh.md` |
| Version bump | `.claude-plugin/plugin.json`, `package.json`, `SKILL.md` frontmatter |
| CI checks | `.github/workflows/test.yml` |
