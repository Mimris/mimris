import type { ComponentType } from 'react';

/** Host UI and styles used by the legacy diagram wrapper. Props remain opaque. */
export interface DiagramHostComponents {
  Select: ComponentType<any>;
  Button: ComponentType<any>;
  Modal: ComponentType<any>;
  ModalHeader: ComponentType<any>;
  ModalBody: ComponentType<any>;
  ModalFooter: ComponentType<any>;
  Dialog: ComponentType<any>;
  DialogContent: ComponentType<any>;
  DialogDescription: ComponentType<any>;
  DialogFooter: ComponentType<any>;
  DialogHeader: ComponentType<any>;
  DialogTitle: ComponentType<any>;
  UiButton: ComponentType<any>;
  TabContent: ComponentType<any>;
  TabPane: ComponentType<any>;
  Nav: ComponentType<any>;
  NavItem: ComponentType<any>;
  NavLink: ComponentType<any>;
  SelectionInspector: ComponentType<any>;
  RelationshipTypeEditor: ComponentType<any>;
  ChangeIconModal: ComponentType<any>;
  ChangeImageModal: ComponentType<any>;
  classNames(...args: any[]): string;
  selectComponents: { Option: ComponentType<any> };
  RELATIONSHIP_TYPE_FORM_ID: string;
  relationshipEditorStyles: Readonly<Record<string, string>>;
}

/** Create once to retain component identities across renders. */
export function createDiagramHostComponents(components: DiagramHostComponents): Readonly<DiagramHostComponents> {
  return Object.freeze({ ...components });
}
