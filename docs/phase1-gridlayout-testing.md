# Phase 1 Testing Guide: GoJS GridLayout for Swimlanes

**Status:** Ready for Testing  
**Date:** 2026-07-23  
**Branch:** alpha-pre

## What Changed

Phase 1 replaces manual swimlane positioning with GoJS's built-in GridLayout system. This is controlled by a feature flag that can be toggled for testing.

## Quick Start: Enable GridLayout

### Method 1: In Code (Persistent)

Edit [src/components/gojs/GoJSApp.tsx](../src/components/gojs/GoJSApp.tsx) line ~3621:

```typescript
modelData: {
  canRelink: true,
  [swimlane.SWIMLANE_CORE_FEATURE_FLAG]: true,  // Change to true
  ...(initialDropLayout ? { dropLayout: initialDropLayout } : {})
}
```

### Method 2: Via Browser Console (Temporary)

While diagram is open, run in browser DevTools console:

```javascript
// Enable GridLayout
myDiagram.model.modelData.useGoJSSwimlaneCore = true;
myDiagram.layoutDiagram(true);

// Disable (revert to manual)
myDiagram.model.modelData.useGoJSSwimlaneCore = false;
myDiagram.layoutDiagram(true);
```

### Method 3: Environment Variable (Global)

Add to `.env.local`:

```bash
NEXT_PUBLIC_USE_GOJS_SWIMLANE_CORE=true
```

Restart dev server:
```bash
npm run dev
```

## What to Test

### Core Functionality

- [ ] **Lane Stacking**: Lanes appear in correct vertical order
- [ ] **Lane Reordering**: Drag lane to new position → updates laneIndex and visual order
- [ ] **Lane Resize Width**: Resize one lane width → all lanes in pool match
- [ ] **Lane Resize Height**: Resize lane height → only that lane changes
- [ ] **Pool Resize**: Pool size adjusts to fit lanes
- [ ] **Add Lane**: Create new lane → positions correctly in pool
- [ ] **Delete Lane**: Remove lane → pool resizes, other lanes reposition
- [ ] **Move Nodes**: Drag node between lanes → group membership updates

### Edge Cases

- [ ] **Empty Pool**: Pool with no lanes displays correctly
- [ ] **Single Lane**: Pool with one lane behaves normally
- [ ] **Many Lanes**: Pool with 10+ lanes stacks properly
- [ ] **Collapsed Pool**: Expand/collapse preserves lane positions
- [ ] **Nested Content**: Nodes inside lanes stay positioned
- [ ] **Links**: Links between nodes in different lanes render correctly

### Persistence

- [ ] **Save to File**: Export model → lane positions saved
- [ ] **Load from File**: Import model → lanes appear in correct positions
- [ ] **Undo/Redo**: Undo lane changes → reverts correctly
- [ ] **Redux Sync**: Redux store reflects geometry changes

## Expected Behavior Differences

### With GridLayout (Flag = TRUE)

✅ **Automatic Positioning**
- Lanes stack vertically in laneIndex order
- Pool size adjusts automatically
- Dragging lanes reorders them smoothly

✅ **Simpler Code Path**
- No manual Y-coordinate calculations
- Fewer Redux dispatches
- Cleaner transaction flow

⚠️ **Potential Issues**
- Slight position differences from manual layout
- Transitions may look different
- Some edge cases might need adjustment

### With Manual Layout (Flag = FALSE)

✅ **Current Behavior**
- Exact same positioning as before
- All existing workarounds still work
- Proven stable code path

⚠️ **Known Issues**
- Lane resize feedback loops (existing bug)
- Pool position sync issues (existing bug)
- Timing-sensitive dispatches (existing bug)

## Debugging

### Check Current Flag Value

```javascript
// In browser console
console.log('GridLayout enabled:', myDiagram.model.modelData.useGoJSSwimlaneCore);
console.log('Pool layout type:', myDiagram.findNodeForKey('poolKey').layout.constructor.name);
// Should show "GridLayout" when flag is true, "PassiveSwimlaneLayout" when false
```

### Force Layout Refresh

```javascript
// Trigger re-layout
myDiagram.nodes.each(n => {
  if (n.category === 'Pool') {
    n.invalidateLayout();
  }
});
```

### View Layout State

```javascript
// Inspect lane positions
myDiagram.nodes.each(n => {
  if (n.category === 'Lane') {
    console.log(n.data.key, 'laneIndex:', n.data.laneIndex, 'Y:', n.location.y);
  }
});
```

## Rollback

If GridLayout causes issues:

1. **Immediate**: Set flag to `false` in browser console (temporary)
2. **Persistent**: Set flag to `false` in GoJSApp.tsx, reload
3. **Full Revert**: `git checkout HEAD -- src/akmm/ui_swimlane.ts src/components/gojs/GoJSApp.tsx`

## Report Issues

When reporting bugs, include:

1. **Flag State**: TRUE or FALSE
2. **Steps to Reproduce**: Exact actions taken
3. **Expected**: What should happen
4. **Actual**: What actually happened
5. **Console Errors**: Any errors in DevTools console
6. **Model State**: `JSON.stringify(myDiagram.model.toJson())` if possible

## Success Criteria

Phase 1 is successful when:

- ✅ All core functionality tests pass with flag = TRUE
- ✅ No regression when flag = FALSE
- ✅ No console errors during normal operations
- ✅ Performance is equal or better than manual layout
- ✅ Redux persistence works correctly

## Next Steps After Phase 1

Once GridLayout is stable:

1. **Phase 2**: Replace custom SwimlaneResizingTool with standard GoJS resize
2. **Phase 3**: Consolidate persistence to single event handler
3. **Deploy**: Set flag to TRUE by default
4. **Cleanup**: Remove manual layout code (relayoutPoolGroupCore, etc.)

## Related Documentation

- [Swimlane Architecture Audit](./swimlane-architecture-audit.md) - Full migration plan
- [Lane Resize Pool Sync Spec](./lane-resize-pool-sync-spec.md) - Current bugs
- [GoJS GridLayout API](https://gojs.net/latest/api/symbols/GridLayout.html) - Official docs
- [GoJS Swimlanes Sample](https://gojs.net/latest/samples/swimLanes.html) - Reference implementation
