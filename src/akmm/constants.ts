

'use strict';

// Define View kinds

export let viewkinds = {
	OBJ:    "Object",
	AKM:    "AkmObject",
	CONT:   "Container",
	TREE:   "Tree",
	IMAGE:  "Image",
	REL:    "Relationship"
};

// Define Relationship kinds

export let relkinds = {
	REL:  "Association",
	GEN:  "Generalization",
	AGGR: "Aggregation",
	COMP: "Composition"
};

// Define GOJS constants

export let gojs = {
     C_UNITCATEGORY        : "Unit category",
     C_CONTAINER           : "Container",
     C_DATATYPE            : "Datatype",
     C_ENUMERATION         : "Enumeration",
     C_METAMODEL           : "Metamodel",
     C_MODEL               : "Model",
     C_MODELVIEW           : "Model view",
     C_AKM_OBJECT          : "AKM Object",
     C_OBJECT              : "Object",
     C_OBJECTTYPE          : "Object type",
     C_OBJECTTYPEVIEW      : "Object type view",
     C_OBJECTTYPEGEO       : "Object type geo",
     C_OBJECTVIEW          : "Object view",
     C_PALETTEGROUP_OBJ    : "typeitem",
     C_PROPERTY            : "Property",
     C_RELATIONSHIP        : "Relationship",
     C_RELSHIPTYPE         : "Relationship type",
     C_RELSHIPTYPEVIEW     : "Relationship type view",
     C_RELSHIPVIEW         : "Relationship view",
     C_UNIT                : "Unit",
     C_PROPVALUE           : "Property value",
     C_VALUE               : "Value",
     C_VIEWFORMAT          : "View format",
     C_FIELDTYPE           : "Field type",
     C_INPUTPATTERN        : "Input pattern"
};

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
    FS_C_RELATIONSHIPS    : "relationships",
    FS_C_RELSHIPTYPES     : "relationshiptypes",
    FS_C_RELSHIPTYPEVIEWS : "relationshiptypeviews",
    FS_C_RELSHIPVIEWS     : "relationshipviews",
    FS_C_TYPES            : "types",
    FS_C_UNITS            : "units",
    FS_C_PROPVALUES       : "propertyvalues",
    FS_C_VALUES           : "values"
};

export let types = {
    // EKA types
         EKA_ELEMENT       : "EKA Element",
         EKA_SPACE         : "EKA Space",
         EKA_OBJECT        : "EKA Object",
         EKA_PROPERTY      : "EKA Property",
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
    
    // AKM types
         AKM_INFORMATION       : "Information",
         AKM_ROLE              : "Role",
         AKM_TASK              : "Task",
         AKM_VIEW              : "View",
         AKM_PRODUCT           : "Product",
         AKM_ORGANISATION      : "Organisation",
         AKM_PROCESS           : "Process",
         AKM_SYSTEM            : "System",
         AKM_PROPERTY          : "Property",
         AKM_DATATYPE          : "Datatype",
         AKM_VALUE             : "Value",
         AKM_INPUTPATTERN      : "InputPattern",
         AKM_VIEWFORMAT        : "ViewFormat",
         AKM_FIELDTYPE         : "FieldType",
         AKM_UNIT              : "Unit",
         AKM_HAS_MEMBER        : "hasMember",
         AKM_HAS_PART          : "hasPart",
         AKM_HAS_PROPERTY      : "has",
         AKM_IS_OF_DATATYPE    : "isOf",
         AKM_IS_DEFAULTVALUE   : "isDefault",
         AKM_HAS_ALLOWED_VALUE : "hasAllowed",
         AKM_HAS_INPUTPATTERN  : "has",
         AKM_HAS_VIEWFORMAT    : "has",
         AKM_HAS_FIELDTYPE     : "has",
    
    // Type properties
         OBJECTTYPE_ID         : "objecttype",
         OBJECTTYPE            : "Object type",
         OBJECTTYPE_NAME       : "Object type",
         OBJECTTYPE_DESC       : "",
         CONTAINERTYPE_NAME    : "Container type",
         RELATIONSHIPTYPE_ID   : "relationshiptype",
         RELATIONSHIPTYPE      : "Relationship type",
         RELATIONSHIPTYPE_NAME : "My Relationship type",
         RELATIONSHIPTYPE_DESC : "",
    
};
    
