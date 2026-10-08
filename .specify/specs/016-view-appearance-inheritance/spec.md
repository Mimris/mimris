# View appearance inheritance

New modelling object and relationship views reference a typeview and persist only explicit appearance overrides. Rendering resolves each field by presence: override, typeview data, typeview field, application fallback. Empty strings, zero and false are values, not absence. An explicit choice equal to the current default remains pinned when that default changes.

This increment covers colors, stroke width, text/arrow scales, icons/images and relationship dash/arrow styling. Templates, figures/geometry, location, size, scale, member scale, grouping, endpoints, ports, routing and manual points retain their existing view-local behavior. Future template inheritance needs separate compatibility work.

Persisted new views carry `appearanceMode: "inherit"` and `appearanceOverrides`. Runtime diagram values are materialized for rendering but do not become persisted overrides merely because a default was copied. The override map is replaced as a whole by persistence updates, including an empty map when resetting.

Legacy files without the marker keep their effective appearance as a snapshot. Legacy empty fields continue to mean fallback to the loaded typeview. Resaving adds `appearanceMode: "snapshot"` alongside the flat appearance fields so empty snapshot values retain their meaning on another reload. No automatic bulk migration is performed. Explicit appearance edits retain the snapshot fields as overrides; the existing Reset to Typeview action deliberately opts a view into inheritance and preserves geometry/topology.

Acceptance: a new view responds to type appearance changes unless overridden; overrides (including equal and empty values) survive save/reload; existing appearance survives type edits; reset returns to inheritance; model geometry and relationship endpoints/ports/points survive all these operations. Verify both object and relationship diagrams visually.
