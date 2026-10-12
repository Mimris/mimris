# Plan

Introduce one field allowlist and appearance resolver shared by kernel views, import/export and GoJS materialization. Keep effective-value accessors at the kernel boundary so existing editing and creation code can operate incrementally. Store explicit user choices separately from automatically copied defaults. Preserve legacy snapshots on import, reuse existing appearance reset actions, and replace the complete override map in Redux. Verify production import/export, editor persistence, reset and diagram rendering with tests and a browser check.
