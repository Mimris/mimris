# Palette Drop Anchor

## Status

Implemented.

## Problem

When an object type is dragged from the object type palette into the modelling canvas, the live drag preview is anchored with the cursor at the object upper-left. On mouse release, the object must remain at that same canvas position. It must not be translated after drop so that the cursor becomes the center of the object.

This jump makes placement feel inaccurate because the object lands somewhere other than the position shown during the drag.

## Requirements

- Palette-to-canvas drops must preserve the live GoJS drop location used during drag preview.
- The external drop handler must not move newly dropped nodes merely to align their center with the cursor.
- Persisted object-view location must match the rendered node location after the drop transaction.
- Existing group assignment, pool/lane handling, and optional auto drop layout behavior must continue to work.
- Drop layout may use the document drop point as contextual input, but only explicit auto-layout settings may reposition dropped nodes.
- Palette rendering must use the same fixed GoJS scale for object-type and object palettes, including when Mimris is embedded in a smaller iframe.
- Palette scale must not depend on iframe viewport height or content-fit autoscaling.
- Development iframe links to Mimris documentation must use the local dev origin; production must continue to use the published GitHub Pages URL.
- The document viewport metadata must be deterministic with one standard viewport declaration so top-level and iframe rendering use the same CSS pixel scale.

## Acceptance Scenarios

### Drop Plain Object Type

1. Open the modelling canvas.
2. Drag an object type from the object type palette onto empty canvas space.
3. Release the pointer.
4. The dropped object remains where the drag preview indicated it would land.
5. The object does not jump so that the pointer becomes its center.

### Drop Into Group

1. Open the modelling canvas with an existing group or container.
2. Drag an object type from the object type palette into the group.
3. Release the pointer.
4. The object is assigned to the correct group when group drop rules apply.
5. The object still keeps the visible drop position unless explicit auto drop layout is enabled.

## Verification

- Run the automated test suite.
- Run the production build.
- Verify the drag/drop behavior visually when browser automation or manual browser access is available.
- Verify object-type and object palettes render at matching visual scale in normal page and iframe contexts.
