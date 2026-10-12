import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createDiagramHostComponents } from '@mimris/modelling-editor';
test('diagram UI bindings preserve reference identity and host style/form policies', () => {
  const component = props => React.createElement('span', null, props.children);
  const styles = { form: 'host-form' }, options = { Option: component };
  const first = createDiagramHostComponents({ Dialog: component, RelationshipTypeEditor: component, selectComponents: options, RELATIONSHIP_TYPE_FORM_ID: 'first', relationshipEditorStyles: styles });
  const second = createDiagramHostComponents({ Dialog: component, RELATIONSHIP_TYPE_FORM_ID: 'second', relationshipEditorStyles: { form: 'other-form' } });
  assert.equal(Object.isFrozen(first), true);
  assert.equal(first.Dialog, component);
  assert.equal(first.relationshipEditorStyles, styles);
  assert.equal(first.selectComponents, options);
  assert.equal(first.RELATIONSHIP_TYPE_FORM_ID, 'first');
  assert.equal(second.RELATIONSHIP_TYPE_FORM_ID, 'second');
  assert.equal(renderToStaticMarkup(React.createElement(first.RelationshipTypeEditor, null, 'saved')), '<span>saved</span>');
});
