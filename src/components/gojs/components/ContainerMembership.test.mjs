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
    'objectContainsDescendant', 'clearPartGroupState', 'detachPartToTopLevel', 'attachPartToGroup',
    'detachObjectOutsideContainer', 'setGroupMemberVisibilityRecursive',
    'getGroupMemberScale', 'getAncestorMemberScaleProduct', 'getDerivedScaleForGroup',
    'getRenderedPartScale', 'getRenderedTextScale', 'getRelationshipTextScale',
    'syncRelationshipTextScaleForObjectView', 'applyDerivedScaleToPart', 'applyMovedGroupMemberScales'].map(helper),
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

test('first object drag-out detaches before the former parent is collapsed', () => {
  const { diagram, parent } = setup();
  const objectview = { id: 'object', group: 'parent' };
  diagram.model.addNodeData({ key: 'object', group: 'parent', objectview });
  const object = diagram.findNodeForKey('object');
  object.location = new go.Point(50, 50);
  object.ensureBounds();
  const mirror = { group: 'parent', objectview: { ...objectview } };
  object.move(new go.Point(450, 50));
  object.ensureBounds();
  context.detachObjectOutsideContainer(diagram, object, mirror);
  assert.equal(object.containingGroup, null);
  assert.equal(object.data.group, '');
  assert.equal(objectview.group, '');
  assert.equal(mirror.group, '');
  assert.equal(mirror.objectview.group, '');
  parent.isSubGraphExpanded = false;
  context.setGroupMemberVisibilityRecursive(parent, false);
  assert.equal(object.visible, true, 'closing the old parent after one move must not hide the object');
  assert.equal(object.isVisible(), true);
  const reopened = new go.Diagram();
  reopened.model = go.Model.fromJson(diagram.model.toJson());
  assert.equal(reopened.findNodeForKey('object').containingGroup, null);
});

for (const category of ['groupNoPorts', 'Lane', 'Pool']) {
  test(`object movement preserves valid ${category} membership`, () => {
    const { diagram, parent } = setup();
    parent.data.category = category;
    const objectview = { group: 'parent' };
    diagram.model.addNodeData({ key: 'object', group: 'parent', objectview });
    const object = diagram.findNodeForKey('object');
    object.location = new go.Point(category === 'groupNoPorts' ? 50 : 450, 50);
    object.ensureBounds();
    context.detachObjectOutsideContainer(diagram, object, { group: 'parent', objectview });
    assert.equal(object.containingGroup, parent);
    parent.isSubGraphExpanded = false;
    context.setGroupMemberVisibilityRecursive(parent, false);
    assert.equal(object.visible, false);
  });
}

if (process.env.CONTAINER_PREVIEW) {
  writeFileSync(process.env.CONTAINER_PREVIEW, `<html><body><h3>Container detached after moving outside parent</h3><div id="diagram" style="width:1000px;height:500px;border:1px solid #ccc"></div><p id="result"></p><script src="file://${process.cwd()}/node_modules/gojs/release/go.js"></script><script>${compiled}\n${setup.toString()}
    const {diagram,parent,child,grandchild}=setup(); diagram.animationManager.isEnabled=false; diagram.div='diagram';
    child.move(new go.Point(420,50)); child.ensureBounds(); dropContainer(diagram,child);
    const before=child.location.copy(); parent.move(new go.Point(100,100));
    document.getElementById('result').textContent='Child is top-level: '+(child.containingGroup===null)+' | Child stays when parent moves: '+child.location.equals(before)+' | Grandchild retained: '+(grandchild.containingGroup===child);
  </script></body></html>`);
}

if (process.env.OBJECT_EXIT_PREVIEW) {
  writeFileSync(process.env.OBJECT_EXIT_PREVIEW, `<html><body><h3>Object moved out once, then container closed</h3><div id="diagram" style="width:950px;height:500px;border:1px solid #ccc"></div><p id="result"></p><script src="file://${process.cwd()}/node_modules/gojs/release/go.js"></script><script>${compiled}\n${setup.toString()}
    const {diagram,parent}=setup(); diagram.animationManager.isEnabled=false;
    diagram.model.removeNodeData(diagram.findNodeForKey('other').data);
    const objectview={group:'parent'};
    diagram.model.addNodeData({key:'Object',group:'parent',objectview});
    const object=diagram.findNodeForKey('Object'); object.location=new go.Point(50,50); object.ensureBounds();
    diagram.div='diagram'; object.move(new go.Point(450,50)); object.ensureBounds();
    detachObjectOutsideContainer(diagram,object,{group:'parent',objectview});
    parent.isSubGraphExpanded=false; setGroupMemberVisibilityRecursive(parent,false);
    document.getElementById('result').textContent='Object remains visible: '+object.isVisible()+' | Top-level after first drag: '+(object.containingGroup===null);
  </script></body></html>`);
}

test('moving a container applies its edited member scale to both existing nodes without compounding', () => {
  const { diagram, parent } = setup();
  const views = new Map();
  const mirrors = new Map();
  for (const key of ['first', 'second']) {
    const view = { id: key, group: 'parent', scale: 1 };
    views.set(key, view);
    mirrors.set(key, { objectview: { ...view }, scale: 1 });
    diagram.model.addNodeData({ key, group: 'parent', objectview: view, scale: 1 });
    const node = diagram.findNodeForKey(key);
    node.location = new go.Point(key === 'first' ? 40 : 100, 40);
    node.ensureBounds();
  }
  const initialWidth = diagram.findNodeForKey('first').actualBounds.width;
  diagram.model.setDataProperty(parent.data, 'memberscale', 0.8);
  const patches = [];
  for (const x of [50, 100]) {
    parent.move(new go.Point(x, 100));
    context.applyMovedGroupMemberScales(diagram, parent,
      { findObjectView: key => views.get(key) }, { findNode: key => mirrors.get(key) }, patch => patches.push(patch));
    for (const key of ['first', 'second']) {
      const node = diagram.findNodeForKey(key);
      node.ensureBounds();
      assert.equal(node.scale, 0.8);
      assert.equal(node.data.scale, 0.8);
      assert.equal(node.data.scale1, 0.8);
      assert.equal(views.get(key).scale, 0.8);
      assert.equal(mirrors.get(key).scale, 0.8);
      assert.ok(Math.abs(node.actualBounds.width - initialWidth * 0.8) < 0.01);
    }
  }
  assert.ok(patches.some(patch => patch.id === 'first' && patch.scale === 0.8));
  assert.ok(patches.some(patch => patch.id === 'second' && patch.scale === 0.8));
  assert.equal(parent.scale, 1);
  const reopened = go.Model.fromJson(diagram.model.toJson());
  assert.equal(reopened.findNodeDataForKey('first').scale, 0.8);
});

test('moving a container refreshes scales through nested groups', () => {
  const { diagram, parent, child, grandchild } = setup();
  diagram.model.setDataProperty(parent.data, 'memberscale', 0.8);
  diagram.model.setDataProperty(child.data, 'memberscale', 0.5);
  context.applyMovedGroupMemberScales(diagram, parent, null, null, () => {});
  assert.equal(child.scale, 0.8);
  assert.equal(grandchild.scale, 0.4);
});

if (process.env.MEMBER_SCALE_PREVIEW) {
  writeFileSync(process.env.MEMBER_SCALE_PREVIEW, `<html><body><h3>Container moved with memberscale 0.8</h3><div id="diagram" style="width:950px;height:500px;border:1px solid #ccc"></div><p id="result"></p><script src="file://${process.cwd()}/node_modules/gojs/release/go.js"></script><script>${compiled}\n${setup.toString()}
    const {diagram,parent}=setup(); diagram.animationManager.isEnabled=false;
    diagram.model.removeNodeData(diagram.findNodeForKey('other').data);
    diagram.model.removeNodeData(diagram.findNodeForKey('grandchild').data);
    diagram.model.removeNodeData(diagram.findNodeForKey('child').data);
    diagram.nodeTemplate=new go.Node('Auto').add(new go.Shape('Rectangle',{width:100,height:60,fill:'lightyellow'}),new go.TextBlock().bind('text','key'));
    for(const [key,x] of [['First',30],['Second',160]]) {
      diagram.model.addNodeData({key,group:'parent',objectview:{id:key,scale:1}});
      diagram.findNodeForKey(key).location=new go.Point(x,80);
    }
    diagram.div='diagram'; const movedParent=diagram.findNodeForKey('parent');
    diagram.model.setDataProperty(movedParent.data,'memberscale',0.8);
    movedParent.move(new go.Point(150,100)); applyMovedGroupMemberScales(diagram,movedParent,null,null,()=>{});
    document.getElementById('result').textContent='First node scale: '+diagram.findNodeForKey('First').scale+' | Second node scale: '+diagram.findNodeForKey('Second').scale;
  </script></body></html>`);
}
