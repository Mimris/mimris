# Partial implementation branch audit

Checked 2026-10-08 without checkout, merge, fetch or worktree changes.

## Mimris

Compared local branch tips with current `codex/swimlane-membership-release` HEAD using ancestry and git cherry patch equivalence.

| Branch/group | Finding |
| --- | --- |
| codex/rtk-shared-universe | Tip d00cd826 is already an ancestor of HEAD |
| shared-universe-domain-reads, model-mutations, gojs-mutations | All tips already ancestors |
| shared-universe-metamodel-mutations, metamodel-collections, reducer-tests | All tips already ancestors |
| shared-universe-cleanup, leaf-cleanup, main-page-wrappers | All tips already ancestors |
| codex/model-page-shared-universe | Two non-ancestor commits, 284e67fe and c08362b9; both patch-equivalent to commits in HEAD |
| codex/shared-universe-objectview-normalization | f7bf0829 non-ancestor; patch-equivalent in HEAD |
| codex/shared-universe-page-wrappers | 6eced7df non-ancestor; patch-equivalent in HEAD |
| codex/shared-universe-surface-reads | 14b884a7 non-ancestor; patch-equivalent in HEAD |

Live `git ls-remote` confirmed RTK, model-page, model-mutations, objectview-normalization, page-wrappers, reducer-tests and surface-reads branch tips matching local tips. Some cached remote-tracking refs no longer appeared in that filtered live listing. Cached refs are not proof that a remote branch still exists.

Conclusion: no unmatched patches were found on these candidate migration branches. Do not merge them again. Patch equivalence/ancestry proves incorporation, not that later edits have preserved all behavior; validate the current implementation.

Historical commit ff51e64c (2026-06-12) updated spec 006 with the Redux migration transition. The current store and sharedUniverse source show substantial migration already present, while legacy reducers, runtime store access and mirror state remain.

## Mimris AI Workspace

Local branch codex/shared-universe-rtk ends at 406f9bac. Its tip is an ancestor of both local main and current codex/browser-memory-retention. Relevant commits include:

- 7a3d6a75: shared universe compatibility state.
- 93abdb7e: store routed through shared RTK facade.
- c04531a6: universe actions exposed through shared module.
- 406f9bac: further workspace normalization.

Live remote checks failed with GitHub DNS resolution errors over SSH and HTTPS; remote branch existence/status is unverified. The local ancestry findings remain valid.

Neither current repository tree has a top-level packages directory. This audit found partial state migration, not completed reusable editor/core packaging. It is a targeted audit of relevant branches and commits, not an exhaustive semantic review of every historical branch.
