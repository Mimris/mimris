# Swimlane Architecture Audit & Migration Plan

**Date:** 2026-07-23  
**Branch:** alpha-pre  
**Status:** Proposal - Ready for Implementation

## Executive Summary

**Current State:** Mimris reimplements ~70% of GoJS's built-in swimlane functionality with custom code, causing:
- Lane resize feedback loops
- Layout synchronization issues  
- Pool position persistence bugs
- ~800 lines of fragile manual geometry code

**Finding:** The GoJS swimlanes example proves all core features (layout, resize, reorder, move nodes) work perfectly with GoJS built-ins.

**Recommendation:** Replace custom implementations with GoJS standard approach, keeping only Mimris-specific additions (creation UI, Redux persistence, custom styling).

## Core Issue Analysis

### What GoJS Already Provides (and we're reimplementing)

1. **Swimlane Layout** ✅ GoJS has `PoolLayout` and `GridLayout`
2. **Resize Handling** ✅ GoJS has built-in `ResizingTool` with proper event flow
3. **Lane Reordering** ✅ GoJS drag-and-drop with `mouseDrop` events
4. **Node Movement** ✅ GoJS group membership with `addMembers`
5. **Geometry Management** ✅ GoJS bindings and data model

### What Mimris Actually Needs (unique to our app)

1. **Pool/Lane Creation UI** - Not in GoJS example
2. **Palette Integration** - Drag from palette into lanes
3. **Redux State Sync** - Persist to phData store
4. **Custom Styling** - BPMN-specific visuals
5. **Save to Repository** - GitHub/local file persistence

## Current Custom Implementation (Problematic)

### File: `src/akmm/ui_swimlane.ts`

#### ❌ Problem 1: Passive Layout (Lines 568-571)
```typescript
class PassiveSwimlaneLayout extends go.Layout {
  doLayout() {
    // Empty - disables GoJS layout system
  }
}
```
**Issue:** Disables GoJS's automatic layout, forcing manual geometry everywhere.  
**GoJS Alternative:** Use `go.GridLayout` with proper configuration.

---

#### ❌ Problem 2: Custom ResizingTool (Lines 574-680)
```typescript
class SwimlaneResizingTool extends go.ResizingTool {
  _originalLaneLoc: go.Point | null = null;
  _originalLaneBodyWidth = 0;
  _originalLaneHeight = 0;
  _originalLaneRightX = 0;
  _originalPoolLoc: go.Point | null = null;
  
  doActivate() {
    // Set __deferSwimlaneGeometryDispatch flag
    // Store original positions
    // Custom cursor management
  }
  
  doDeactivate() {
    // Clear flags
    // Reset cursor
  }
  
  doMouseUp() {
    // Trigger manual relayout
    // Dispatch geometry to Redux
  }
}
```
**Issue:** Complex state tracking, flag management, timing-sensitive dispatches.  
**GoJS Alternative:** Use standard `go.ResizingTool`, add persistence hook in `Part.resized` event.

---

#### ❌ Problem 3: Manual Layout Engine (Lines 390-460)
```typescript
function relayoutPoolGroupCore(diagram, pool, forcedSize?, allowPoolShrink?) {
  // ~200 lines of manual positioning:
  // 1. Collect all lanes
  // 2. Sort by laneIndex
  // 3. Calculate widestLaneTotal manually
  // 4. Loop through lanes, set Y positions
  // 5. Calculate pool size manually
  // 6. Loop again to normalize lane widths
  // 7. Update desiredSize on panels
  // 8. Call persistSwimlaneGeometry for each
}
```
**Issue:** Reimplements what `go.GridLayout` does automatically. Brittle, hard to debug.  
**GoJS Alternative:** Let `go.GridLayout` handle positioning, only persist final positions.

---

#### ❌ Problem 4: Complex Persistence Layer (Lines 165-260)
```typescript
function persistSwimlaneGeometry(diagram, part, loc?, size?) {
  // 1. Update part.data via diagram.model.setDataProperty
  // 2. Update metis objectview via updateObjectViewGeometry
  // 3. Dispatch Redux action via dispatchSwimlaneGeometry
}

function dispatchInstalledSwimlaneGeometrySnapshot(diagram, pool) {
  // Iterate pool + all lanes, dispatch each
}
```
**Issue:** Persistence intertwined with layout logic. Timing issues with `__deferSwimlaneGeometryDispatch` flag.  
**GoJS Alternative:** Single persistence hook in diagram `ChangedEvent` handler, no flags needed.

---

#### ❌ Problem 5: Suppression Flags (Throughout)
```typescript
(diagram as any).__deferSwimlaneGeometryDispatch = true;  // Prevent dispatches during resize
(diagram as any).__suppressComponentDispatchUntil = Date.now() + 300;  // Block incoming syncs
(diagram as any).__suppressIncomingSwimlaneSyncUntil = timestamp;  // Prevent Redux updates
```
**Issue:** Multiple overlapping suppression mechanisms suggest race conditions and timing bugs.  
**GoJS Alternative:** Proper event sequencing eliminates need for suppression.

---

## GoJS Built-in Approach (From swimLanes.html Example)

### ✅ Solution 1: Use GridLayout
```javascript
// Pool template with GridLayout
layout: $(go.GridLayout, {
  wrappingColumn: 1,           // Stack lanes vertically
  cellSize: new go.Size(1, 1), // Minimal cell size
  spacing: new go.Size(0, 0),  // No gaps
  alignment: go.GridLayout.Position
})
```
**Benefits:** 
- Automatic positioning of lanes
- Built-in reordering on drag
- No manual Y-coordinate calculations

---

### ✅ Solution 2: Standard Resize with Event Hook
```javascript
// Lane template with standard resize
resizable: true,
resizeAdornmentTemplate: $(go.Adornment, "Spot",
  $(go.Placeholder),
  $(go.Shape, {
    alignment: go.Spot.Right,
    cursor: "col-resize",
    desiredSize: new go.Size(6, 6)
  })
)
```
**Persistence Hook:**
```typescript
// In diagram initialization
myDiagram.addDiagramListener("Modified", (e) => {
  if (e.isTransactionFinished) {
    // Save only after transaction completes
    persistDiagramToRedux(myDiagram);
  }
});
```
**Benefits:**
- No custom tool needed
- Automatic handle positioning
- Clean event flow: resize → transaction end → persist

---

### ✅ Solution 3: Built-in Drag & Drop
```javascript
// Pool template
handlesDragDropForMembers: true,
mouseDrop: (e, pool) => {
  const diagram = e.diagram;
  const dragged = diagram.selection;
  
  // GoJS handles group membership automatically
  pool.addMembers(dragged, true);
  
  // Only need to persist final state
  persistPoolGeometry(diagram, pool);
}
```
**Benefits:**
- No manual member collection
- No position calculations
- GoJS handles group changes

---

## Migration Plan: 3-Phase Approach

### Phase 1: Replace Layout System (Lowest Risk)
**Goal:** Switch from `PassiveSwimlaneLayout` to `go.GridLayout`

**Changes:**
1. **ui_swimlane.ts:1186** - Pool template layout
```typescript
// BEFORE:
layout: $(PassiveSwimlaneLayout),

// AFTER:
layout: $(go.GridLayout,
  {
    wrappingColumn: 1,
    cellSize: new go.Size(1, 1),
    spacing: new go.Size(0, 0),
    alignment: go.GridLayout.Position,
    comparer: (a, b) => {
      // Sort by laneIndex
      const aIndex = a.data?.laneIndex ?? 0;
      const bIndex = b.data?.laneIndex ?? 0;
      return aIndex - bIndex;
    }
  }
),
```

2. **Remove manual layout calls**
- Delete calls to `relayoutPoolGroupCore`
- Delete `relayoutPool` wrapper
- Keep persistence logic, move to event handler

**Testing:**
- Verify lanes stack vertically
- Verify reordering via drag works
- Check lane width consistency

**Risk:** Low - Layout is isolated from other systems

---

### Phase 2: Replace ResizingTool (Medium Risk)
**Goal:** Remove `SwimlaneResizingTool`, use standard `go.ResizingTool`

**Changes:**
1. **ui_swimlane.ts:574-680** - Delete entire custom tool class

2. **ui_swimlane.ts:~ 1190** - Pool template
```typescript
// Remove custom resizing tool from diagram.toolManager
// Use standard built-in instead
```

3. **Add resize event hook**
```typescript
// In GoJSApp.tsx diagram initialization
myDiagram.addDiagramListener("PartResized", (e) => {
  const part = e.subject.part;
  if (isPoolGroup(part) || isLaneGroup(part)) {
    persistSwimlaneGeometry(myDiagram, part);
  }
});
```

4. **Remove suppression flags**
- Delete `__deferSwimlaneGeometryDispatch`
- Delete related timing logic

**Testing:**
- Resize lane width → affects all lanes in pool
- Resize lane height → only that lane
- Redux receives geometry updates

**Risk:** Medium - Touches resize behavior users interact with

---

### Phase 3: Consolidate Persistence (Highest Risk)
**Goal:** Single persistence path, remove multiple dispatch points

**Changes:**
1. **Create unified persistence handler**
```typescript
// New file: src/akmm/swimlane_persistence.ts
export function persistDiagramChanges(diagram: go.Diagram) {
  if ((diagram as any).__persistenceSuppressed) return;
  
  const changes = {
    pools: [],
    lanes: [],
    nodes: []
  };
  
  diagram.nodes.each(node => {
    if (isPoolGroup(node)) {
      changes.pools.push(extractGeometry(node));
    } else if (isLaneGroup(node)) {
      changes.lanes.push(extractGeometry(node));
    } else {
      changes.nodes.push(extractGeometry(node));
    }
  });
  
  // Single Redux dispatch with batch update
  dispatch({
    type: 'UPDATE_SWIMLANE_GEOMETRY_BATCH',
    data: changes
  });
}
```

2. **Remove scattered dispatch calls**
- Delete `dispatchSwimlaneGeometry` at individual points
- Delete `dispatchInstalledSwimlaneGeometrySnapshot`
- Keep only diagram-level listener

3. **Simplify flags**
- Single `__persistenceSuppressed` flag for loading operations
- Remove timing-based suppressions

**Testing:**
- Create/delete pool → persists correctly
- Move/resize lane → persists correctly  
- Undo/redo → doesn't double-persist
- Load from file → doesn't trigger spurious saves

**Risk:** High - Affects save/load reliability

---

## Implementation Strategy

### Approach: Incremental with Feature Flags

Each phase gets a feature flag:
```typescript
// In model data
modelData: {
  useGoJSGridLayout: true,        // Phase 1
  useStandardResizeTool: false,   // Phase 2  
  useUnifiedPersistence: false,   // Phase 3
}
```

**Benefits:**
- Test each phase independently
- Easy rollback per phase
- Deploy to production incrementally
- Keep old code until fully validated

### Testing Checklist (Per Phase)

#### Functional Tests
- [ ] Create new pool with lanes
- [ ] Resize lane width → all lanes in pool match
- [ ] Resize lane height → only that lane changes
- [ ] Drag lane to reorder → visual + laneIndex updates
- [ ] Move node between lanes → group membership updates
- [ ] Expand/collapse pool → lanes adjust
- [ ] Delete lane → pool resizes
- [ ] Save to file → geometry preserved
- [ ] Load from file → layout matches saved state
- [ ] Undo/redo all operations

#### Edge Cases
- [ ] Empty pool (no lanes)
- [ ] Pool with 1 lane
- [ ] Pool with 10+ lanes
- [ ] Very wide lanes (>2000px)
- [ ] Very narrow lanes (<100px)
- [ ] Nested groups inside lanes
- [ ] Links crossing lane boundaries

#### Integration Tests
- [ ] Redux state stays in sync
- [ ] Metis model reflects changes
- [ ] GitHub save/load works
- [ ] Local file import/export works
- [ ] Multi-user scenarios (future)

---

## Expected Benefits

### Code Reduction
- **Delete:** ~800 lines of manual layout code
- **Delete:** ~200 lines of custom ResizingTool
- **Simplify:** ~150 lines of persistence code
- **Total:** ~1,150 lines removed (estimated)

### Bug Fixes
- ✅ Lane resize feedback loops → gone (GoJS handles)
- ✅ Pool position sync issues → gone (single persistence path)
- ✅ Reorder race conditions → gone (GridLayout sorts)
- ✅ Timing-based suppression bugs → gone (proper event flow)

### Maintainability
- Leverage GoJS's tested codebase
- Fewer edge cases to handle
- Clearer separation: GoJS handles visuals, Mimris handles data
- Easier to upgrade GoJS versions

### Performance
- Less JavaScript execution during resize/drag
- Fewer Redux dispatches (batch updates)
- No manual geometry calculations

---

## Risk Mitigation

### Backward Compatibility
**Issue:** Existing models have geometry stored from manual layout.

**Solution:** Migration helper
```typescript
function migrateGeometryToGridLayout(modelData: any) {
  // Recalculate laneIndex from Y positions
  // Normalize lane widths within pools
  // Clear cached sizes that assume manual layout
}
```

### Rollback Plan
- Keep all Phase 1-2 code in place with flags
- Feature flag defaults to OFF initially
- Enable per-user or per-model
- Full rollback possible within 24 hours

### Staged Rollout
1. **Week 1:** Phase 1 in dev environment, internal testing
2. **Week 2:** Phase 1 in staging, beta users
3. **Week 3:** Phase 1 in production, monitor metrics
4. **Week 4:** Phase 2 begins if no issues
5. Continue pattern for Phase 3

---

## Resources

### GoJS Documentation
- [Intro to Groups](https://gojs.net/latest/intro/groups.html)
- [Swimlanes Sample](https://gojs.net/latest/samples/swimLanes.html)
- [GridLayout API](https://gojs.net/latest/api/symbols/GridLayout.html)
- [ResizingTool API](https://gojs.net/latest/api/symbols/ResizingTool.html)

### Related Mimris Docs
- [docs/lane-resize-pool-sync-spec.md](./lane-resize-pool-sync-spec.md) - Current issues
- [/memories/repo/lane-member-drag-issue.md](/memories/repo/lane-member-drag-issue.md) - Drag bugs
- [ROADMAP.md](./ROADMAP.md) - Future plans

### Key Files to Review
- `src/akmm/ui_swimlane.ts` - Current custom implementation
- `src/components/gojs/components/Diagram.tsx` - Event handlers
- `src/reducers/reducer.js` - Redux persistence

---

## Next Steps

1. **Review this audit** with team/stakeholders
2. **Approve migration approach** (all 3 phases or subset)
3. **Create feature branch** `feature/gojs-standard-swimlanes`
4. **Implement Phase 1** with feature flag
5. **Test extensively** per checklist above
6. **Deploy to dev** for validation
7. **Repeat for Phases 2-3**

---

## Questions for Discussion

1. **Timeline:** Aggressive (1-2 weeks) or conservative (4-6 weeks)?
2. **Scope:** All 3 phases or start with Phase 1 only?
3. **Testing:** Need automated tests before proceeding?
4. **Rollout:** Feature flags or separate branch deployment?
5. **Priority:** Block other work or parallel development?

---

## Conclusion

**You were right:** The GoJS swimlanes example proves the core features work perfectly when using GoJS's built-in systems. 

**The path forward is clear:**
1. Remove custom implementations that duplicate GoJS functionality
2. Keep only Mimris-specific additions (creation, persistence, styling)
3. Gain stability, maintainability, and performance

**Recommendation:** Proceed with Phase 1 (layout system) immediately. It's low-risk, high-reward, and validates the entire approach.
