# phData JSON file specification






## Changes

The ...Ref key value should be changed 

<details><summary>from: ( ...Ref: "xxxxx" )</summary>

```json
{
    ".....Ref": "00e311ea-b26e-41d2-ff16-2b48dda97282",
}
```

</details>

<details><summary>to: ( ...Ref: [ "xxxx", "url" ] )</summary>

```json
{
    "....Ref": [ 
        "00e311ea-b26e-41d2-ff16-2b48dda97282",
        "https://github.com/.../modelfile.json"
    ]
}
```

</details>

This can be seen as tuples, wich is in the spec also for the next versjon of javascript

---

## Adding a universal array for all objects, models etc. with a uid

We suggest to implement a global array for all types of objects, relship, typeviews, models, metamodels etc.
The array is based on the fact that all this items has a uniq id UID.

The key is here the uid.
This can be a huge array, but if we sort it we can use binary seach to find items, which is very fast search.

<details><summary>Global item array</summary>

```json
[
    "05d5b929-b985-49ac-cf92-cc095a03889z": [
        "model":  {         // or 
        { "type": "model",  //
          "id": "05d5b929-b985-49ac-cf92-cc095a03889z",
          "name": "INIT_CM",
          "description": "",
          "metamodelRef": "82e6ec62-e66e-4dc7-9780-32f4b1aa69b3",
          ...
          "objects": [
            "4eac3862-158f-428a-5452-dac3460a58da"
          ],
          "relships": [...],
          "modelviews": [
            "1237125b-2f1c-46d3-eb4e-520614917262"
          ],
          "markedAsDeleted": false,
          "modified": false
        },
        "url": "https://github.com/.../modelfile.json"
    ],
    "4eac3862-158f-428a-5452-dac3460a58da" : [
        {
          "type": "object",
          "id": "4eac3862-158f-428a-5452-dac3460a58da",
          "name": "EntityType",
          "description": "",
          "abstract": false,
          "viewkind": "",
          "typeRef": "31a18ce8-66cf-4b95-79e4-673746867ac3",
          "typeName": "EntityType",
          "typeDescription": "",
          "propertyValues": [],
          "markedAsDeleted": false,
          "generatedTypeId": "",
          "modified": false,
          "nameId": "EntityType",
          "category": "Object",
          "sourceUri": "",
          "relshipkind": "Association",
          "valueset": null,
          "copiedFromId": ""
        },
        "url": "https://github.com/...../modelfile.json" //?object=\"4eac3862-158f-428a-5452-dac3460a58da\""
]
```

</details>

---

## model and metamodel arrays

These array should be changed from :

<details><summary>From current. an object in objects array </summary>

```json
        "objects": [
            {
            "id": "4eac3862-158f-428a-5452-dac3460a58da",
            "name": "EntityType",
            "description": "",
            "abstract": false,
            "viewkind": "",
             "typeRef": "31a18ce8-66cf-4b95-79e4-673746867ac3",
            "typeName": "EntityType",
            "typeDescription": "",
            "propertyValues": [],
            "markedAsDeleted": false,
            "generatedTypeId": "",
            "modified": false,
            "nameId": "EntityType",
            "category": "Object",
            "sourceUri": "",
            "relshipkind": "Association",
            "valueset": null,
            "copiedFromId": ""
            }
        ],
```

</details>

<details><summary>to: objectid in the objects array </summary>

```json
            "objects": [
               "4eac3862-158f-428a-5452-dac3460a58da",
            ],
```

</details>

---

## Examples:

phData is the name of the top object in redux store and which is saved to files. It contains the metis object (topobject with models and metamodels.) 
It stands for "placeholder Data" (should maybe changed to )
<details><summary>phData</summary>

```JSON

{
  "phData": {
    "metis": {
      "id": "05d5b929-b985-49ac-cf92-cc095a030349345a", 
      "name": "AKM-INIT-Startup",
      "description": "New startup project",
        "metamodels": [
            {......}
        ],
      "models": [
        "05d5b929-b985-49ac-cf92-cc095a03889z",   
        "05d5b929-b985-49ac-cf92-cc095a03889f",   
        "05d5b929-b985-49ac-cf92-cc095a03889s",   
        "05d5b929-b985-49ac-cf92-cc095a03889j"   
      ],
      "currentMetamodelRef": ["82e6ec62-e66e-4dc7-9780-32f4b1aa69b3","https://github.com/Kavca/kavca-akm-models/blob/main/models/PROD-STRUCT.json" ],
      "currentModelRef": "05d5b929-b985-49ac-cf92-cc095a03889z",
      "currentModelviewRef": "1237125b-2f1c-46d3-eb4e-520614917262",
      "currentTemplateModelRef": "",
      "currentTargetMetamodelRef": "",
      "currentTargetModelRef": "",
      "currentTargetModelviewRef": "",
      "currentTaskModelRef": ""
    },
    "items": [
      "05d5b929-b985-49ac-cf92-cc095a03889z": [
        "model":  {
          "id": "05d5b929-b985-49ac-cf92-cc095a03889z",
          "name": "INIT_CM",
          "description": "",
          "metamodelRef": ["82e6ec62-e66e-4dc7-9780-32f4b1aa69b3","https://github.com/Kavca/kavca-akm-models/blob/main/models/PROD-STRUCT.json"],
          "sourceMetamodelRef": "82e6ec62-e66e-4dc7-9780-32f4b1aa69b3",
          "targetMetamodelRef": "1a14aeb1-57ba-491c-45e5-66c13a3ec4bd",
          "sourceModelRef": "82e6ec62-e66e-4dc7-9780-32f4b1aa69b3",
          "targetModelRef": "",
          "isTemplate": false,
          "includeSystemtypes": true,
          "templates": [],
          "objects": [
            "4eac3862-158f-428a-5452-dac3460a58da"
          ],
          "relships": [],
          "modelviews": [
            "1237125b-2f1c-46d3-eb4e-520614917262"
          ],
          "markedAsDeleted": false,
          "modified": false
        },
        "url": "https://github.com/Kavca/kavca-akm-models/blob/main/models/PROD-STRUCT.json"
      ],
      "1237125b-2f1c-46d3-eb4e-520614917262": [
        "type": "modelview",
        {
          "id": "1237125b-2f1c-46d3-eb4e-520614917262",
          "name": "Main",
          "description": "",
          "layout": "Tree",
          "routing": "Normal",
          "linkcurve": "None",
          "showCardinality": false,
          "UseUMLrelshipkinds": false,
          "modelRef": "05d5b929-b985-49ac-cf92-cc095a03889z",
          "viewstyleRef": "d4974fe5-4e2f-4977-d2d2-deee46c57dff",
          "objectviews": [],
          "relshipviews": [],
          "objecttypeviews": [],
          "relshiptypeviews": [],
          "markedAsDeleted": false,
          "modified": false
        },
        "url": "https://github.com/Kavca/kavca-akm-models/blob/main/models/PROD-STRUCT.json"
      ],
      "4eac3862-158f-428a-5452-dac3460a58da" : [
        "type": "object",
        {
          "id": "4eac3862-158f-428a-5452-dac3460a58da",
          "name": "EntityType",
          "description": "",
          "abstract": false,
          "viewkind": "",
          "typeRef": "31a18ce8-66cf-4b95-79e4-673746867ac3",
          "typeName": "EntityType",
          "typeDescription": "",
          "propertyValues": [],
          "markedAsDeleted": false,
          "generatedTypeId": "",
          "modified": false,
          "nameId": "EntityType",
          "category": "Object",
          "sourceUri": "",
          "relshipkind": "Association",
          "valueset": null,
          "copiedFromId": ""
        },
        "url": "https://github.com/Kavca/kavca-akm-models/blob/main/models/PROD-STRUCT.json?object=\"4eac3862-158f-428a-5452-dac3460a58da\""
      ],
      "d4974fe5-4e2f-4977-d2d2-deee46c57dff": [
        "viewstyle": {
          "id": "d4974fe5-4e2f-4977-d2d2-deee46c57dff",
          "name": "Basic Modeling Metamodel_Viewstyle",
          "description": "",
          "markedAsDeleted": false,
          "modified": false
        },
        "url": "https://github.com/Kavca/kavca-akm-models/blob/main/models/PROD-STRUCT.json"
      ]
    ]
  },
  "phFocus": {
    "focusTab": "Modelling",
    "focusTemplateModel": null,
    "focusTemplateModelview": null,
    "focusTargetModel": null,
    "focusTargetModelview": null,
    "focusModel": {
      "id": "05d5b929-b985-49ac-cf92-cc095a03889z",
      "name": "INIT_CM"
    },
    "focusModelview": {
      "id": "1237125b-2f1c-46d3-eb4e-520614917262",
      "name": "Main"
    },
    "focusObject": {
      "id": "8a2f98d3-ecde-4bf3-ec29-6495a9566e10",
      "name": "Property 1"
    },
    "focusObjectview": {
      "id": "a116efff-90c2-4e51-3efb-06060b73c29f",
      "name": ""
    },
    "focusRelship": {
      "id": null,
      "name": ""
    },
    "focusRelshipview": {
      "id": "b4a09952-ab9a-46fd-394a-3f87be37e34f",
      "name": "has"
    },
    "focusObjecttype": {
      "id": "6382b0c9-4d4d-41a8-da86-1f7f39de2f7c",
      "name": "View"
    },
    "focusRelshiptype": {
      "id": "9c2f4dd9-297a-4221-c694-76a7c18ab04d",
      "name": "relationshipType"
    },
    "focusObjecttypeview": {
      "id": null,
      "name": ""
    },
    "focusObjecttypegeos": {
      "id": null,
      "name": ""
    },
    "focusOrg": {
      "id": null,
      "name": ""
    },
    "focusProj": {
      "id": null,
      "name": ""
    },
    "focusSource": {
      "id": null,
      "name": ""
    },
    "focusRefresh": {
      "id": "kb842x",
      "name": "1name"
    },
    "focusRole": {
      "id": "Modeller1",
      "name": "Modeller 1",
      "tasks": [
        {
          "id": "task00",
          "name": "All types",
          "description": "All types modelling",
          "workOnTypes": [
            "Container",
            "EntityType",
            "Information",
            "Role",
            "Task",
            "View",
            false,
            "Datatype",
            "Element",
            false,
            "FieldType",
            "Generic",
            "InputPattern",
            "Label",
            "Method",
            "MethodType",
            "Property",
            "RelshipType",
            "Unittype",
            "Value",
            "ViewFormat"
          ]
        },
        {
          "id": "Task0",
          "name": "Modelling",
          "workOnTypes": [
            "Container",
            "EntityType",
            "Information",
            "Role",
            "Task",
            "View"
          ]
        },
        {
          "id": "task1",
          "name": "Entity Modelling",
          "description": "Create New Entity using objecttype: EntityType",
          "workOnTypes": [
            "Container",
            "EntityType",
            "Property",
            "Datatype",
            "Value",
            "Method",
            "ViewFormat",
            "InputPattern",
            "FieldType",
            "Unittype"
          ]
        },
        {
          "id": "task2",
          "name": "Property Modelling",
          "description": "Add property to EtityType definitions",
          "workOnTypes": [
            "Container",
            "EntityType",
            "Property",
            "Datatype"
          ]
        },
        {
          "id": "task3",
          "name": "Task Modelling",
          "description": "Add property to EtityType definitions",
          "workOnTypes": [
            "Container",
            "EntityType",
            "Information",
            "Role",
            "Task",
            "View"
          ]
        }
      ]
    },
    "focusTask": {
      "id": "Task4",
      "name": "Modelling",
      "description": "Modelling",
      "workOnTypes": [
        "Container",
        "EntityType",
        "Information",
        "Role",
        "Task",
        "View",
        "Label",
        "Property",
        "Generic",
        "Label",
        "Element",
        "Process",
        "Function",
        "Activity",
        "Start",
        "End",
        "ExclusiveGate",
        "InclusiveGate",
        "ParallelGate",
        "Datatype",
        "InputPattern",
        "FieldType",
        "Unittype",
        "Value",
        "ViewFormat",
        "Method",
        "MethodType",
        "RelshipType"
      ]
    }
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
  "phSource": "GitHub: kavca-akm-models/startmodels/AKM-INIT-Startup.json",
  "lastUpdate": "2022-11-03T12:56:58.793Z"
}

```


```json
      "metamodels": [
        {
          "id": "82e6ec62-e66e-4dc7-9780-32f4b1aa69b3",
          "name": "BASIC_META",
          "description": "",
          "metamodelRefs": [],
          "viewstyles": [
            "d4974fe5-4e2f-4977-d2d2-deee46c57dff"
          ],
          "geometries": [],
          "objecttypes": [
            {
              "id": "5f1fa0f1-d89f-4a62-5b93-3a433acb833e",
              "name": "Container",
              "description": "",
              "abstract": false,
              "viewkind": "Container",
              "typename": "Object type",
              "typeviewRef": "a3112875-e4fe-4100-b290-5634d8b8acfc",
              "properties": [],
              "attributes": [],
              "methods": [],
              "markedAsDeleted": false,
              "modified": true
            }
          ],
          "relshiptypes": [
            {
              "id": "5718b4c7-3aa1-4ee3-0a9d-5e7cdcd18a24",
              "name": "Is",
              "description": "",
              "typeviewRef": "27eb5fd1-c46e-4edd-79fa-cf61f0ccc1f2",
              "properties": [],
              "relshipkind": "Generalization",
              "viewkind": "",
              "fromobjtypeRef": "31a18ce8-66cf-4b95-79e4-673746867ac3",
              "toobjtypeRef": "c0de4b48-0220-424a-dd07-e620e27bd3c8",
              "cardinality": "",
              "cardinalityFrom": "",
              "cardinalityTo": "",
              "nameFrom": "",
              "nameTo": "",
              "markedAsDeleted": false,
              "modified": true
            }
          ],
          "objecttypes0": [],
          "relshiptypes0": [],
          "properties": [
            {
              "id": "d836ad9a-00f6-4cf2-2986-9ca1b4e71498",
              "name": "methodtype",
              "description": "",
              "datatypeRef": "160e8cac-4003-4b00-175f-2b720ba088e0",
              "methodRef": "",
              "unitCategoryRef": "",
              "defaultValue": "",
              "inputPattern": "",
              "viewFormat": "",
              "example": "",
              "markedAsDeleted": false,
              "modified": false
            }
          ],
          "methods": [
            {
              "id": "3001c6b7-2359-4720-abdd-28bdcfa8086c",
              "name": "",
              "description": "",
              "methodtype": "CalculateValue",
              "expression": "",
              "markedAsDeleted": false,
              "modified": false
            }
          ],
          "methodtypes": [
            {
              "id": "3625c808-3d5c-498a-87cb-5a245a7a9dea",
              "name": "AggregateValue",
              "description": "",
              "properties": [
                {
                  "id": "010fb767-99d2-4f25-0340-34150e459116",
                  "name": "reltype",
                  "nameId": "reltype",
                  "category": "Property",
                  "description": "",
                  "markedAsDeleted": false,
                  "modified": false,
                  "datatype": {
                    "id": "160e8cac-4003-4b00-175f-2b720ba088e0",
                    "name": "string",
                    "nameId": "string",
                    "category": "Datatype",
                    "description": "String",
                    "markedAsDeleted": false,
                    "modified": false,
                    "isOfDatatype": null,
                    "allowedValues": "",
                    "defaultValue": null,
                    "value": "",
                    "inputPattern": "",
                    "viewFormat": "%s",
                    "fieldType": "text",
                    "datatypeRef": ""
                  },
                  "datatypeRef": "",
                  "method": null,
                  "methodRef": "",
                  "unitCategory": null,
                  "unitCategoryRef": "",
                  "defaultValue": "",
                  "inputPattern": "",
                  "viewFormat": "",
                  "example": ""
                }
              ],
              "markedAsDeleted": false,
              "modified": false
            }
          ],
          "datatypes": [
            {
              "id": "abc274e1-f4e9-4d9c-7f98-b0ffe26499c9",
              "name": "cardinality",
              "description": "",
              "datatypeRef": "",
              "allowedValues": [
                "0-1",
                "1",
                "0-n",
                "1-n",
                "n"
              ],
              "defaultValue": "",
              "value": "",
              "inputPattern": "",
              "viewFormat": "%s",
              "fieldType": "select",
              "markedAsDeleted": false,
              "modified": false
            }
          ],
          "units": [],
          "objecttypeviews": [
            {
              "id": "6aad4796-8648-4c1b-b31e-7501afdcb19d",
              "name": "6aad4796-8648-4c1b-b31e-7501afdcb19d",
              "description": "",
              "typeRef": "c0de4b48-0220-424a-dd07-e620e27bd3c8",
              "viewkind": "Object",
              "template": "textAndIcon",
              "figure": "",
              "geometry": "",
              "fillcolor": "lightgray",
              "strokecolor": "black",
              "strokecolor1": "black",
              "strokecolor2": "black",
              "strokewidth": 1.0,
              "textcolor": "black",
              "textscale": 1.0,
              "memberscale": 1.0,
              "icon": "",
              "markedAsDeleted": false,
              "modified": false
            }
          ],
          "objtypegeos": [
            {
              "id": "69ebad20-7a18-4b1c-e712-acc506ae9845",
              "name": "",
              "description": "",
              "typeRef": "",
              "metamodelRef": "",
              "loc": "",
              "size": "",
              "markedAsDeleted": false,
              "modified": false
            }
          ],
          "relshiptypeviews": [
            {
              "id": "8503a5ef-2f0f-49eb-1ac4-610871cb1508",
              "name": "8503a5ef-2f0f-49eb-1ac4-610871cb1508",
              "description": "",
              "typeRef": "a4fea123-cea6-4529-2c31-a38dab476e04",
              "template": "AnnotationLink",
              "strokecolor": "lightgrey",
              "strokewidth": 1,
              "textcolor": "lightgrey",
              "textscale": 1.0,
              "dash": "Dashed",
              "fromArrow": "",
              "toArrow": "OpenTriangle",
              "fromArrowColor": "",
              "toArrowColor": "white",
              "markedAsDeleted": false,
              "modified": false
            }
          ],
          "generatedFromModelRef": "00e311ea-b26e-41d2-ff16-2b48dda97282",
          "routing": "Normal",
          "markedAsDeleted": false,
          "modified": false
        }
      ]
        
```