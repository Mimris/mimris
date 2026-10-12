import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createCanvasHostComponents } from '@mimris/modelling-editor';
function bindings(label) {
  const component = props => React.createElement('span', null, label + ':' + props.name);
  return { DiagramWrapper: component, SelectionInspector: component, SelectedConnectedObjectsDialog: component, Select: component, selectComponents: { Option: component }, Button: component, Modal: component, ModalHeader: component, ModalBody: component, ModalFooter: component };
}
test('host component bindings retain identity and separate host rendering policies', () => {
  const supplied = bindings('first'), first = createCanvasHostComponents(supplied), second = createCanvasHostComponents(bindings('second'));
  assert.equal(Object.isFrozen(first), true);
  assert.equal(first.DiagramWrapper, supplied.DiagramWrapper);
  assert.equal(first.selectComponents, supplied.selectComponents);
  assert.equal(first.SelectedConnectedObjectsDialog, supplied.SelectedConnectedObjectsDialog);
  assert.equal(renderToStaticMarkup(React.createElement(first.SelectionInspector, { name: 'saved' })), '<span>first:saved</span>');
  assert.equal(renderToStaticMarkup(React.createElement(second.SelectionInspector, { name: 'saved' })), '<span>second:saved</span>');
});
