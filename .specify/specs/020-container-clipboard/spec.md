# Preserve container contents on paste

Copying and pasting a container with its contents must create visible child nodes and links under the new container. Use GoJS key APIs so runtime indexes, link endpoints and group memberships follow the new IDs. Remap children by source view identity after all pasted nodes exist, never by display name. Preserve original views and top-level membership, and materialize copied node templates and appearance before rendering/persistence.

Pasted relationships must connect the corresponding copied views and remain in the persisted model. Accept both array and GoJS point-list geometry. Existing saved model formats remain compatible.

Pasting members into an existing container applies the destination's derived member scale to the rendered GoJS Parts, runtime mirrors and persisted objectviews. A container with memberscale 0.8 produces pasted members at 0.8, not 1.0. Register pasted relationships with both endpoint views so label scaling follows the rendered endpoints.
