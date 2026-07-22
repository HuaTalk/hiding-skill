# Skill Progressive Loading

Use progressive loading to reduce the context paid on every activation without weakening discovery, safety, or behavior. This guide covers how this repository organizes and validates agent Skill instructions; it is not a general Agent Skills tutorial.

## Loading Layers

Separate the runtime loading layers from repository validation:

| Layer | Used when | Put here |
|-------|-----------|----------|
| Discovery metadata (`name` and `description`) | During discovery | A stable routing name and complete trigger description |
| `SKILL.md` | Whenever the Skill activates | Universal workflow, ordering, safety gates, and reference routes |
| Direct references | Only when a named condition applies | Complete selector, mode, target, or output-specific workflows |
| Invoked scripts | When a routed workflow calls them | Deterministic, repeated operations that do not require source in model context |
| Static checks | During repository validation, not Skill execution | Regression guards for discovery metadata, the reference graph, and required runtime anchors |

Moving text out of `SKILL.md` helps only when the entry point states exactly when to load it. An unconditional reference merely relocates the same context cost.

## Placement Test

Evaluate each instruction in this order:

1. Keep it in `SKILL.md` if it applies to every invocation, changes global execution order, protects a high-consequence boundary, or must be known before the agent can recognize a branch.
2. Move it to a direct reference if the need is conditional and recognizable from parsed input or resolved state before loading the details.
3. Move it to an invoked script if the operation is deterministic, repeated, and safer to execute than reconstruct from prose.
4. Protect stable structure or required runtime text with a static check; never relocate runtime semantics into a checker.
5. Remove it if it only repeats the description, enumerates familiar examples, explains ordinary model knowledge, or restates a contract already expressed more precisely elsewhere.

Do not move an invariant behind a later route. A write-safety rule, for example, cannot live only in a reporting reference when successful writes are silent.

## Reference Structure

- Link every runtime reference directly from `SKILL.md`; keep the graph one level deep.
- Name the load condition beside the link. Prefer "when `--files worktree` is selected, read ..." over "see ... for details."
- Begin each reference with its own load condition so it remains safe when opened directly.
- Resolve selection and eligibility before loading content-scanning rules when the selection may be empty or excluded.
- Keep one coherent conditional workflow together. Do not fragment a short branch merely to reduce line counts.
- Do not duplicate detailed rules between the entry point and a reference. Keep only the route and any universally required invariant in the entry point.

In this repository, `scripts/check-skill-contract.js` enforces direct reachability and rejects local reference-to-reference links.

## Harness Policy

New Skills default to a minimum baseline of DeepSeek V4 Pro capability. A Skill may document a higher floor. `ccyolo` is an accepted local runner for the default baseline. Some degradation on weaker models is acceptable.

Add behavioral harness text only when all of these are true:

- A fresh-context run on the baseline model actually fails, preferably more than once when the behavior is stochastic.
- The failure has meaningful consequences such as credential disclosure, destructive action, scope expansion, behavior changes, or a broken user-visible contract.
- A focused instruction can prevent the failure without constraining ordinary reasoning across unrelated cases.
- The instruction is placed where it is available before the failing decision.

Do not add rules for hypothetical mistakes that the baseline model handles reliably. Use static checks proactively for deterministic structure, such as immutable discovery text and reference reachability. Once an observed baseline failure justifies a behavioral harness, add a focused anchor when losing that wording would recreate the failure. Static checks do not supply runtime instructions and should not reproduce the whole Skill.

## Evaluation Loop

1. Record an immutable behavior oracle and the baseline Skill revision.
2. Measure the entry file before changing it: lines, words, and bytes.
3. Select the highest-context-cost conditional branch or the clearest redundant block.
4. Make one focused change and freeze the candidate snapshot or hash.
5. Run the old and new versions with identical prompts in separate fresh contexts on the baseline model.
6. Grade observable behavior: references read, tool sequence, writes, confirmations, user-visible output, resulting file hashes, and structural validity.
7. When a failure justifies a harness, rerun the corrected candidate independently at least twice.
8. Commit structure reductions and failure-driven behavior fixes separately.
9. Repeat until another reduction would remove project-specific knowledge or high-consequence safeguards for negligible context savings.

Credential assertions apply to user-visible output and written artifacts. A model must read a source credential to detect it, so hidden reasoning or raw tool transport is not itself an output leak.

## Project Result

The progressive-loading pass beginning at `b305974` reduced `skills/hiding/SKILL.md` from 243 lines, 2,894 words, and 20,514 bytes to 120 lines, 1,283 words, and 9,256 bytes. That is a reduction of 50.6% by lines, 55.7% by words, and 54.9% by bytes while preserving the discovery description and behavior contract.

Seven conditional workflows moved into directly routed references. DeepSeek V4 Pro evaluations then exposed two consequential gaps: recognizable credential-pattern disclosure and assistant narration after a silent cleanup. Only those observed failures produced new always-loaded harness rules.

## Change Checklist

- Confirm the discovery description and version metadata changed only when intended.
- Confirm universal rules remain in `SKILL.md` and every conditional rule has an explicit direct route.
- Run `npm test` and `git diff --check`.
- Compare the description hash when the task requires it to remain byte-for-byte stable.
- Run fresh-context baseline-model cases for changed routing or behavior; static checks are not a substitute.
- Inspect tool traces and output artifacts, not only the final assistant message.
- Scan staged deliverables for credentials and unintended authoring traces before committing.
- Record notable changes in `CHANGELOG.md`. An internal refactor commit does not by itself require a version bump; follow the release workflow when preparing a release.

## Further Reading

- [Agent Skills specification](https://agentskills.io/specification)
- [Agent Skills best practices](https://agentskills.io/skill-creation/best-practices)
- [Evaluating Agent Skills](https://agentskills.io/skill-creation/evaluating-skills)
