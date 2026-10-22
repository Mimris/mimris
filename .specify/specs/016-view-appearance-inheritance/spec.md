# View appearance inheritance

New modelling object and relationship views reference a typeview and persist only explicit appearance overrides. Rendering resolves each field by presence: override, typeview data, typeview field, application fallback. Empty strings, zero and false are values, not absence. An explicit choice equal to the current default remains pinned when that default changes.

This increment covers colors, stroke width, text/arrow scales, icons/images and relationship dash/arrow styling. Templates, figures/geometry, location, size, scale, member scale, grouping, endpoints, ports, routing and manual points retain their existing view-local behavior. Future template inheritance needs separate compatibility work.

Persisted new views carry `appearanceMode: "inherit"` and `appearanceOverrides`. Runtime diagram values are materialized for rendering but do not become persisted overrides merely because a default was copied. The override map is replaced as a whole by persistence updates, including an empty map when resetting.

Legacy files without the marker keep their effective appearance as a snapshot. Legacy empty fields continue to mean fallback to the loaded typeview. Resaving adds `appearanceMode: "snapshot"` alongside the flat appearance fields so empty snapshot values retain their meaning on another reload. No automatic bulk migration is performed. Explicit appearance edits retain the snapshot fields as overrides; the existing Reset to Typeview action deliberately opts a view into inheritance and preserves geometry/topology.

Acceptance: a new view responds to type appearance changes unless overridden; overrides (including equal and empty values) survive save/reload; existing appearance survives type edits; reset returns to inheritance; model geometry and relationship endpoints/ports/points survive all these operations. Verify both object and relationship diagrams visually.

Object-view inspector edits must update the rendered GoJS node without requiring Reload. Update the model before cached node data so bindings and template replacement receive change notifications; keep runtime mirrors synchronized for subsequent persistence.

Successive object-view appearance edits and Reset to Typeview must remain visible through React updates and dialog completion without Reload. Synchronize the child diagram's render state when incoming appearance changes have no structural changes, while preserving live geometry.
# Relationship appearance edits preserve path settings

Closing Edit Relationship View applies only explicitly touched fields. A text-size, color or stroke edit must preserve routing, curve, attachment ports and saved path points, including when untouched dialog values differ from the effective relationship-view values. Clear points for a routing/curve change only when that field was explicitly edited.

Synchronize edited effective values to both the rendered link and its runtime GoJS mirror. Repeated node moves and queued relationship saves must retain the chosen text size rather than restoring the mirror's pre-edit value.

Queued geometry persistence must retain the rendered relationship's current appearance overrides and use live link data when rebuilding React state. An older Metis snapshot must not replace an inspector edit during the second or subsequent move.

Diagram events resolve the current Metis and its GoJS mirror through the owning diagram. Self-loop movement saves individual relationship-view geometry; it must not dispatch a redundant full-universe snapshot that can overwrite newer appearance edits.

## Collapsed container images

Collapsed container images must remain inside the inner frame, including its stroke. An opaque image must not cover the top border when closing a container. Opening the container hides the image and retains the existing frame size.
