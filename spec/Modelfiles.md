
# AKMM Specifications

# Modelfiles

Naming conventions

- Project-name_PR.json
- Model-name_MO.json
- Metamodel-name_MM.json
- Modelview-name_MV.json
- Object-name_OB.json
- Relationship-name_RE.json
- Workspace-name_WS.json
- Workplace-name_WP.json

ex. 
MyProject_PR.json, MyMetamodel_MM.json, MyModelview_MV.json, MyObject_OB.json, MyRelationship_RE.json, MyWorkspace_WS.json, MyWorkplace_WP.json



## Project_PR.json

```JSON
{
    "phProject": {
        "remoteUrl": "https://github.com/Kavca/kavca-akm-models/blob/main/metaprojects/Project_PR.json",
        "README": "READE.md", 
        "modelFiles": [
            "https://github.com/Kavca/kavca-akm-models/blob/main/metaprojects/AAAAA_MO.json",
            "https://github.com/Kavca/kavca-akm-models/blob/main/metaprojects/BBBBB_MO.json"
        ], 
        "metamodelFiles": [
            "https://github.com/Kavca/kavca-akm-models/blob/main/metaprojects/CCCCC_MM.json"
        ],
        "modelviewFiles": [

        ],
        "objectFiles": [

        ],
        "relshipFiles": [

        ],
        "typeviewFiles": [

        ],
        "README": "READE.md"
    },
    "phData": {
      "metis": {
        "name": "",
        "description": "",
        "metamodels": [   ],
        "models": [ ],
        "currentMetamodelRef": "",
        "currentModelRef": "",
        "currentModelviewRef": "",
        "currentTemplateModelRef": "",
        "currentTargetMetamodelRef": "",
        "currentTargetModelRef": "",
        "currentTargetModelviewRef": "",
        "currentTaskModelRef": ""
      }
    },
    "phFocus": {
      "focusTab": "",
      "focusTemplateModel": null,
      "focusTemplateModelview": null,
      "focusTargetModel": null,
      "focusTargetModelview": null,
      "focusModel": {},
      "focusModelview": {},
      "focusObject": { },
      "focusObjectview": { },
      "focusRelship": { },
      "focusRelshipview": { },
      "focusObjecttype": { },
      "focusRelshiptype": { },
      "focusObjecttypeview": { },
      "focusObjecttypegeos": {},
      "focusOrg": {},
      "focusProj": {},
      "focusRole": {},
      "focusCollection": null,
      "focusTask": {},
      "focusSource": { },
      "focusRefresh": { },
      "focusTargetMetamodel": {}
    },
    "phUser": {
      "focusUser": {
        "id": "email",
        "name": "Not logged in",
        "email": "",
        "session": null,
        "diagram": {
          "showDeleted": false,
          "zoomToFocus": false
        }
      }
    },
    "phSource": ".json",
    "lastUpdate": "2022-10-21T12:33:34.624Z"
  }
```