# Feature Specification: IDEF0 ICOM Layout

**Feature Branch**: `001-idef0-icom-layout`  
**Created**: 2026-03-14  
**Status**: In Progress  
**Input**: User description: "Refine IDEF0 ICOM routing and labels so input, output, control, and mechanism text and hookup geometry read clearly."

## User Scenarios & Testing

### Primary User Story
A modeller working with IDEF0 diagrams wants ICOM markers, label text, and orthogonal relationship routing to be visually legible so that diagram semantics remain clear even in dense process boxes.

### Acceptance Scenarios
1. **Given** an IDEF0 process with input and output ICOMs, **When** orthogonal relationships bend near the group border, **Then** the side ICOM markers and labels remain readable and do not visually imply incorrect hookup points.
2. **Given** control and mechanism ICOMs on the top and bottom borders, **When** labels are short or long, **Then** they may wrap to two lines, maintain compact spacing, and keep their marker strips visually aligned to the border.
3. **Given** a modelview without explicit relationship routing, **When** the view is rendered, **Then** relationships default to orthogonal routing.
4. **Given** a bottom mechanism ICOM with a one-line or two-line label, **When** the label is rendered, **Then** the text aligns from the first line instead of sinking to the bottom of the label box.
5. **Given** an object converted into a non-ported group, **When** the group is first shown or later resized, **Then** the visible outer border remains fully visible on all sides and the resized state persists.
6. **Given** a port-to-port relationship with an orthogonal path, **When** a connected process is moved, **Then** stale stored path points are cleared so the relationship reroutes from the correct port side instead of flipping to the wrong end.
7. **Given** an object or group is converted between object and group representations, **When** the conversion is triggered from the canvas menu, **Then** the canvas updates immediately without requiring a full reload.
8. **Given** a process group is dragged onto another group, **When** the user does not hold `Shift`, **Then** the dragged group keeps its existing parentage and only repositions.
9. **Given** a process group is `Shift`-dragged into another group, **When** the drop is accepted, **Then** the dragged group becomes a member of the target group and is resized smaller than half-parent defaults so several subprocesses with ICOMs can fit inside the parent.
10. **Given** a grouped process is dragged inside its current parent without `Shift`, **When** the drag starts and continues, **Then** the child group follows the cursor smoothly without jumping to a corner or lagging behind the pointer.
11. **Given** the user is working inside nested groups, **When** `Space` is held and the pointer is dragged, **Then** the canvas pans without changing selection or firing click-driven focus/zoom behavior on mouse-up.
12. **Given** the modelling or landing page renders the project menu bar, **When** the page is opened after these interaction changes, **Then** the menu bar still renders without Redux hook failures and its actions can dispatch project-loading updates normally.
13. **Given** a group with ports has both visible ports and a visible inner frame, **When** the pointer is inside the inner frame, **Then** dragging repositions the group, and **When** the pointer is in the band between the outer and inner borders, **Then** relationship hookup targets the group body rather than a separate side strip or the move surface.
14. **Given** a group exposes visible ICOM ports, **When** the pointer is over a visible port marker, **Then** relationship hookup targets that explicit port instead of selecting or linking from the group body.
15. **Given** a new `isFollowedBy` or `triggers` relationship is created without an explicit routing value, **When** the relationship is first rendered, **Then** it defaults to `AvoidsNodes`.
16. **Given** a relationship uses `Orthogonal` or `AvoidsNodes` routing, **When** connected objects move or the diagram is saved, **Then** stale point arrays are not persisted and the route recomputes from current geometry.
17. **Given** a relationship uses an explicitly stored non-orthogonal route, **When** the diagram is edited and saved, **Then** its persisted point array remains intact across reloads.

### Edge Cases
- What happens when a side label is long enough to intersect the first orthogonal bend?
- What happens when adjacent control/mechanism labels are both two lines long?
- What happens when persisted diagrams already store non-orthogonal routing explicitly?
- What happens when a non-ported group is resized after conversion from an object?
- What happens when a moved port-to-port relationship still has persisted route points from an earlier geometry?
- What happens when a live object-to-group conversion changes the GoJS part class from node to group?
- What happens when a grouped subprocess is dragged near the rounded corners or port-label extents of a parent group?
- What happens when `Space` is pressed and released without dragging while keyboard shortcuts are active elsewhere in the diagram?
- What happens when a page-level menu component that dispatches model-loading actions is rendered after diagram interaction refactors?
- What happens when a group has both ICOM ports and a connectable body, and the pointer is near the inner frame border?
- What happens when a visible port sits close to the group body hit area and both could plausibly win the pointer hit?
- What happens when an existing `isFollowedBy` or `triggers` relationship already stores a non-default routing explicitly?
- What happens when an auto-routed orthogonal or `AvoidsNodes` relationship still carries stale point arrays from an earlier manual layout?
- What happens when a manually routed non-orthogonal relationship is edited after auto-routed point persistence is disabled?

## Requirements

### Functional Requirements
- **FR-001**: The system MUST render side ICOM markers with short neutral stubs close to the process border.
- **FR-002**: The system MUST allow side ICOM labels to remain outside the immediate routing gap and remain readable when orthogonal relships pass nearby.
- **FR-003**: The system MUST default relationship routing to orthogonal when a relview does not specify routing.
- **FR-004**: The system MUST allow control and mechanism labels to wrap to two lines.
- **FR-005**: The system MUST keep control and mechanism label spacing compact enough that neighboring top/bottom ICOM labels read as a group rather than isolated cards.
- **FR-006**: The system MUST allow top and bottom ICOM marker strips to be tuned independently so they sit flush with the visible group border.
- **FR-007**: The system MUST preserve existing persisted routing values when they are already explicitly set in data.
- **FR-008**: The system MUST keep top control labels bottom-aligned within their two-line label box while bottom mechanism labels align from the first visible line.
- **FR-009**: The system MUST allow object-to-group conversion to create a non-ported group that is large enough to show its inner frame and header without clipping.
- **FR-010**: The system MUST keep the visible border of non-ported groups fully rendered on all sides after selection and resize, and resized dimensions MUST persist after interaction.
- **FR-011**: The system MUST clear stale persisted path points for port-to-port relationships when connected objects move so orthogonal routing recomputes from the correct side-specific ports.
- **FR-012**: The system MUST rebuild converted object/group parts live on the canvas so object-to-group and group-to-object conversions are immediately visible without using reload.
- **FR-013**: The system MUST require `Shift` for regrouping objects or groups into a different non-lane group so plain dragging only repositions the existing selection.
- **FR-014**: The system MUST allow `Shift`-dragging a group out of its parent to detach it on the first attempt without snapping back on a second layout pass.
- **FR-015**: The system MUST size newly nested groups small enough to leave room for several subprocesses with ICOMs inside the parent, rather than using a fixed half-parent size.
- **FR-016**: The system MUST keep grouped child drags aligned to the cursor inside the parent bounds instead of jumping due to oversized hit or clamp bounds.
- **FR-017**: The system MUST allow temporary canvas panning with `Space` plus drag without breaking ordinary background dragging when `Space` is not held.
- **FR-018**: The system MUST keep project menu rendering stable after interaction changes so model-loading actions still dispatch correctly from the page-level project menu.
- **FR-019**: The system MUST let the visible inner frame of a ported group act as the move zone while the remaining visible group body continues to act as a single relationship hookup target when the pointer is not on an explicit port.
- **FR-020**: The system MUST let visible ICOM ports on groups win relationship hookup over the group body when the pointer is on the port marker or its intended hit area.
- **FR-021**: The system MUST default `isFollowedBy` and `triggers` relationships to `AvoidsNodes` only when no explicit routing is already set in the relview or typeview.
- **FR-022**: The system MUST avoid persisting `points` arrays for relationships whose effective routing is `Orthogonal` or `AvoidsNodes` so those routes recompute from current geometry after movement and reload.
- **FR-023**: The system MUST continue persisting `points` arrays for relationships with explicitly stored non-orthogonal routing so manual routes remain stable across saves and reloads.

### Key Entities
- **ICOM Marker**: The visible line/strip associated with an input, output, control, or mechanism attachment point.
- **ICOM Label**: The text associated with an ICOM port, including its wrapping, alignment, and spacing behavior.
- **Relationship View**: The persisted or runtime view data that determines routing, curve, points, and label placement for a relationship.
- **Auto-routed Relationship**: A relationship whose effective routing is `Orthogonal` or `AvoidsNodes` and whose path should be recomputed from current node geometry rather than replayed from stored point arrays.
- **Non-ported Group View**: A container-style group rendering without ports that may be created from an object view and later resized.
- **Ported Group View**: A process or container-style group with explicit ICOM ports and a body surface that must distinguish move-vs-connect hit zones.
- **Port Hit Area**: The effective interactive area around a visible ICOM marker that should resolve hookup to the explicit port rather than to the enclosing group body.

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details beyond visible behavior
- [x] Focused on user value and diagram readability
- [x] Written for non-technical stakeholders and developers reviewing UI behavior
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No unresolved clarification markers remain
- [x] Requirements are testable and visually reviewable
- [x] Scope is bounded to IDEF0 ICOM rendering, routing defaults, and adjacent group rendering/hit-zone behavior
- [x] Dependencies and assumptions identified
