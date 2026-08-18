# AKM Modeller

    From ChatGPT:
    The Active Knowledge Modelling (AKM) methodology is the foundation for a more agile approach to solutions based on adaptive design methods and evolutionary IT infrastructures. Using AKM methods project workers and service providers can adapt, extend, and reconfigure solutions and services for innovative cyclic design and sustainable life-cycle support and knowledge reuse and management. 

    The AKM methodology is based on adaptive design methods and evolutionary IT infrastructures. The AKM models are new solution components extending traditional ICT systems to involve practitioners and pragmatic enterprise knowledge models and workspaces.

    The AKM approach has been applied by manufacturing industries and consultants to implement pragmatic and powerful design platforms

## Scope and Requirements

### Target audience

The target audience in the short term is Enterprise Architects and Knowledge workers that want to develop a up-to-date, flexible and functional Architecture model, defining necessary Information, Roles, Tasks and Views for a certain Domain.

the target audience, in the longer term, is Knowledge workers and Users who want to adust and update and enhance their current Apps and Systems on a continuous basis, integrating the metamodelling, solution modelling and execution in a cyclic change and updating.
 
### Features and functionality

Main features is to help users to develop Knowledge Models, with reflective Metamodels and Models, from Scaffolding models, via Type definition Models, generated Metamodels that can be used to develop Solutions Models and then generate/configure Solutions.

    - Modelling canvas/area
    - Metamodel palette 
    - Object palette
    - Generated Metamodel palette
    - Context/Focus area
    - Symbol editor and image includes (not implemented properly)
    - Interface with GitHub API's for import/export of models
    - Interface with GitHub Project for planning and execution of Modelling projects.
    - 
 
### Platforms

    Libraries 
    - Next js
    - React
    - Redux
    - 
    - 

    Deployments
    - Vercel
    - Heroku


### User Interface

The User interface is mainly a single-page web-app where the user/modeller can build models.

    Main menu
    - Home
    - Project
    - Modelling
    - Focus
    - Help
    - About

### Diagram Grouping Semantics

The modelling canvas supports both visual movement and structural regrouping.

- Plain drag is visual only. It moves the selected part but does not change `group` membership or direct `AKM_CONTAINS` structure.
- `Shift` + drag is structural. Dropping into another group changes the direct parent, updates `group`, and reassigns the direct `AKM_CONTAINS` relationship to the new parent.
- `Shift` + drag to background detaches the part from its parent. The part becomes top-level with `group = ""`, and the direct parent `AKM_CONTAINS` relationship is removed.
- Structural regrouping must never create cycles. A group may not become a child of itself, one of its descendants, or a target that would introduce circular `AKM_CONTAINS`.

Grouping scale is derived from containment only.

- Any top-level object or group has visual `scale = 1`.
- Any object or group inside groups has visual scale equal to the product of all ancestor `memberScale` values.
- Dragging an object or group back to the background resets its visual scale to `1`.
- Palette drops, drag/drop into groups, paste into groups, and structural `Shift` regrouping should all follow the same compounded-ancestor `memberScale` rule.
- Group `size` and group `scale` are separate concerns. Nesting may change a group's size/layout, but visual scale is still derived only from ancestor `memberScale`.
- Relationship labels should scale with the connected objects so link text stays visually proportional after regrouping.

### Diagram Handles And Header Controls

- Process groups and container groups use the same 8 resize handles.
- Resize handles should stay approximately constant on screen while zooming. Their visual size should not balloon with diagram zoom.
- Expand/collapse buttons use a fixed visual size.
- Group header controls must remain fully visible and not clip at normal zoom levels.

### Swimlane Layout

- Pool width is the source of truth for swimlane layout.
- Lane width must always adapt to the current pool width; lane width must never expand the pool.
- A pool may contain lanes and child pools.
- A child pool inside a parent pool must behave like a structural row in the parent pool layout.
- A nested child pool must adapt to the parent pool row width; nested pools must not preserve an older independent width against the parent pool layout.
- Lane `data.size` / persisted `objectview.size` stores the lane body size, not the full lane width including the header strip.
- The visible lane main width is derived from the pool's available inner width, and the lane body width is derived from that main width minus the lane header width.
- Manual pool resize must persist across reload.
- After a manual pool resize, later lane moves or lane relayouts must preserve the pool width and refit the lanes to the pool.
- Dragging a nested pool must trigger relayout of its parent pool, the same way dragging a lane does.
- Pool and lane expander buttons live in the top-right of their rotated header strips.
- Pool and lane header object icons live at the bottom of the rotated header strip and should not overlap the rotated header text.
- Pool and lane content images are only shown in the collapsed state.
- Pool right and bottom borders must remain visible; lane content should leave a small inset from those borders.

### Palette Persistence

- The left-side `Palette: Obj. Types` collapse/expand state should persist across reloads.
- The palette width mode (`expanded` vs normal width) should persist across reloads.
- The palette component must stay mounted when the global `Toggle Palettes` control collapses it, so its own collapsed rail remains visible.
- The modeller object palette collapse/expand state should persist across reloads as well.
- The collapsed `Palette: Obj. Types` rail should use a single visible bar with no duplicated top arrow inside the label text.
- The collapsed `Palette: Obj. Types` rail should match the Objects rail sizing, including icon scale, rail width, and vertical label font treatment.
- The `Palette: Obj. Types` wrapper must not add an extra outer gutter or padding strip in either collapsed or expanded state.

### ICOM Rendering

- The default ICOM style is `idef`.
- The default relationship routing for IDEF0 ICOM usage is `Orthogonal`.
- ICOM rendering is defined by `icomStyle` on the typeview, with support for metamodel-driven notation choices.
- Side ICOMs use a neutral marker close to the process border, with the relationship direction shown by the relationship arrow rather than the ICOM graphic.
- For left/right ICOMs, the relationship should hook near the process-side end of the ICOM line, while the label remains outside the routing gap.
- Output labels should sit further to the right so they stay between routed orthogonal segments when possible.
- Side ICOM labels may wrap to two lines maximum and should use ellipsis if more text would be needed.
- The whole colored side ICOM band should resolve to the port for context menus, but relationship hookup should still use the dedicated hookup area.
- For top/bottom ICOMs, the whole ICOM should render outside the group border, with the ICOM strip hugging the border.
- Control text is placed above the top strip and mechanism text below the bottom strip.
- Control and mechanism labels may wrap to two lines and should use compact horizontal spacing between neighboring labels.
- Single-line control/mechanism labels should align to the bottom of their two-line text box.
- The top control strip and bottom mechanism strip should be tuned independently so each can sit flush with its group border.
- For top/bottom ICOMs, the relationship arrow should sit as close to the group border and ICOM line as possible, even if it overlaps the line.
- ICOM text backgrounds should remain transparent, while the text itself may use slight opacity to soften overlap with relationship routing.


### Development activities

### Test

### Deployment

### Maintenance 

### Marketing
