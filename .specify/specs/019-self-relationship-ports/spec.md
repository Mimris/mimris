# Draw self-relationships between different node sides

A user can draw a relationship from an object node back to itself with different start/end side anchors. For nodes exposing `edge-left`, `edge-right`, `edge-top` and `edge-bottom`, prefer the nearest eligible side port when the destination is the source node. If drawing started from the body port, resolve it to the starting side when inserting the link and use a distinct destination side. Preserve explicitly selected distinct side ports.

Use existing self-link validation and relationship-type selection. Ordinary links retain their existing port selection. Nodes without eligible side ports retain their existing linking behavior. Persist the chosen anchors through the existing relationship-view `fromPortid`/`toPortid` fields.

Acceptance: draw from the right side/body of Task to its bottom side, choose an allowed relationship type, then Reload. The visible loop starts on the right and ends on the bottom before and after Reload.

Self-link interior corners must be movable in both axes while preserving the existing routing shape. For orthogonal routes, including `sequenceLinkTemplate`, dragging a corner also adjusts its two adjacent bends to keep the connected segments horizontal and vertical. Endpoints remain attached and routing stays Orthogonal. Segment midpoint handles keep their existing segment-sliding behavior. Normal polylines retain their existing routing. The edited shape survives Reload. Ordinary links keep their existing reshaping behavior.

Moving the node of a manually edited self-link must translate the entire loop by the node's displacement. Preserve every corner and segment relative to the node during drag preview, mouse release, delayed route updates, queued persistence and Reload. A new path edit replaces any remembered translated route.

Preserve newly drawn self-loops as well as explicitly reshaped loops when their node moves. Capture their displayed route before movement and disable automatic endpoint adjustment for preserved self-loops, including when a two-way points binding supplies a GoJS List. The side attachment must remain unchanged relative to the node.

For `sequenceLinkTemplate`, preserve the manual self-loop at the GoJS route-computation boundary as well as in drop/save handlers. Bounds changes and link reconstruction must use the translated route, or persisted manual points when the in-memory translation is absent. Verify native mouse release, subsequent corner editing and Reload. Ordinary relationships continue to use the existing GoJS router.

Apply that route-computation protection to every editable relationship template, including default relationship links, `linkTemplate2` and annotation links. Visually identical self-loops must retain their shape after a node move regardless of the template used to render them. An empty live points collection must fall back to valid persisted relationship-view points.
