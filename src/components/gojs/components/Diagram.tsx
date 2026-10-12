import { createDiagramEditor } from '@mimris/modelling-editor/diagram';
import { standaloneDiagramHostServices } from '../../../editorHost/diagramServices';
import { standaloneDiagramHostComponents } from '../../../editorHost/diagramComponents';
import { standaloneDiagramProjectServices } from '../../../editorHost/diagramProjectServices';

export const DiagramWrapper = createDiagramEditor({
  services: standaloneDiagramHostServices,
  components: standaloneDiagramHostComponents,
  projects: standaloneDiagramProjectServices,
});
