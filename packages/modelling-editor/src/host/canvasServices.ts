/** Explicit legacy runtime capabilities required by the standalone canvas. */
type RuntimeConstructor = new (...args: any[]) => any;
type RuntimeFunction = (...args: any[]) => any;

export interface CanvasHostServices {
  akm: {
    cxCollectionOfViews: RuntimeConstructor;
    cxNode: RuntimeConstructor;
    cxObject: RuntimeConstructor;
    cxObjectView: RuntimeConstructor;
    cxObjtypeGeo: RuntimeConstructor;
    cxRelationship: RuntimeConstructor;
    cxRelationshipView: RuntimeConstructor;
  };
  gjs: {
    goModel: RuntimeConstructor;
    goObjectNode: RuntimeConstructor;
    goRelshipLink: RuntimeConstructor;
  };
  jsn: {
    jsnExportMetis: RuntimeConstructor;
    jsnModel: RuntimeConstructor;
    jsnModelView: RuntimeConstructor;
    jsnObject: RuntimeConstructor;
    jsnObjectType: RuntimeConstructor;
    jsnObjectTypeView: RuntimeConstructor;
    jsnObjectTypegeo: RuntimeConstructor;
    jsnObjectView: RuntimeConstructor;
    jsnRelationship: RuntimeConstructor;
    jsnRelationshipType: RuntimeConstructor;
    jsnRelshipTypeView: RuntimeConstructor;
    jsnRelshipView: RuntimeConstructor;
  };
  uic: {
    addItemToList: RuntimeFunction;
    changeNodeSizeAndPos: RuntimeFunction;
    copyObjviewAttributes: RuntimeFunction;
    copyProperties: RuntimeFunction;
    copyRelviewAttributes: RuntimeFunction;
    createObjectType: RuntimeFunction;
    createRelationship: RuntimeFunction;
    createRelationshipType: RuntimeFunction;
    createRelshipCallback: RuntimeFunction;
    deleteLink: RuntimeFunction;
    deleteNode: RuntimeFunction;
    deleteRelationshipType: RuntimeFunction;
    ensureContainsRelationshipView: RuntimeFunction;
    getGroupByLocation: RuntimeFunction;
    purgeDuplicatedRelshipViews: RuntimeFunction;
    purgeModelDeletions: RuntimeFunction;
    scaleNodeLocation1: RuntimeFunction;
    setObjviewColors: RuntimeFunction;
    updateNode: RuntimeFunction;
    updateObject: RuntimeFunction;
    updateObjectType: RuntimeFunction;
    updateRelationshipType: RuntimeFunction;
  };
  uid: {
    clearFocus: RuntimeFunction;
    clearPath: RuntimeFunction;
    doGroupLayout: RuntimeFunction;
    editObject: RuntimeFunction;
    editObjectType: RuntimeFunction;
    editRelationshipType: RuntimeFunction;
    getNodeByViewId: RuntimeFunction;
    selectConnectedObjects1: RuntimeFunction;
    updateLinkAndView: RuntimeFunction;
  };
  uim: {
    handleInputChange: RuntimeFunction;
    handleSelectDropdownChange: RuntimeFunction;
  };
  uit: {
    changePortName: RuntimeFunction;
    getRouting: RuntimeFunction;
  };
  utils: {
    createGuid: RuntimeFunction;
    removeArrayDuplicates: RuntimeFunction;
  };
  constants: {
    gojs: Readonly<Record<string, any>>;
    props: Readonly<Record<string, any>>;
    types: Readonly<Record<string, any>>;
    viewkinds: Readonly<Record<string, any>>;
  };
}

/** Keep native constructor identities and namespace receiver behavior intact.
 * Only the outer binding is frozen; host-owned runtimes remain mutable. */
export function createCanvasHostServices(services: CanvasHostServices): Readonly<CanvasHostServices> {
  return Object.freeze({ ...services });
}
