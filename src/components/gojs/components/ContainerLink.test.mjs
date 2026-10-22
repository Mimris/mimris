import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as go from 'gojs';

const source = readFileSync(new URL('../../../akmm/ui_templates.ts', import.meta.url), 'utf8');
const start = source.indexOf('export function groupTop2(');
const end = source.indexOf('\nfunction groupPortResizeAdornment(', start);
const compiled = ts.transpileModule(source.slice(start, end).replace('export function', 'function'), {
  compilerOptions: { target: ts.ScriptTarget.ES2020 },
}).outputText;
// Only unrelated header/image helpers are replaced; the production frame and
// its ports, geometry, and bindings are exercised with real GoJS routing.
const helpers = `
const $ = go.GraphObject.make;
const textStyle = () => ({});
const makeZoomInvariantExpanderButton = () => $(go.Shape, {width:8,height:8});
const sanitizeColor = color => color || 'white';
const asBoolean = value => Boolean(value);
const findImage = () => '';
`;
const context = { go };
vm.runInNewContext(helpers + compiled, context);
function setup(groupTop2, routing = go.Link.Orthogonal) {
  const diagram = new go.Diagram();
  diagram.animationManager.isEnabled = false;
  diagram.groupTemplate = new go.Group('Spot', { locationObjectName: 'SHAPE', locationSpot: go.Spot.Center })
    .add(groupTop2(null, 'Icon', false, true));
  diagram.nodeTemplate = new go.Node('Auto', { locationSpot: go.Spot.Center })
    .add(new go.Shape('Rectangle', { width: 50, height: 30, fill: 'lightblue' }), new go.TextBlock().bind('text', 'key'));
  diagram.linkTemplate = new go.Link({ routing }).add(new go.Shape(), new go.Shape({ toArrow: 'Standard' }));
  diagram.model = new go.GraphLinksModel([
    { key: 'container', name: 'Container', isGroup: true, size: '220 120' },
    ...['left', 'right', 'above', 'below'].map(key => ({ key })),
  ], ['left', 'right', 'above', 'below'].map(from => ({ from, to: 'container' })));
  const container = diagram.findNodeForKey('container');
  container.location = new go.Point(350, 250);
  const locations = { left: [80, 250], right: [620, 250], above: [350, 60], below: [350, 440] };
  for (const [key, loc] of Object.entries(locations)) diagram.findNodeForKey(key).location = new go.Point(...loc);
  diagram.nodes.each(node => node.ensureBounds());
  diagram.links.each(link => { link.invalidateRoute(); link.updateRoute(); });
  return diagram;
}

for (const routing of [go.Link.Normal, go.Link.Orthogonal]) {
  test(`container default links choose the nearest side (routing ${routing})`, () => {
    const diagram = setup(context.groupTop2, routing);
    const container = diagram.findNodeForKey('container');
    assert.equal(container.ports.count, 1, 'default port IDs must be unique');
    const port = container.findPort('');
    const bounds = port.getDocumentBounds();
    diagram.links.each(link => {
      const point = link.getPoint(link.pointsCount - 1);
      const side = link.fromNode.key;
      const expected = side === 'left' ? bounds.x : side === 'right' ? bounds.right : side === 'above' ? bounds.y : bounds.bottom;
      const actual = side === 'left' || side === 'right' ? point.x : point.y;
      assert.ok(Math.abs(actual - expected) < 1, `${side}: ${point} should meet ${bounds}`);
    });
    const copy = new go.Diagram();
    copy.groupTemplate = diagram.groupTemplate;
    copy.nodeTemplate = diagram.nodeTemplate;
    copy.linkTemplate = diagram.linkTemplate;
    copy.model = go.Model.fromJson(diagram.model.toJson());
    assert.equal(copy.findNodeForKey('container').findPort('').name, 'CONTAINER_BORDER_PORT');
  });
}

test('moving a source to the opposite side changes the default attachment', () => {
  const diagram = setup(context.groupTop2);
  const source = diagram.findNodeForKey('left');
  const link = source.findLinksOutOf().first();
  source.location = new go.Point(650, 250);
  source.ensureBounds();
  link.invalidateRoute(); link.updateRoute();
  const port = link.toPort.getDocumentBounds();
  assert.ok(Math.abs(link.getPoint(link.pointsCount - 1).x - port.right) < 1);
});

if (process.env.CONTAINER_LINK_PREVIEW) {
  writeFileSync(process.env.CONTAINER_LINK_PREVIEW, `<html><body><h3>Links enter the container from the nearest side</h3><div id="diagram" style="width:900px;height:600px;border:1px solid #ccc"></div><script src="file://${process.cwd()}/node_modules/gojs/release/go.js"></script><script>${helpers}${compiled}${setup.toString()}\nconst diagram=setup(groupTop2); diagram.div='diagram';</script></body></html>`);
}
