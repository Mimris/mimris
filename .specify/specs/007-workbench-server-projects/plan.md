# Plan: Workbench Server Projects

## Implementation Notes

- Store server project JSON files under `data/workbench/<projectId>.json`.
- Add API routes:
  - `POST /api/workbench`
  - `GET /api/workbench/[id]`
  - `PUT /api/workbench/[id]`
- Extend the workspace adapter with:
  - load-time adaptation from workspace snapshot to Mimris state
  - save-time merge from Mimris state back into a canonical workspace snapshot
- Preserve the original loaded workspace snapshot in adapter metadata so save can be merge-preserving.
- Keep the existing local-file save flow unchanged.
- Add a minimal project-menu entry point for:
  - `Save to server`
  - `Open server project`

## Validation

- Save a local Mimris session to the server and confirm a new `projectId` is returned.
- Reopen the saved project using `/model?project=<id>`.
- Load a workspace snapshot with extra top-level workbench data, save it again from Mimris, and confirm the extra fields remain.
- Run `npm run build`.
