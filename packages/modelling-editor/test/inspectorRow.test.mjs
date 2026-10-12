import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { InspectorRow } from '@mimris/modelling-editor/inspector-row';

const base = { id: 'name', value: '', description: 'Saved property', values: [], pattern: '', disabled: false, checked: false, type: 'text', obj: {}, context: {}, onInputChange() {} };
const render = (props) => renderToStaticMarkup(React.createElement('table', null, React.createElement('tbody', null, React.createElement(InspectorRow, { ...base, ...props }))));

test('packaged inspector keeps unknown saved select options, inherited styling and empty choices', () => {
  const markup = render({ type: 'select', value: 'legacy', values: ['current'], isInherited: true });
  assert.match(markup, /value="legacy" selected/);
  assert.match(markup, /value="current"/);
  assert.match(markup, /font-style:italic/);
  assert.match(render({ type: 'select' }), /value="" selected/);
  assert.match(render({ type: 'textarea', value: 'note', disabled: true }), /<textarea disabled/);
});

test('packaged inspector preserves boolean callbacks and number drafts until host updates', () => {
  const changes = [];
  const row = new InspectorRow({ ...base, type: 'checkbox', value: 'true', onInputChange: (...args) => changes.push(args) });
  row.setState = (patch) => { row.state = { ...row.state, ...patch }; };
  assert.equal(row.state.checkboxValue, true);
  row.handleInputChange({ target: { checked: false }, type: 'change' });
  assert.equal(changes[0][1], false);
  assert.equal(changes[0][2], false);
  row.props = { ...row.props, type: 'number', value: 2 };
  row.handleInputChange({ target: { value: '2.' }, type: 'change' });
  assert.equal(row.state.inputValue, '2.');
  const previous = row.props;
  row.props = { ...row.props, value: 3 };
  row.componentDidUpdate(previous);
  assert.equal(row.state.inputValue, 3);
});

test('packaged inspector validates patterned blur after notifying the host', () => {
  const events = [];
  const previousAlert = globalThis.alert;
  globalThis.alert = (message) => events.push(message);
  try {
    const row = new InspectorRow({ ...base, pattern: '/^[a-z]+$/', onInputChange: (_props, value, blur) => events.push({ value, blur }) });
    row.handleInputChange({ target: { value: '123' }, type: 'blur' });
    assert.deepEqual(events[0], { value: '123', blur: true });
    assert.equal(events[1], "Value: '123' IS NOT valid");
  } finally { globalThis.alert = previousAlert; }
});
