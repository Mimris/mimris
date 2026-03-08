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

Nested group scaling is relative to the direct parent.

- Dropping a normal object into a group scales it from the parent's inherited member scale.
- Dropping a group into a group scales it from the direct parent group's visible scale.
- Nested group scaling compounds by level. If the nested-group multiplier is `0.45`, then a child group is `parent * 0.45`, and a grandchild is `child * 0.45`.
- Palette drops, drag/drop into groups, and structural `Shift` regrouping should follow the same direct-parent scaling rule.


### Development activities

### Test

### Deployment

### Maintenance 

### Marketing
