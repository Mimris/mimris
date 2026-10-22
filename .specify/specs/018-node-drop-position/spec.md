# Preserve the latest dropped node position

After Reload, moving an object node must leave it at the dropped position through delayed React/Redux reconciliation. A second move before the previous drag protection expires must also succeed. The latest location must survive another Reload.

Live node geometry takes precedence over a position lock from an earlier move. Position locks remain a fallback for temporarily missing Parts. The location-write guard accepts a two-way binding value matching the live Part's current location and refreshes existing locks; stale incoming positions remain blocked. Refresh local locks on every drop instead of skipping nodes with existing locks.

Explicit layout revisions retain their existing precedence. Persisted object/model formats and relationship routing are unchanged.

An ordinary object dragged outside a generic container must detach on the first drop. Clear live GoJS membership and runtime/modelview group references before resolving the drop target, so closing or moving the former parent immediately afterward cannot hide or move the object. Objects still inside their parent and existing Pool/Lane drag constraints retain their membership rules.

Moving a container refreshes the derived scale of all existing members, including nested members, using the product of ancestor member scales. Persist those scales and synchronize rendered nodes and runtime mirrors. Repeated moves must not compound the scale: a member scale of 0.8 continues to produce 0.8-sized direct children.
