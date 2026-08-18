# Feature Specification: GoJS Swimlane Core

**Feature Branch**: `003-gojs-swimlane-core`
**Created**: 2026-06-30
**Status**: In progress
**Input**: User description: "Refactor BPMN swimlanes so a newly built pool with lanes behaves like the GoJS swimlane sample, while preserving Mimris palette drag/drop and BPMN metamodel integration."

## User Scenarios & Testing

### Primary User Story
A modeller building BPMN swimlanes wants pools and lanes to behave predictably, like the GoJS swimlane sample, so that creating, resizing, moving, collapsing, expanding, and populating swimlanes feels stable and maintainable.

### Acceptance Scenarios
1. **Given** a modeller drops a new pool on the canvas, **When** the pool appears, **Then** it renders with a stable header/body structure and can be moved and resized without snapping, stretching, or stale re-layout side effects.
2. **Given** a modeller drops one or more lanes onto a pool, **When** the drop completes, **Then** each lane becomes a real member of that pool in both live GoJS state and persisted Mimris modelview state.
3. **Given** a modeller moves a pool by its header, **When** the drag preview runs and the mouse is released, **Then** the pool and its member lanes move together visually and remain in the dropped position.
4. **Given** a modeller resizes a pool or a lane, **When** the resize completes, **Then** the equivalent pool-header **Do Layout** is applied automatically, pool and lane geometry remain visually consistent, and no manual layout action is required.
5. **Given** a modeller resizes a pool containing BPMN nodes in its lanes, **When** the resize completes, **Then** each lane retains its correct vertical position and the contained BPMN nodes retain their lane layout rather than being shifted or reflowed incorrectly.
6. **Given** a modeller drops a new lane from the palette onto a pool, **When** the drop completes, **Then** the new lane body height immediately matches its lane header height without requiring a resize or manual layout action.
7. **Given** a modeller collapses and re-expands a pool, **When** the state toggles, **Then** the same lanes are hidden and restored without changing membership or corrupting geometry.
8. **Given** a modeller drops a BPMN node into a lane, **When** the node is persisted and the page reloads, **Then** the node remains a member of that lane and the swimlane geometry is unchanged.
9. **Given** a modeller uses palette drag/drop for pool, lane, and ordinary BPMN nodes, **When** each object is dropped, **Then** Mimris creates the correct metamodel-backed objectview while the swimlane core controls only pool/lane behavior.
10. **Given** a modeller opens an existing persisted model containing BPMN pools and lanes, **When** the diagram loads, **Then** swimlanes are rebuilt using the new core without requiring a migration that changes stored domain semantics.

### Edge Cases
- What happens when a lane is dropped near the edge of a pool header versus the pool body?
- What happens when a pool contains nested BPMN nodes but only one lane?
- What happens when a lane is dropped onto empty canvas instead of onto a pool?
- What happens when a persisted swimlane has stale geometry but valid `group` membership?
- What happens when a modeller moves a pool immediately after resizing it?
- What happens when multiple lanes are reordered or resized after reload?
- What happens when the new swimlane core is enabled for one modelview while legacy logic still exists in the codebase behind a feature flag?

## Requirements

### Functional Requirements
- **FR-001**: The system MUST designate a single swimlane behavior owner module that defines pool and lane mechanics.
- **FR-002**: The system MUST implement pool and lane movement, resize, collapse, expand, and membership semantics from a GoJS-sample-first swimlane core rather than from distributed corrective logic.
- **FR-003**: The system MUST preserve Mimris palette drag/drop for new BPMN objects while routing pool/lane drops through the swimlane core.
- **FR-004**: The system MUST treat persisted `group` membership as the primary truth for swimlane containment.
- **FR-005**: The system MUST persist only the minimal swimlane geometry needed for reload fidelity: `loc`, `size`, `group`, `laneIndex`, and `isExpanded`.
- **FR-006**: The system MUST ensure that lanes dropped onto pools become actual GoJS group members and persisted modelview members in the same completed interaction.
- **FR-007**: The system MUST allow a moved pool to keep its dropped position after mouse release without snap-back caused by later synchronization or stabilization passes.
- **FR-008**: The system MUST allow pool and lane geometry to reload without requiring geometry-derived membership repair when valid membership data already exists.
- **FR-009**: The system MUST keep BPMN-specific concerns limited to template selection, palette entries, metamodel object creation, and node presentation rather than swimlane mechanics.
- **FR-010**: The system MUST provide a feature-flagged rollout path so the new swimlane core can be tested before legacy swimlane behavior is fully removed.
- **FR-011**: The system MUST keep persisted BPMN pool and lane semantics compatible with existing saved models unless an explicit migration is later approved.
- **FR-012**: The system MUST remove or quarantine legacy pool/lane stabilization, normalization, and geometry repair logic once the new swimlane core is verified.
- **FR-013**: On completion of a pool or lane resize, the system MUST apply pool/lane layout automatically and persist the completed geometry without requiring the modeller to invoke **Do Layout** manually.
- **FR-014**: Automatic resize layout MUST preserve each lane's correct position and MUST NOT incorrectly shift or reflow BPMN nodes contained in a lane.
- **FR-015**: A lane dropped onto a pool MUST initialize its body height from its header/layout height before the pool layout is applied, so both areas match immediately.

### Key Entities
- **Swimlane Core**: The single module that owns pool/lane behavior, templates, layout, and tool semantics.
- **Pool Group**: A GoJS group representing a BPMN pool whose member lanes define its internal structure.
- **Lane Group**: A GoJS group representing a BPMN lane whose containing group is a pool and whose member nodes are ordinary BPMN nodes.
- **Drop Adapter**: The integration layer that converts Mimris palette drops into pool, lane, or ordinary node creation while delegating swimlane behavior to the swimlane core.
- **Swimlane Persistence Contract**: The limited set of persisted properties required to reconstruct the swimlane after reload.
- **Legacy Swimlane Logic**: Existing distributed code in `GoJSApp.tsx`, `Diagram.tsx`, `ui_diagram.ts`, and related files that currently attempts to correct swimlane state after user interactions.

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details beyond architecture and observable behavior
- [x] Focused on modeller-facing stability and maintainability
- [x] Written so both product and engineering can review the intended replacement
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No unresolved clarification markers remain
- [x] Requirements are testable visually and through persisted state inspection
- [x] Scope is bounded to swimlane ownership, behavior replacement, and integration boundaries
- [x] Dependencies and rollout assumptions identified
