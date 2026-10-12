import { createModellingCanvas } from '@mimris/modelling-editor/canvas';
import { standaloneCanvasHostServices } from '../../editorHost/canvasServices';
import { standaloneCanvasHostComponents } from '../../editorHost/canvasComponents';
import { isAutomaticallyDroppedSelfRelationship } from '../utils/modelviewPalette';

// Create once, preserving the existing component identity across host renders.
const GoJSApp = createModellingCanvas({
  services: standaloneCanvasHostServices,
  components: standaloneCanvasHostComponents,
  isAutomaticallyDroppedSelfRelationship,
});
export default GoJSApp;
