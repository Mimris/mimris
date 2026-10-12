/** Project generation and file access remain host-owned capabilities. */
export interface DiagramProjectServices {
  buildGenerationProvenance(...args: any[]): any;
  createGeneratedMetamodelProject(...args: any[]): any;
  inspectGeneratedProjectTarget(...args: any[]): any;
  updateGeneratedMetamodelProject(...args: any[]): any;
  downloadGeneratedProject(project: any, fileName: string): void;
  chooseGeneratedProjectFile(): Promise<{ project: any; fileName: string } | null>;
}
export function createDiagramProjectServices(services: DiagramProjectServices): Readonly<DiagramProjectServices> {
  return Object.freeze({ ...services });
}
