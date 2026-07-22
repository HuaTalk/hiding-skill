# Contributing to hiding-skill

Thanks for your interest in improving `/hiding`.

## Repository layout

This repo has no runtime implementation or build. It contains skill definitions, documentation, packaging metadata, and static contract checks.

| Change | Files to edit |
|--------|--------------|
| Leakage category logic / skill behavior | `skills/hiding/SKILL.md` and its directly linked references |
| Pattern reference card | `AGENTS.md` |
| User-facing install/usage docs | `README.md`, `README-zh.md` |
| Version bump | `.claude-plugin/plugin.json`, `package.json`, `SKILL.md` frontmatter (`metadata.version`) |
| Static Skill invariants | `scripts/check-skill-contract.js` |
| CI checks | `.github/workflows/test.yml` |

## Making a change

1. Keep universal behavior and routing in `skills/hiding/SKILL.md`; edit the corresponding directly linked reference for condition-specific behavior. See [Skill progressive loading](docs/en/skill-progressive-loading.md) for placement and model-validation rules.
2. Keep `AGENTS.md` (the condensed reference card) in sync if the pattern logic, output modes, flags, or execution rules changed.
3. Keep `README.md` and `README-zh.md` in sync if user-facing behavior changed. The two READMEs must say the same thing.
4. Update `CHANGELOG.md`.
5. Run `npm test` - it verifies version consistency, static Skill contract anchors, and local reference integrity. This does not replace agent-level behavior validation.

## Language conventions

- Maintainer-facing content (SKILL.md body, `CLAUDE.md`, scripts, CI, this file) is **English**.
- `README-zh.md` and `docs/zh/` are user-facing Chinese documentation.
- The SKILL.md `description` frontmatter carries bilingual trigger phrases — keep both languages when editing it.

## Design constraints (read before proposing features)

`/hiding` is a **post-hoc cleanup tool**, not a real-time behavior constraint. Proposals that inject rules into agent sessions (always-on rule files, session hooks, statusline badges) conflict with the project philosophy and will be declined. See `CLAUDE.md` and `docs/zh/design-tradeoffs.md` for the full rationale.

Silent execution is the default. Any user-visible output must be required by the corresponding Skill workflow and covered by its reporting contract, not added ad hoc.

## Releasing (maintainers)

1. Bump the version in all three files: `.claude-plugin/plugin.json`, `package.json`, `SKILL.md` frontmatter.
2. `npm test` must pass.
3. Move the `Unreleased` CHANGELOG entry to the release date.
4. Run `npm pack --dry-run` and verify that the package contains every local file linked from the READMEs.
5. Tag `vX.Y.Z` and push. CI validates the tag version and publishes to the official npm registry.

### First npm publication

The package is scoped and must be public. `package.json` pins both
`publishConfig.access` and `publishConfig.registry`; do not rely on a developer's
machine-wide npm configuration.

Before the first publication:

1. Sign in explicitly against the official registry:
   `npm login --scope=@huatalk --registry=https://registry.npmjs.org/`.
2. Run `npm whoami --registry=https://registry.npmjs.org/`. If it returns
   `huatalk`, the account owns the matching personal scope. If `@huatalk` is an
   organization scope instead, run
   `npm org ls huatalk --registry=https://registry.npmjs.org/` and confirm in
   the npm organization settings that the account may create packages.
3. Create a short-lived or granular npm access token with publish permission and
   store it as the repository secret `NPM_TOKEN`.
4. Push the release tag. While `NPM_TOKEN` exists, the tag-triggered `publish`
   workflow uses it for the first publication. This token path exists only
   because npm Trusted Publisher cannot be configured until the package exists.

After the first package exists, configure Trusted Publisher on the npm package
`@huatalk/hiding-skill` with GitHub owner `HuaTalk`, repository `hiding-skill`,
and workflow filename `publish.yml`. Then delete the `NPM_TOKEN` repository
secret. Subsequent `v*` tag pushes publish through GitHub Actions OIDC and do not
read an npm token. The workflow's `id-token: write` permission and `npm@latest`
installation are required for that path.
