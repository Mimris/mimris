import type { ComponentType } from 'react';

/** Host-rendered components used by the legacy canvas and its dialogs.
 * Props remain opaque until the canvas's legacy runtime props are formalized. */
export interface CanvasHostComponents {
  DiagramWrapper: ComponentType<any>;
  SelectionInspector: ComponentType<any>;
  SelectedConnectedObjectsDialog: ComponentType<any>;
  Select: ComponentType<any>;
  selectComponents: { Option: ComponentType<any> };
  Button: ComponentType<any>;
  Modal: ComponentType<any>;
  ModalHeader: ComponentType<any>;
  ModalBody: ComponentType<any>;
  ModalFooter: ComponentType<any>;
}

/** Preserve component identities so host renders do not remount the editor. */
export function createCanvasHostComponents(components: CanvasHostComponents): Readonly<CanvasHostComponents> {
  return Object.freeze({ ...components });
}
