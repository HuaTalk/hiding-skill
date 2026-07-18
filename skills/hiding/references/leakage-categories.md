# Leakage Categories

Read this file before scanning or stripping a file. Judge by intent, not by keyword matching.

## Secrets and Credentials

Credentials and access-bearing endpoints are security risks. Internal names and other sensitive context may be leakage, but are not credentials and do not trigger rotation warnings by themselves.

Examples: API keys, tokens, passwords, connection strings, and access-bearing internal URLs.

Project codenames, mock data labels, server names, IPs, and non-access-bearing URLs are sensitive context. Classify them separately unless they grant access.

Credentials are handled first. Follow the warning, executable-code, and configuration-value rules in `SKILL.md`.

## Unshared Rule References

References to knowledge the reader does not have. If a reader with only the file would be confused by the reference, strip it.

Examples: references to skill instructions, `CLAUDE.md`, architecture documents, team standards, or phrases such as "as instructed by", "following the convention", "per the skill", and "按照...的约定".

## AI-facing Rationale/Guardrails

Reasoning about AI-facing constraints instead of documenting the chosen result. State the decision, not the derivation or justification. Business constraints remain valid documentation.

Examples: "I can't use X because the team requires Y", "we chose X because...", "由于规范要求...", and design or research rationale trails.

## AI Self-Reference

Language that reveals AI authorship, including first-person narration, confidence hedging, identity disclosure, or meta-commentary about the output.

Examples: "I'll start by...", "First let me...", "I think...", "As an AI...", "As Claude...", "Here's the result:", "I hope this helps!", and self-corrections in comments.

TODO, FIXME, and HACK markers are not leakage by themselves. Strip only accompanying AI narration.

## Thought-process Traces

Documentation of how a result was reached rather than the resulting reference material. If it reads like a lab notebook instead of standalone reference documentation, strip it.

Examples: "we chose X because...", dated progress logs, research findings, decision records, step-by-step reasoning, and sections headed "progress" or "findings".

## Overlap

Categories may overlap. When uncertain, apply the stricter judgment and strip. AI-facing rationale/guardrails and thought-process traces commonly overlap.
