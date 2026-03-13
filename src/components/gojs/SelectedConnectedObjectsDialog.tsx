import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, FormGroup, Label, Input, Nav, NavItem, NavLink } from 'reactstrap';

interface Props {
  isOpen: boolean;
  toggle: () => void;
  onApply: (params: any) => void;
  relationshipTypes: string[];
}

export const SelectedConnectedObjectsDialog: React.FC<Props> = ({ isOpen, toggle, onApply, relationshipTypes }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [steps, setSteps] = useState(1);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [direction, setDirection] = useState('All');
  const [relationshipToFollow, setRelationshipToFollow] = useState('');

  const handleApply = () => {
    if (tabIndex === 0) {
      onApply({ mode: 'traverse', steps, selectedTypes, direction });
    } else {
      onApply({ mode: 'follow', relationshipToFollow });
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
                {relationshipTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
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
          </div>
        )}

        {tabIndex === 1 && (
          <div className="pt-3">
            <FormGroup>
              <Label for="relationshipToFollow">Relationship to follow</Label>
              <Input type="select" id="relationshipToFollow" value={relationshipToFollow} onChange={e => setRelationshipToFollow(e.target.value)}>
                <option value="">Select relationship</option>
                {relationshipTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </Input>
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
