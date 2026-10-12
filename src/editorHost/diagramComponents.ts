import classNames from 'classnames';
import { createDiagramHostComponents } from '@mimris/modelling-editor';
import Select, { components as selectComponents } from 'react-select';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, TabContent, TabPane, Nav, NavItem, NavLink } from 'reactstrap';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button as UiButton } from '../components/ui/button';
import { SelectionInspector } from '../components/gojs/components/SelectionInspector';
import { RelationshipTypeEditor, RELATIONSHIP_TYPE_FORM_ID } from '../components/gojs/components/RelationshipTypeEditor';
import relationshipEditorStyles from '@mimris/modelling-editor/relationship-type-editor.css';
import ChangeIconModal from '../components/modals/ChangeIconModal';
import ChangeImageModal from '../components/modals/ChangeImageModal';

export const standaloneDiagramHostComponents = createDiagramHostComponents({
classNames,
Select, Button, Modal, ModalHeader, ModalBody, ModalFooter, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, UiButton, TabContent, TabPane, Nav, NavItem, NavLink, SelectionInspector, RelationshipTypeEditor, ChangeIconModal, ChangeImageModal, selectComponents, RELATIONSHIP_TYPE_FORM_ID, relationshipEditorStyles,
});
