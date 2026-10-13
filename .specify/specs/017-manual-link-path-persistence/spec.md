# Preserve manually edited relationship paths after Reload

When a user reshapes a relationship link, saves and reloads the model, moving either connected object must preserve the link's user-authored bends. Endpoint segments may adjust to stay connected. Moving both endpoints together should translate the route according to the existing drag behavior.

Persist the existing `__manualPath` intent marker with relationship-view points. Restore it in both relationship-view import paths and propagate it into GoJS link data, so drag handling continues to recognize the saved path after Reload. Appearance inheritance and resets do not change this geometry.

Compatibility: older files without the marker treat saved point arrays with more than two points as manually shaped, matching the existing saved-path materialization policy. Explicit `false` keeps automatic routing behavior; empty or two-point legacy paths do not acquire a manual marker.

Acceptance: reshape a link, save/reload, move a connected object, and reload again. Interior bends survive and the endpoint remains connected. Automatic links retain existing rerouting behavior.

Drop completion must reanchor endpoints using the moved port's current document center, never a saved endpoint as the port reference. Straight links retain two points and stay connected after releasing the mouse. Preserve interior bends in Normal routes; align adjacent bends only for multi-segment orthogonal routes.
