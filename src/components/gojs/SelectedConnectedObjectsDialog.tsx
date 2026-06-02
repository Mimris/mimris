import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, FormGroup, Label, Input, Nav, NavItem, NavLink } from 'reactstrap';

interface Props {
  isOpen: boolean;
  toggle: () => void;
  onApply: (params: any) => void;
  relationshipTypes: Array<string | { value: string; label: string }>;
}

export const SelectedConnectedObjectsDialog: React.FC<Props> = ({ isOpen, toggle, onApply, relationshipTypes }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [steps, setSteps] = useState(1);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [direction, setDirection] = useState('All');
  const [relationshipToFollow, setRelationshipToFollow] = useState('');
  const [createMissingViews, setCreateMissingViews] = useState(false);
  const normalizedRelationshipTypes = relationshipTypes.map((type) => {
    if (typeof type === 'string') return { value: type, label: type };
    return type;
  });

  const handleApply = () => {
    if (tabIndex === 0) {
      onApply({ mode: 'traverse', steps, selectedTypes, direction, createMissingViews });
    } else {
      onApply({ mode: 'follow', relationshipToFollow, createMissingViews });
    }
    toggle();
  };

  const handleSelectionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const select = e.currentTarget as unknown as HTMLSelectElement;
    const options = Array.from(
      select.selectedOptions,
      (option: HTMLOptionElement) => option.value
    );
    setSelectedTypes(options);
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="lg">
      <ModalHeader toggle={toggle}>Selected Connected Objects</ModalHeader>
      <ModalBody>
        <Nav tabs>
          <NavItem>
            <NavLink
              style={{ cursor: 'pointer' }}
              className={tabIndex === 0 ? 'active' : ''}
              onClick={() => setTabIndex(0)}
            >
              Traverse Options
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              style={{ cursor: 'pointer' }}
              className={tabIndex === 1 ? 'active' : ''}
              onClick={() => setTabIndex(1)}
            >
              Relationship to Follow
            </NavLink>
          </NavItem>
        </Nav>

        {tabIndex === 0 && (
          <div className="pt-3">
            <FormGroup>
              <Label for="steps">Steps to traverse</Label>
              <Input type="number" id="steps" value={steps} min={1} onChange={e => setSteps(Number(e.target.value))} />
            </FormGroup>
            <FormGroup>
              <Label for="reltypes">Relationship types to traverse</Label>
              <Input type="select" id="reltypes" multiple value={selectedTypes} onChange={handleSelectionChange}>
                {normalizedRelationshipTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </Input>
            </FormGroup>
            <FormGroup>
              <Label for="direction">Direction</Label>
              <Input type="select" id="direction" value={direction} onChange={e => setDirection(e.target.value)}>
                <option value="All (In/Out)">All</option>
                <option value="out">Out</option>
                <option value="in">In</option>
              </Input>
            </FormGroup>
            <FormGroup check>
              <Input
                type="checkbox"
                id="createMissingViews"
                checked={createMissingViews}
                onChange={e => setCreateMissingViews(e.target.checked)}
              />
              <Label check for="createMissingViews">Add missing objects to view</Label>
            </FormGroup>
          </div>
        )}

        {tabIndex === 1 && (
          <div className="pt-3">
            <FormGroup>
              <Label for="relationshipToFollow">Relationship to follow</Label>
              <Input type="select" id="relationshipToFollow" value={relationshipToFollow} onChange={e => setRelationshipToFollow(e.target.value)}>
                <option value="">Select relationship</option>
                {normalizedRelationshipTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </Input>
            </FormGroup>
            <FormGroup check>
              <Input
                type="checkbox"
                id="createMissingViewsFollow"
                checked={createMissingViews}
                onChange={e => setCreateMissingViews(e.target.checked)}
              />
              <Label check for="createMissingViewsFollow">Add missing objects to view</Label>
            </FormGroup>
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button color="primary" onClick={handleApply}>Apply</Button>{' '}
        <Button color="secondary" onClick={toggle}>Cancel</Button>
      </ModalFooter>
    </Modal>
  );
};
