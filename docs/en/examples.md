# /hiding Examples

These examples show intended outcomes. Detection is contextual: `/hiding` decides whether content remains useful to a reader who only has the file, rather than matching a fixed keyword list.

## 1. Redundant Code Rationale

```python
# Before
# Returns a dict instead of a tuple for readability.
def get_user() -> dict[str, str]:
    ...

# After
def get_user() -> dict[str, str]:
    ...
```

The signature already communicates the return shape, so the comment does not add useful reference information.

## 2. Private Rule Reference

```markdown
Before:

> Per CLAUDE.md conventions, all APIs must use gRPC.
> Session notes: REST, gRPC, and GraphQL were compared.

After:

> All APIs use gRPC.
```

The durable decision remains. The unavailable rule citation and transient comparison trail do not.

## 3. Leaked Authoring Instructions

```markdown
Before:

# How Language Models Work

> Authoring note: Write for readers with no technical background.
> Per the Skill instructions, use analogies and avoid equations.

A language model predicts text, much like predictive typing at a larger scale.

After:

# How Language Models Work

A language model predicts text, much like predictive typing at a larger scale.
```

Instructions about how to write the document are removed from the document itself.

## 4. Process Notes in Configuration

```yaml
# Before
# Prompt constraint: do not use third-party actions.
# Temporary plan: pull image, install dependencies, test, build, upload.
steps:
  - run: ./ci.sh

# After
steps:
  - run: ./ci.sh
```

The workflow is self-describing. Prompt compliance and a temporary plan do not help its reader.

## 5. AI Self-Reference

```typescript
// Before
// Here's the UserProfile component I created.
// I think memoizing makes sense because props rarely change.
const UserProfile = memo(({ user }) => {

// After
// Memoized because props rarely change.
const UserProfile = memo(({ user }) => {
```

First-person narration is removed while the technical reason remains.

## 6. Credential Handling

The value below is illustrative and is not a working credential.

```yaml
# Before
service:
  api_key: "example-secret-value"

# Possible format-safe candidate
service:
  api_key: "<REDACTED>"
```

A format-safe placeholder is allowed only when the configuration remains structurally valid. A credential embedded in executable code is not silently changed; `/hiding` reports the location for human review instead.

Whenever a credential is found, including during `--dry-run`, `/hiding` warns that the credential may need rotation. It never prints the discovered value in its report.

## 7. User-Specified Target

```text
/hiding "internal project name" --files release-notes.md --dry-run
```

The target is interpreted semantically. Matching prose may be removed, but matches in identifiers, executable code, or behavior-affecting values are reported rather than changed.

## Verification

After producing a cleanup candidate, `/hiding` re-reads it and uses a parser for JSON, YAML, or XML where available. If structural verification fails, the candidate is discarded and the original remains unchanged.

For important files, run `--dry-run` first and follow cleanup with the host project's own tests and a dedicated secret scanner.
