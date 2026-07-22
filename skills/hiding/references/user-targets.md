# User-Specified Targets

Read this file only when the invocation contains one or more semantic targets.

User targets augment, never replace, the five leakage categories and credential scan. Match by meaning: `"data sources"` includes source attributions and provenance; an exact project or rule name includes obvious contextual references. Do not broaden a target to merely related content.

- In comments or prose, remove the smallest complete sentence, paragraph, list item, or block needed to hide the target while keeping the remainder coherent. Do not invent replacement facts.
- In executable code, identifiers, or behavior-affecting config values, do not modify the match. Report `<file>:<line>` for human review without echoing sensitive values.
- If removing target matches would leave no useful standalone content, apply the purge confirmation rule.
- Zero matches for a target do not produce output outside Session HITL or `--dry-run`.
