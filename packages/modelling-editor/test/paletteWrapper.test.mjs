import test from 'node:test';
import assert from 'node:assert/strict';
import { createPaletteWrapper } from '@mimris/modelling-editor/palette';

const services = {
  diagram: { nodeInfo: () => 'Host tooltip' },
  templates: { getFigureNames: () => ['Rectangle'], shouldShowIconPicture: () => false, detectIconFormat: () => 'unicode', getIconSource: value => value, shouldShowUnicodeFallback: () => true, findUnicodeImage: value => value },
};
const props = { divClassName: 'diagram-component-palette', nodeDataArray: [], linkDataArray: [], layout: null, modelData: {}, myMetis: {}, myGoModel: {}, skipsDiagramUpdate: false, onDiagramEvent() {}, onModelChange() {}, diagramStyle: {} };

test('packaged palette isolates host runtime objects and React diagram refs', () => {
  const Palette = createPaletteWrapper(services);
  const first = new Palette(props), second = new Palette({ ...props, myMetis: {} });
  assert.notEqual(first.myMetis, second.myMetis);
  assert.notEqual(first.diagramRef, second.diagramRef);
  assert.equal(first.diagramRef.current, null);
  assert.equal(second.diagramRef.current, null);
  assert.notEqual(Palette, createPaletteWrapper(services));
});

test('packaged palette reuses runtime normalization without changing saved identifiers', () => {
  const Palette = createPaletteWrapper(services);
  const node = { key: 'node-id', template: 'custom', visible: null, loc: '10 20' };
  const link = { key: 'link-id', from: 'a', to: 'b', category: 'saved-link' };
  const palette = new Palette({ ...props, nodeDataArray: [node], linkDataArray: [link] });
  const rendered = palette.render();
  assert.deepEqual(rendered.props.nodeDataArray[0], { ...node, category: 'custom' });
  assert.equal(rendered.props.nodeDataArray[0].loc, '10 20');
  assert.equal(rendered.props.linkDataArray[0].category, '');
  assert.equal(link.category, 'saved-link');
  assert.equal(node.visible, false);
});
