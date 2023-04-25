

'use strict';

// Define View kinds

export let params = {
     MEMBERSCALE:   "1",
}

export let viewkinds = {
	OBJ:    "Object",
	AKM:    "AkmObject",
	CONT:   "Container",
	TREE:   "Tree",
	IMAGE:  "Image",
	REL:    "Relationship",
     POOL:   "Pool",
     LANE:   "Lane",
};

// Define Relationship kinds

export let relkinds = {
          REL       : "Association",
          GEN       : "Generalization",
          AGGR      : "Aggregation",
          COMP      : "Composition"
};

// Define GOJS constants

export let gojs = {
          C_BOTTOM              : "bottom", 
          C_CONTAINER           : "Container",
          C_DATATYPE            : "Datatype",
          C_ENUMERATION         : "Enumeration",
          C_FIELDTYPE           : "Field type",
          C_GEOMETRY            : "Geometry",
          C_INPUTPATTERN        : "Input pattern",
          C_LEFT                : "left", 
          C_LINKEMPLATE         : "linkTemplate1",
          C_METAMODEL           : "Metamodel",
          C_METACONTAINER       : "Metacontainer",
          C_METHOD              : "Method",
          C_METIS               : "Metis",
          C_MODEL               : "Model",
          C_MODELVIEW           : "Model view",
          C_NODETEMPLATE        : "textAndIcon",
          C_AKM_OBJECT          : "AKM Object",
          C_OBJECT              : "Object",
          C_OBJECTTYPE          : "Object type",
          C_OBJECTTYPEVIEW      : "Object type view",
          C_OBJECTTYPEGEO       : "Object type geo",
          C_OBJECTVIEW          : "Object view",
          C_PALETTEGROUP_OBJ    : "typeitem",
          C_PORT                : "Port",
          C_PROPERTY            : "Property",
          C_PROPVALUE           : "Property value",
          C_RELATIONSHIP        : "Relationship",
          C_RELSHIPTYPE         : "Relationship type",
          C_RELSHIPTYPEVIEW     : "Relationship type view",
          C_RELSHIPVIEW         : "Relationship view",
          C_RIGHT               : "right", 
          C_TOP                 : "top", 
          C_UNIT                : "Unit",
          C_UNITCATEGORY        : "Unit category",
          C_VALUE               : "Value",
          C_VIEWFORMAT          : "View format",
          C_VIEWSTYLE           : "Viewstyle",
// datatypes
          C_DATATYPE_STRING     : "string",
          C_DATATYPE_FLOAT      : "float",
          C_DATATYPE_NUMBER     : "number",
          C_DATATYPE_BOOLEAN    : "boolean",
          C_DATATYPE_DATE       : "date",
          C_DATATYPE_TIME       : "time",
          C_DATATYPE_DATETIME   : "datetime",
          C_DATATYPE_DURATION   : "duration",
          C_DATATYPE_EMAIL      : "email",
          C_DATATYPE_URL        : "url",
          C_DATATYPE_PHONE      : "phone",
          C_DATATYPE_FILE       : "file",
          C_DATATYPE_PASSWORD   : "password",
          C_DATATYPE_TEXT       : "text",
// patterns
          C_DATATYPE_STRING_PATTERN: "",
          C_DATATYPE_INTEGER_PATTERN: "%d",
          C_DATATYPE_FLOAT_PATTERN: "^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$",
          C_DATATYPE_NUMBER_PATTERN: "^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$",
          C_DATATYPE_BOOLEAN_PATTERN: "[0-1",
          C_DATATYPE_DATE_PATTERN: "",
          C_DATATYPE_TIME_PATTERN: "/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/",
          C_DATATYPE_DATETIME_PATTERN: "",
          C_DATATYPE_EMAIL_PATTERN: "",
          C_DATATYPE_URL_PATTERN: "",
          C_DATATYPE_PHONE_PATTERN: "",
          C_DATATYPE_FILE_PATTERN: "",
          C_DATATYPE_PASSWORD_PATTERN: "",
          C_DATATYPE_TEXT_PATTERN: "",

// view formats
          C_VIEWFORMAT_TEXT     : "%s",
          C_VIEWFORMAT_TEXTAREA : "%s",
          C_VIEWFORMAT_CHECKBOX : "checkbox",
          C_VIEWFORMAT_RADIO    : "",
          C_VIEWFORMAT_SELECT   : "select",
          C_VIEWFORMAT_DATE     : "%s",
          C_VIEWFORMAT_TIME     : "time",
          C_VIEWFORMAT_DATETIME : "datetime",
          C_VIEWFORMAT_EMAIL    : "email",
          C_VIEWFORMAT_URL      : "url",
          C_VIEWFORMAT_PHONE    : "phone",
          C_VIEWFORMAT_FILE     : "file",
          C_VIEWFORMAT_PASSWORD : "password",
          C_VIEWFORMAT_NUMBER   : "%f",
          C_VIEWFORMAT_INTEGER  : "%d",
          C_VIEWFORMAT_FLOAT    : "%f",
          C_VIEWFORMAT_BOOLEAN  : "boolean",
//
          C_PORT_COLOR:          "lightgrey",
          
};

export let types = {
     // AKM types
          AKM_COLLECTION        : "Collection",
          AKM_CONTAINER         : "Container",
          AKM_ENTITY_TYPE       : "EntityType",
          AKM_INFORMATION       : "Information",
          AKM_PORT              : "Port",
          AKM_ROLE              : "Role",
          AKM_TASK              : "Task",
          AKM_VIEW              : "View",
          AKM_PRODUCT           : "Product",
          AKM_ORGANISATION      : "Organisation",
          AKM_PROCESS           : "Process",
          AKM_SYSTEM            : "System",
          AKM_PROPERTY          : "Property",
          AKM_METHOD            : "Method",
          AKM_METHODTYPE        : "MethodType",
          AKM_DATATYPE          : "Datatype",
          AKM_VALUE             : "Value",
          AKM_INPUTPATTERN      : "InputPattern",
          AKM_VIEWFORMAT        : "ViewFormat",
          AKM_FIELDTYPE         : "FieldType",
          AKM_UNIT              : "Unit",
          AKM_LABEL             : "Label",
          AKM_GENERIC           : "Generic",
          AKM_CONTAINS          : "contains",
          AKM_ANNOTATES         : "annotates",
          AKM_HAS_COLLECTION    : "has",
          AKM_HAS_MEMBER        : "hasMember",
          AKM_HAS_PART          : "hasPart",
          AKM_HAS_PORT          : "hasPort",
          AKM_HAS_PROPERTY      : "has",
          AKM_HAS_PROPERTIES    : "hasContent",
          AKM_IS                : "Is",
          AKM_IS_OF_DATATYPE    : "isOf",
          AKM_IS_DEFAULTVALUE   : "isDefault",
          AKM_HAS_METHOD        : "has",
          AKM_HAS_ALLOWED_VALUE : "hasAllowed",
          AKM_HAS_INPUTPATTERN  : "has",
          AKM_HAS_VIEWFORMAT    : "has",
          AKM_HAS_FIELDTYPE     : "has",
          AKM_POINTS_TO         : "pointsTo",
          AKM_GENERIC_REL       : "generic",
    
     // Type properties
          OBJECTTYPE_ID            : "objecttype",
          OBJECTTYPE               : "Object type",
          OBJECTTYPE_NAME          : "Object type",
          OBJECTTYPE_DESC          : "",
          CONTAINERTYPE_NAME       : "Container type",
          RELATIONSHIPTYPE_ID      : "relationshiptype",
          RELATIONSHIPTYPE         : "Relationship type",
          RELATIONSHIPTYPE_NAME    : "My Relationship type",
          RELATIONSHIPTYPE_DESC    : "",

     // Method types
          MTD_TRAVERSE             : "Traverse",
          MTD_CALCULATEVALUE       : "CalculateValue",
          MTD_AGGREGATEVALUE       : "AggregateValue",
          MTD_GETCONNECTEDOBJECT   : "GetConnectedObject",
    
     // EKA types
          EKA_ELEMENT       : "EKA Element",
          EKA_SPACE         : "EKA Space",
          EKA_OBJECT        : "EKA Object",
          EKA_PROPERTY      : "EKA Property",
          EKA_METHOD        : "EKA Method",
          EKA_ROLE          : "EKA Role",
          EKA_ORIGIN        : "Origin",
          EKA_TARGET        : "Target",
          EKA_RELATIONSHIP  : "Relationship",
          EKA_MEMBER        : "Member",
          EKA_PART          : "Part",
          EKA_DEPENDS_ON    : "Depends on",
          EKA_IS            : "Is",
          EKA_IS_A          : "Is a",
     // EKA system types
          _EKA_IS           : "_is",
          _EKA_MEMBER       : "_member",
          _EKA_PART         : "_part",

};

export let props = {
          DRAFT               : "proposedType"
}
  
// Define Firestore constants

export const fs = {
          FS_C_CATEGORIES       : "categories",
          FS_C_DATATYPES        : "datatypes",
          FS_C_ENUMERATIONS     : "enumerations",
          FS_C_METAMODELS       : "metamodels",
          FS_C_MODELS           : "models",
          FS_C_MODELVIEWS       : "modelviews",
          FS_C_OBJECTS          : "objects",
          FS_C_OBJECTTYPES      : "objecttypes",
          FS_C_OBJECTTYPEVIEWS  : "objecttypeviews",
          FS_C_OBJTYPEGEOS      : "objtypegeos",
          FS_C_OBJECTVIEWS      : "objectviews",
          FS_C_PROPERTIES       : "properties",
          FS_C_METHODS          : "methods",
          FS_C_RELATIONSHIPS    : "relationships",
          FS_C_RELSHIPTYPES     : "relationshiptypes",
          FS_C_RELSHIPTYPEVIEWS : "relationshiptypeviews",
          FS_C_RELSHIPVIEWS     : "relationshipviews",
          FS_C_TYPES            : "types",
          FS_C_UNITS            : "units",
          FS_C_PROPVALUES       : "propertyvalues",
          FS_C_VALUES           : "values"
};

export let admin = {
     AKM_ADMIN_MM:            "AKM-ADMIN_MM",
     AKM_ADMIN_MODEL:         "_ADMIN_MODEL",
     AKM_ADMIN_MODELVIEW:     "_ADMIN",
     AKM_ADMIN_GOMODEL:       "_ADMIN_GOMODEL",
     AKM_PROJECT:             "Project",
     AKM_METAMODEL:           "Metamodel",
     AKM_MODEL:               "Model",
     AKM_MODELVIEW:           "Modelview",
     AKM_HAS_METAMODEL:       "has",
     AKM_HAS_MODEL:           "has",
     AKM_HAS_MODELVIEW:       "has",
     AKM_REFERSTO_METAMODEL:  "refersTo",
     AKM_GENERATEDFROM_MODEL: "generatedFrom",
     AKM_PROP_METAMODEL_ID:   "metamodelId",
     AKM_PROP_MODEL_ID:       "modelId",
     AKM_PROP_MODELVIEW_ID:   "modelviewId",
}
