import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as go from 'gojs';

const source = readFileSync(new URL('../GoJSApp.tsx', import.meta.url), 'utf8');
function helper(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, name);
  const end = source.indexOf('\nfunction ', start + 1);
  return source.slice(start, end);
}
const start = source.indexOf('let persistedGroup = objview.group;');
const end = source.indexOf('const gnode = myGoModel.findNodeByViewId(objview.id);', start);
assert.ok(start >= 0 && end > start);
const harnessSource = [
  ...['getGroupBodyBounds', 'isPartVisuallyInsideGroup', 'wouldCreateGroupCycle',
    'objectContainsDescendant', 'clearPartGroupState', 'detachPartToTopLevel', 'attachPartToGroup'].map(helper),
  `function dropContainer(myDiagram, sel) {
    const data = sel.data, objview = data.objectview;
    const previousGroup = objview.group || '';
    const shiftPressed = false, isLaneGroup = false;
    const myMetamodel = { findRelationshipTypeByName() {} };
    const myModel = { findObject() {} };
    const constants = { types: {} };
    myDiagram.__movedAffectedTopLevelGroupKeys = new Set();
    ${source.slice(start, end)}
    return persistedGroup;
  }`,
].join('\n');
const compiled = ts.transpileModule(harnessSource, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
}).outputText;
const context = { go };
vm.runInNewContext(compiled, context);

// Fixed visible frames match generic containers: member bounds must not enlarge
// the parent frame and mask the fact that a child was dragged outside it.
function setup() {
  const diagram = new go.Diagram();
  diagram.groupTemplate = new go.Group('Auto', { locationSpot: go.Spot.TopLeft }).add(
    new go.Shape('Rectangle', { name: 'SHAPE', strokeWidth: 0, fill: 'lightblue' })
      .bind('desiredSize', 'size', go.Size.parse),
    new go.TextBlock().bind('text', 'key'),
  );
  diagram.nodeTemplate = new go.Node('Auto').add(new go.Shape('Rectangle', { width: 20, height: 20 }));
  diagram.model = new go.GraphLinksModel([
    { key: 'parent', isGroup: true, size: '300 250', objectview: { group: '' } },
    { key: 'other', isGroup: true, size: '300 250', objectview: { group: '' } },
    { key: 'child', isGroup: true, size: '90 70', group: 'parent', objectview: { group: 'parent' } },
    { key: 'grandchild', group: 'child' },
  ]);
  const parent = diagram.findNodeForKey('parent');
  const other = diagram.findNodeForKey('other');
  const child = diagram.findNodeForKey('child');
  const grandchild = diagram.findNodeForKey('grandchild');
  parent.location = new go.Point(0, 0);
  other.location = new go.Point(700, 0);
  child.location = new go.Point(50, 50);
  grandchild.location = new go.Point(70, 70);
  diagram.nodes.each(node => node.ensureBounds());
  return { diagram, parent, other, child, grandchild };
}

test('dragging a nested container outside detaches it and retains its children', () => {
  const { diagram, parent, child, grandchild } = setup();
  child.move(new go.Point(420, 50));
  child.ensureBounds();
  const location = child.location.copy();
  assert.equal(context.dropContainer(diagram, child), '');
  assert.equal(child.containingGroup, null);
  assert.equal(child.data.group, '');
  assert.equal(child.data.objectview.group, '');
  assert.ok(child.location.equals(location));
  assert.equal(grandchild.containingGroup, child);
  parent.move(new go.Point(100, 100));
  assert.ok(child.location.equals(location), 'moving the old parent must not move the detached child');
  const saved = JSON.parse(diagram.model.toJson());
  const reopened = new go.Diagram();
  reopened.model = go.Model.fromJson(saved);
  assert.equal(reopened.findNodeForKey('child').containingGroup, null);
  assert.equal(reopened.findNodeForKey('grandchild').containingGroup.key, 'child');
});

test('moving inside the parent retains membership and moving the parent carries its child', () => {
  const { diagram, parent, child } = setup();
  child.location = new go.Point(100, 80);
  child.ensureBounds();
  assert.equal(context.dropContainer(diagram, child), 'parent');
  assert.equal(child.containingGroup, parent);
  const before = child.location.copy();
  parent.move(new go.Point(40, 30));
  assert.ok(child.location.equals(before.offset(40, 30)));
});

test('drop membership in another container takes precedence over the previous parent', () => {
  const { diagram, other, child } = setup();
  child.location = new go.Point(740, 50);
  child.ensureBounds();
  other.addMembers(new go.Set().add(child), true);
  assert.equal(child.data.objectview.group, 'parent', 'runtime view still has the previous parent before persistence');
  assert.equal(context.dropContainer(diagram, child), 'other');
  assert.equal(child.containingGroup, other);
  assert.equal(child.data.objectview.group, 'other');
});

if (process.env.CONTAINER_PREVIEW) {
  writeFileSync(process.env.CONTAINER_PREVIEW, `<html><body><h3>Container detached after moving outside parent</h3><div id="diagram" style="width:1000px;height:500px;border:1px solid #ccc"></div><p id="result"></p><script src="file://${process.cwd()}/node_modules/gojs/release/go.js"></script><script>${compiled}\n${setup.toString()}
    const {diagram,parent,child,grandchild}=setup(); diagram.div='diagram';
    child.move(new go.Point(420,50)); child.ensureBounds(); dropContainer(diagram,child);
    const before=child.location.copy(); parent.move(new go.Point(100,100));
    document.getElementById('result').textContent='Child is top-level: '+(child.containingGroup===null)+' | Child stays when parent moves: '+child.location.equals(before)+' | Grandchild retained: '+(grandchild.containingGroup===child);
  </script></body></html>`);
}
