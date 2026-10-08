# Complete Redux Toolkit migration and extract modelling packages

Created: 2026-10-08. Status: proposed implementation; planning only.

## Objective

Keep Mimris working as a standalone application while making its modelling core and editor reusable by Mimris AI Workspace from one maintained source in this repository. Complete the partial Redux Toolkit migration and remove verified obsolete code.

## Scope

- Complete typed Redux Toolkit model operations and standalone store wiring.
- Separate reusable modelling code from routing, application layout, file dialogs, storage, authentication and remote services.
- Produce consumable modelling-core and modelling-editor packages and prove them in a small host fixture.
- Preserve existing model/metamodel files, identifiers, unknown fields and durable diagram layout.
- Remove code and dependencies only after checking runtime entry points and compatibility obligations.

Workspace integration, database selection, server persistence, role enforcement, realtime collaboration, retirement of standalone Mimris and public package publication are separate work. Existing standalone remote workflows remain supported in the standalone shell until explicitly retired; they do not belong in the reusable packages.

## Requirements

1. Standalone startup, model loading, editing, export and reopening continue to work throughout migration.
2. Each host owns its store. Packages neither instantiate an application store nor import the standalone store, Next routes or Workspace services.
3. Each model operation has one authoritative reducer path. Legacy-shaped props may be derived temporarily; duplicate writable model trees must be removed.
4. Mutable GoJS diagrams/models and Metis runtime class instances stay outside Redux. Durable edits reach Redux as serializable operations.
5. The host supplies persistence and navigation capabilities. Embedded editing must not silently call standalone APIs or browser storage.
6. Existing snapshots retain model and metamodel identity, references, modelview geometry, optional fields and unrecognized host data through round trips.
7. Explicit file replacement and background refresh retain their distinct geometry behavior.
8. Packages expose typed, documented public entry points, styles/assets and an independently consumable build.
9. Cleanup evidence distinguishes unused implementation from externally reachable pages, APIs, dynamic registrations and persisted compatibility.
10. Neither application is required to share a live Redux instance, and no server-sharing implementation is introduced here.

## Acceptance scenarios

- Open an existing project, edit an object and relationship, save, reopen, and observe the same content and geometry.
- Switch model/modelview and target metamodel without stale selection, accidental startup-template replacement or cross-model edits.
- Drag, resize and regroup swimlanes; verify containment, links, ports and member positions before and after reload.
- Open a Workspace-origin snapshot, edit only owned modelling fields, and preserve unknown Workspace sections during export.
- Mount the editor in an independent host fixture, dispatch an edit through that host, and observe the updated host-owned state without a second model store.
- Unmount/remount the editor and create a second independent host without leaking diagrams, subscriptions, selection or global store references.
- Build/install the package tarballs in a clean fixture without resolving private source paths from this repository.

## Completion

Implementation is complete only when the plan's final gates pass. This specification does not claim that migration, package extraction, cleanup or browser verification has been performed.
