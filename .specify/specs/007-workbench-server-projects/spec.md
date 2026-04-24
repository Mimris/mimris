# Spec: Workbench Server Projects

## Summary

Add a server-backed workbench project flow in Mimris so the current model can be saved to a canonical `mimris-ai-workspace` universe snapshot JSON file and reopened by short project id.

## Requirements

### Requirement 1: Save Mimris state as a server workbench project

Mimris MUST let the user save the current project to a server-side workbench JSON file.

#### Scenario: Create a new server project

- **Given** the current project has no existing server `projectId`
- **When** the user chooses `Save to server`
- **Then** Mimris creates a new file under the server workbench store
- **And** the response includes a short `projectId`
- **And** Mimris updates focus metadata to include that `projectId`

#### Scenario: Update an existing server project

- **Given** the current project already has a `projectId`
- **When** the user chooses `Save to server`
- **Then** Mimris updates the existing server file for that `projectId`

### Requirement 2: Preserve workbench-owned fields

Mimris MUST preserve workbench-only fields when saving a previously loaded workbench project.

#### Scenario: Save after loading a workbench universe snapshot

- **Given** Mimris loaded a workbench universe snapshot containing fields outside Mimris-owned modeling data
- **When** the user saves back to the server
- **Then** Mimris merges its updated `worldDefinition.domain`, `worldModel.metis`, and shared `focus` data into the original snapshot
- **And** untouched workbench-only fields remain in the saved JSON

### Requirement 3: Open a server workbench project by id

Mimris MUST load a server-side workbench project by short `projectId`.

#### Scenario: Open `/model?project=<id>`

- **Given** a valid workbench project id exists on the server
- **When** the user opens `/model?project=<id>`
- **Then** Mimris fetches the stored universe snapshot
- **And** adapts it into Mimris runtime state
- **And** resolves focus against the imported metis models

### Requirement 4: Use the workspace universe snapshot as the canonical server file

The server-backed project file MUST use the shared workspace universe snapshot shape rather than the old Mimris wrapper shape.

#### Scenario: Save a server project

- **Given** the current Mimris session is in the old internal `phData/phFocus` structure
- **When** Mimris saves to the server workbench store
- **Then** the written JSON uses `worldDefinition`, `worldModel`, `operationalModel`, and universe-level `focus`
- **And** the file is suitable for later alignment with `mimris-ai-workspace`
