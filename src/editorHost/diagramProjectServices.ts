import { createDiagramProjectServices } from '@mimris/modelling-editor';
import { buildGenerationProvenance, createGeneratedMetamodelProject, inspectGeneratedProjectTarget, updateGeneratedMetamodelProject } from '../components/utils/generatedMetamodelProject';
import { downloadGeneratedProject, chooseGeneratedProjectFile } from './generatedProjectFiles';
export const standaloneDiagramProjectServices = createDiagramProjectServices({
  buildGenerationProvenance, createGeneratedMetamodelProject, inspectGeneratedProjectTarget, updateGeneratedMetamodelProject, downloadGeneratedProject, chooseGeneratedProjectFile,
});
