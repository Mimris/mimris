# Object and relationship view appearance

New instance views share appearance with their referenced typeview. Saved views contain `appearanceMode: "inherit"`, `typeviewRef` and an `appearanceOverrides` map. An empty map means every supported appearance field follows the typeview. Overrides use property presence, so an empty arrow name, zero or false is an explicit value. A user choice equal to the current default remains pinned.

`src/akmm/viewAppearance.ts` defines the supported fields, resolution, editing, reset and serialization. Kernel accessors expose effective values to existing callers; GoJS also resolves appearance when materializing diagram data. Automatically copying the current default back to a view does not create an override. Explicit editors must call `setAppearanceOverride` to record user intent, including choices equal to the default.

Colors, line width, text/arrow scales, icons/images and relationship dash/arrow styling inherit. Templates, figures, geometry, location, size, scale, member scale, grouping, endpoints, ports, routing and manual paths retain their existing behavior. They are outside the appearance map. Reset to Typeview clears supported appearance overrides and leaves geometry and topology intact.

Legacy views without an appearance marker import as snapshots of their effective appearance. Legacy empty strings retain their historical fallback meaning. Saving these views writes `appearanceMode: "snapshot"` with flat appearance fields, which distinguishes a saved empty snapshot value from a legacy empty placeholder. Type edits do not change the snapshot. Editing an appearance field switches to an override map while retaining the other snapshot values as overrides. Reset to Typeview explicitly adopts inheritance. There is no automatic bulk migration.

Redux updates replace the complete override map rather than merging its individual fields, so `{}` reliably clears previous overrides. Flat appearance copies are removed from inherited persisted views. Instance data, names and layout continue to use the existing persistence paths.
