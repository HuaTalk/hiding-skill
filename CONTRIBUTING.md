# Contributing to hiding-skill

Thanks for your interest in improving `/hiding`.

## Repository layout

This repo contains no source code, no build, and no runtime tests — it is entirely skill definitions and documentation.

| Change | Files to edit |
|--------|--------------|
| Leakage category logic / skill behavior | `skills/hiding/SKILL.md` and its directly linked references |
| Pattern reference card | `AGENTS.md` |
| User-facing install/usage docs | `README.md`, `README-zh.md` |
| Version bump | `.claude-plugin/plugin.json`, `package.json`, `SKILL.md` frontmatter (`metadata.version`) |
| CI checks | `.github/workflows/test.yml` |

## Making a change

1. Edit `skills/hiding/SKILL.md` for any behavior change.
2. Keep `AGENTS.md` (the condensed reference card) in sync if the pattern logic, output modes, flags, or execution rules changed.
3. Keep `README.md` and `README-zh.md` in sync if user-facing behavior changed. The two READMEs must say the same thing.
4. Update `CHANGELOG.md`.
5. Run `npm test` — it verifies the version is consistent across all version-bearing files.

## Language conventions

- Maintainer-facing content (SKILL.md body, `CLAUDE.md`, scripts, CI, this file) is **English**.
- `README-zh.md` and `docs/zh/` are user-facing Chinese documentation.
- The SKILL.md `description` frontmatter carries bilingual trigger phrases — keep both languages when editing it.

## Design constraints (read before proposing features)

`/hiding` is a **post-hoc cleanup tool**, not a real-time behavior constraint. Proposals that inject rules into agent sessions (always-on rule files, session hooks, statusline badges) conflict with the project philosophy and will be declined. See `CLAUDE.md` and `docs/zh/design-tradeoffs.md` for the full rationale.

Silent execution is the default; the exceptions are enumerated in SKILL.md ("Explicit Exceptions to Silence"). New user-visible output must be justified as a new numbered exception, not added ad hoc.

## Releasing (maintainers)

1. Bump the version in all three files: `.claude-plugin/plugin.json`, `package.json`, `SKILL.md` frontmatter.
2. `npm test` must pass.
3. Move the `Unreleased` CHANGELOG entry to the release date.
4. Tag `vX.Y.Z` and push — CI validates the tag matches the version and publishes to npm.
