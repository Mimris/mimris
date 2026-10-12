import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createModellingCanvas } from '@mimris/modelling-editor/canvas';
const components = () => {
  const component = () => null;
  return { DiagramWrapper: component, SelectionInspector: component, SelectedConnectedObjectsDialog: component, Select: component, selectComponents: { Option: component }, Button: component, Modal: component, ModalHeader: component, ModalBody: component, ModalFooter: component };
};
const services = () => ({ akm: {}, gjs: {}, jsn: {}, uic: {}, uid: {}, uim: {}, uit: {}, utils: {}, constants: { gojs: { C_NODETEMPLATE: 'textAndIcon', C_LINKEMPLATE: 'linkTemplate1' }, types: {}, props: {}, viewkinds: {} } });
const props = label => ({ nodeDataArray: [{ key: label, category: 'textAndIcon', unknown: 'keep' }], linkDataArray: [], myMetis: { objecttypes: [], currentMetamodel: { relationshiptypes: [{ name: label }] } }, phFocus: { focusTab: 'Modelling' }, dispatch() {} });
test('public canvas factory constructs independent editors and uses each host dialog binding', () => {
  const firstComponents = components(), secondComponents = components();
  const First = createModellingCanvas({ services: services(), components: firstComponents, isAutomaticallyDroppedSelfRelationship: () => false });
  const Second = createModellingCanvas({ services: services(), components: secondComponents, isAutomaticallyDroppedSelfRelationship: () => false });
  const first = new First(props('first')), second = new Second(props('second'));
  assert.notEqual(First, Second);
  assert.notEqual(first.state, second.state);
  assert.equal(first.state.nodeDataArray[0].unknown, 'keep');
  assert.equal(second.state.nodeDataArray[0].key, 'second');
  const dialog = first.renderConnectedObjectsDialog();
  assert.equal(dialog.type, firstComponents.SelectedConnectedObjectsDialog);
  assert.deepEqual(dialog.props.relationshipTypes, ['first']);
  assert.equal(second.renderConnectedObjectsDialog().type, secondComponents.SelectedConnectedObjectsDialog);
  assert.notEqual(first.deferredCallbacks, second.deferredCallbacks);
});
test('packaged canvas imports only package-local modules and public peers', () => {
  const source = readFileSync(new URL('../src/components/ModellingCanvas.tsx', import.meta.url), 'utf8');
  const root = new URL('../src/', import.meta.url), file = new URL('components/ModellingCanvas.tsx', root);
  for (const [, dependency] of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    assert.ok(['react', 'gojs'].includes(dependency) || (dependency.startsWith('.') && new URL(dependency, file).href.startsWith(root.href)), dependency);
  }
});

test('parent snapshots do not mutate the live diagram while resizing', async () => {
  const go = await import('gojs');
  const Canvas = createModellingCanvas({ services: services(), components: components(), isAutomaticallyDroppedSelfRelationship: () => false });
  const previous = props('container');
  const canvas = new Canvas(previous);
  const diagram = new go.Diagram();
  diagram.currentTool = diagram.toolManager.resizingTool;
  diagram.currentTool.isActive = true;
  canvas.state.myMetis.myDiagram = diagram;
  canvas.props = { ...previous, nodeDataArray: [{ key: 'container', loc: 'old', size: 'old' }], myMetis: {} };
  canvas.setState = () => assert.fail('active resize must not receive a parent state snapshot');
  diagram.model.commit = () => assert.fail('active resize must not rebind the live model');
  canvas.componentDidUpdate(previous);
  canvas.handleModelChange({ modifiedNodeData: [{ key: 'container', loc: 'old' }] });
});


test('Strict Mode remount resumes durable writes and starts a fresh deferred callback controller', async () => {
  const Canvas = createModellingCanvas({ services: services(), components: components(), isAutomaticallyDroppedSelfRelationship: () => false });
  const canvas = new Canvas(props('remount'));
  const first = canvas.deferredCallbacks;
  let oldCalled = false;
  first.schedule(() => { oldCalled = true; }, 0);
  canvas.componentWillUnmount();
  canvas.componentDidMount();
  assert.equal(canvas.__viewDispatchDisposed, false);
  assert.notEqual(canvas.deferredCallbacks, first);
  await new Promise(resolve => canvas.deferredCallbacks.schedule(resolve, 0));
  assert.equal(oldCalled, false);
  canvas.componentWillUnmount();
});
