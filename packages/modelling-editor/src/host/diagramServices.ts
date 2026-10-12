/** Host runtime/template capabilities used by the legacy diagram wrapper. */
type RuntimeConstructor = new (...args: any[]) => any;
type RuntimeFunction = (...args: any[]) => any;
export interface DiagramHostServices {
  akm: {
    cxCollectionOfViews: RuntimeConstructor;
    cxMetaModel: RuntimeConstructor;
    cxMethod: RuntimeConstructor;
    cxModel: RuntimeConstructor;
    cxModelView: RuntimeConstructor;
    cxObjtypeGeo: RuntimeConstructor;
    cxRelationshipTypeView: RuntimeConstructor;
  };
  gjs: {
    goModel: RuntimeConstructor;
  };
  jsn: {
    jsnDatatype: RuntimeConstructor;
    jsnExportMetis: RuntimeConstructor;
    jsnMetaModel: RuntimeConstructor;
    jsnModel: RuntimeConstructor;
    jsnModelView: RuntimeConstructor;
    jsnObject: RuntimeConstructor;
    jsnObjectTypegeo: RuntimeConstructor;
    jsnObjectView: RuntimeConstructor;
    jsnRelationship: RuntimeConstructor;
    jsnRelationshipType: RuntimeConstructor;
    jsnRelshipTypeView: RuntimeConstructor;
    jsnRelshipView: RuntimeConstructor;
  };
  uic: {
    addItemToList: RuntimeFunction;
    addMissingRelationshipViews: RuntimeFunction;
    clearRelationshipTypeViews: RuntimeFunction;
    getNameList: RuntimeFunction;
    handleContainedObjectViews: RuntimeFunction;
    isGenericMetamodel: RuntimeFunction;
    purgeModelDeletions: RuntimeFunction;
    repairMetisProperties: RuntimeFunction;
    unhideHiddenRelationshipViews: RuntimeFunction;
    verifyAndRepairMetamodels: RuntimeFunction;
    verifyAndRepairModel: RuntimeFunction;
  };
  uid: {
    addConnectedObjects: RuntimeFunction;
    addMetamodel: RuntimeFunction;
    addSubModels: RuntimeFunction;
    addToSelection: RuntimeFunction;
    alignNodes: RuntimeFunction;
    clearMetamodel: RuntimeFunction;
    clearPath: RuntimeFunction;
    deleteInvisibleObjects: RuntimeFunction;
    deleteMetamodel: RuntimeFunction;
    deleteModel: RuntimeFunction;
    deleteModelview: RuntimeFunction;
    diagramInfo: RuntimeFunction;
    doGroupLayout: RuntimeFunction;
    editObject: RuntimeFunction;
    editObjectTypeview: RuntimeFunction;
    editObjectview: RuntimeFunction;
    editRelationshipType: RuntimeFunction;
    editRelshipTypeview: RuntimeFunction;
    exportTaskModel: RuntimeFunction;
    getConnectToSelectedTypes: RuntimeFunction;
    getSubModelObjects: RuntimeFunction;
    hideConnectedRelationships: RuntimeFunction;
    linkInfo: RuntimeFunction;
    newMetamodel: RuntimeFunction;
    newModel: RuntimeFunction;
    newModelview: RuntimeFunction;
    nodeInfo: RuntimeFunction;
    openCloseAllGroups: RuntimeFunction;
    replaceCurrentMetamodel: RuntimeFunction;
    resetToTypeview: RuntimeFunction;
    selectConnectedObjects: RuntimeFunction;
    selectConnectedObjects1: RuntimeFunction;
    sortSelection: RuntimeFunction;
    spreadEven: RuntimeFunction;
    swapDirection: RuntimeFunction;
    swapDirectionIsAllowed: RuntimeFunction;
    updateProjectFromAdminmodel: RuntimeFunction;
  };
  uim: {
    handleCloseModal: RuntimeFunction;
    handleInputChange: RuntimeFunction;
    handleSelectDropdownChange: RuntimeFunction;
  };
  uit: {
    addGroupTemplates: RuntimeFunction;
    addLinkTemplates: RuntimeFunction;
    addNodeTemplates: RuntimeFunction;
    addPort: RuntimeFunction;
    changePortColor: RuntimeFunction;
    changePortName: RuntimeFunction;
    findImage: RuntimeFunction;
    forceUpdateAllIconSources: RuntimeFunction;
    getIconSource: RuntimeFunction;
    getRouting: RuntimeFunction;
    installLaneResizingTool: RuntimeFunction;
    removePort: RuntimeFunction;
    textStyle: RuntimeFunction;
  };
  ui_mtd: {
    askForMethod: RuntimeFunction;
    executeMethod: RuntimeFunction;
  };
  gen: {
    askForMetamodel: RuntimeFunction;
    askForTargetMetamodel: RuntimeFunction;
    generateDatatype: RuntimeFunction;
    generateTargetMetamodel2: RuntimeFunction;
  };
  utils: {
    createGuid: RuntimeFunction;
    removeArrayDuplicates: RuntimeFunction;
    toggleAdminModel: RuntimeFunction;
  };
  constants: {
    admin: Readonly<Record<string, any>>;
    gojs: Readonly<Record<string, any>>;
    relkinds: Readonly<Record<string, any>>;
    types: Readonly<Record<string, any>>;
    viewkinds: Readonly<Record<string, any>>;
  };
}

/** Preserve namespace receiver behavior and native constructor identities. */
export function createDiagramHostServices(services: DiagramHostServices): Readonly<DiagramHostServices> {
  return Object.freeze({ ...services });
}
