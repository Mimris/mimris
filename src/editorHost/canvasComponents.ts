import { createCanvasHostComponents } from '@mimris/modelling-editor';
import Select, { components as selectComponents } from 'react-select';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { DiagramWrapper } from '../components/gojs/components/Diagram';
import { SelectionInspector } from '../components/gojs/components/SelectionInspector';
import { SelectedConnectedObjectsDialog } from '../components/gojs/SelectedConnectedObjectsDialog';

export const standaloneCanvasHostComponents = createCanvasHostComponents({
  DiagramWrapper, SelectionInspector, SelectedConnectedObjectsDialog,
  Select, selectComponents, Button, Modal, ModalHeader, ModalBody, ModalFooter,
});
