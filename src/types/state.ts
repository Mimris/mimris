zexport interface Concept {
  name: string;
  description: string;
}

export interface Relationship {
  name: string;
  description: string;
  nameFrom: string;
  nameTo: string;
}

export interface MetisData {
  models: any[]; // Consider more specific types for models
  metamodels: any[]; // Consider more specific types for metamodels
  name: string;
  description: string;
  currentModelRef: string;
  currentModelviewRef: string;
  currentMetamodelRef: string;
  relationships: Relationship[];
}

export interface DomainData {
  name: string;
  description: string;
  presentation: string;
}

export interface OntologyData {
  name: string;
  description: string;
  presentation: string;
  concepts: Concept[];
  relationships: Relationship[];
}

export interface FocusData {
  focusModel: { id: string; name: string };
  focusModelview: { id: string; name: string };
  focusObject: { id: string; name: string };
  focusRelship: { id: string; name: string };
  focusObjectview: { id: string; name: string };
  focusRelshipview: { id: string; name: string };
  focusProj: {
    id: string;
    name: string;
    projectNumber: number;
    org: string;
    repo: string;
    branch: string;
    path: string;
    file: string;
  };
}

export interface UserData {
  focusUser: {
    id: string;
    name: string;
    email: string;
  };
  appSkin?: {
    visibleContext?: string;
  };
}

export interface AppState {
  phData: {
    metis: MetisData;
    domain: DomainData | string; // Handle both types as needed
    ontology: OntologyData;
  };
  phFocus: FocusData;
  phUser: UserData;
  phTemplate: string;
  phSource: string;
  lastUpdate: string;
}