# Git Worktree Selection

Read this file only for `--files worktree`, together with the loaded automatic eligibility rules.

Use local Git state only; do not fetch. Resolve paths from the working directory active when `/hiding` is invoked:

1. Run `git rev-parse --show-toplevel`; report and stop if outside a Git worktree. Require a valid `HEAD`.
2. If `HEAD` is attached, read its remote from `branch.<name>.remote`; when that value names a remote (not `.`), try the locally available symbolic ref `<remote>/HEAD`. Then try `origin/HEAD`, `origin/main`, local `main`, `origin/master`, and local `master`, in that order. Resolve symbolic refs to their target. Report and stop if no candidate resolves to a commit.
3. Run `git merge-base HEAD <base-ref>`; report and stop if no merge base exists.
4. From the repository root, collect tracked paths with `git diff --name-only --diff-filter=ACMRTUXB -z <merge-base> --` and untracked, non-ignored paths with `git ls-files --others --exclude-standard -z`.
5. De-duplicate the NUL-delimited paths. Exclude deleted files, ignored files, directories, and index entries with mode `160000` (submodules). Classify the remaining files using the loaded automatic eligibility rules.
6. Before Step 0 or any scan, resolve uncertain candidates autonomously using task/session context. Exclude low-confidence candidates without scanning. Under `--dry-run`, list these conservative exclusions with a brief reason.

This comparison is `merge-base(HEAD, primary branch) -> worktree at invocation time`, so it includes branch commits, staged changes, unstaged changes, and untracked files, but not primary-branch-only commits made after divergence.

If no eligible candidates remain after classification, report `No eligible files changed in the current worktree relative to <base>.` and stop. Under `--dry-run`, show the resolved base ref, merge base, eligible paths, and conservative scope exclusions before the normal preview. All output modes, purge checks, credential handling, and `--use-subagent` behavior then apply per selected file.
