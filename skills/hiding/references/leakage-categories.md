# Leakage Categories

Read this file before scanning or stripping a file. Judge by intent, not by keyword matching.

## Secrets and Credentials

Credentials and access-bearing endpoints are security risks. Internal names and other sensitive context may be leakage, but are not credentials and do not trigger rotation warnings by themselves.

Examples: API keys, tokens, passwords, connection strings, and access-bearing internal URLs.

Project codenames, mock data labels, server names, IPs, and non-access-bearing URLs are not a sixth built-in category. Remove them only when they match another category or an explicit user target.

Credentials are handled first. Follow the warning, executable-code, and configuration-value rules in `SKILL.md`.

## Unshared Rule References

References to knowledge the reader does not have. If a reader with only the file would be confused by the reference, strip it.

Examples: references to skill instructions, `CLAUDE.md`, architecture documents, team standards, or phrases such as "as instructed by", "following the convention", "per the skill", and "按照...的约定".

## AI-facing Rationale/Guardrails

Reasoning about AI-facing constraints instead of documenting the chosen result. Business and technical rationale written for future readers remains valid documentation.

Strip prompt compliance, refusal justification, safety fences, and narration about satisfying agent instructions. Preserve requirements, architecture decisions, alternatives, evidence, trade-offs, and conclusions that help a reader understand or maintain the result. A sentence such as "we chose X because Y" is not leakage by itself; judge its audience and lifecycle.

## AI Self-Reference

Language that reveals AI authorship, including first-person narration, confidence hedging, identity disclosure, or meta-commentary about the output.

Examples: "I'll start by...", "First let me...", "I think...", "As an AI...", "As Claude...", "Here's the result:", "I hope this helps!", and self-corrections in comments.

TODO, FIXME, and HACK markers are not leakage by themselves. Strip only accompanying AI narration.

## Thought-process Traces

Transient documentation of how the current session reached a result rather than durable reference material.

Strip conversational derivations, intermediate attempts, temporary work logs, and session-bound step-by-step reasoning from deliverables. Preserve ADRs, final research findings, requirements, implementation plans intended for the project, and other independently useful records.

## Overlap

Categories may overlap. AI-facing rationale/guardrails and thought-process traces commonly overlap. When uncertain whether content is transient process or durable rationale, preserve it; in HITL or `--dry-run`, flag it for human review instead of stripping.
