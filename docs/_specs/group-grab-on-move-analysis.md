# Group Grab on Move - Analysis & Planning

## Problem Statement

When a Container (group with `grabIsAllowed=true`) is moved over nodes, those nodes should automatically become members of the container. Currently this does not work.

## Current Architecture Analysis

### SelectionMoved Handler Flow (GoJSApp.tsx, lines 3831+)

```
1. Metamodel handling (3836-3879)
   └─> If isMetamodelSelection() → update objecttype positions → BREAK

2. Regular node processing (3880-4534)
   ├─> Build myFromNodes array (nodes before move)
   ├─> Build myToNodes array (nodes after move) 
   ├─> For each moved node:
   │   └─> Call uic.changeNodeSizeAndPos() ← THIS HAS GRAB LOGIC
   └─> Creates modifiedObjectViews list

3. Group processing for Pools/Lanes (4535+)
   ├─> Iterates movedGroupSelection
   ├─> Handles Pool/Lane membership
   ├─> Handles regular group reparenting (Shift+drag)
   └─> Has grab logic at lines 4790-5044 (groupAllowsGrab check)

4. Swimlane relayout & cleanup (5700+)
   └─> Pool normalization, member updates, dispatches
```

### Key Functions

#### `changeNodeSizeAndPos()` (ui_common.ts, lines 2795-2920)
- **Called when:** A node is moved (line 4082 in GoJSApp.tsx)
- **What it does:**
  - Updates node location/size/scale
  - **Lines 2829-2920: GROUP GRAB LOGIC**
    - Checks if node moved into a group with `grabIsAllowed`
    - Uses `getGroupByLocation()` for geometric containment
    - Calls `addMembers()` to attach node to group
    - Updates objectview.group property

**Problem:** This ONLY runs for regular nodes being moved, NOT for groups being moved.

#### `groupAllowsGrab()` (GoJSApp.tsx, lines 964-1002)
- Checks multiple sources for `grabIsAllowed` property:
  - `objectview.grabIsAllowed`
  - `data.grabIsAllowed` 
  - `group.grabIsAllowed`
  - Redux store objectview
- Returns boolean

#### `getGroupByLocation()` (ui_common.ts, lines 2463-2650)
- Geometric containment check
- Uses 45% overlap threshold OR center-inside
- Returns the deepest matching group

#### `isPartVisuallyInsideGroup()` (GoJSApp.tsx, lines 999-1018)
- Visual containment check
- 45% overlap OR center-inside
- Used in existing grab logic at lines 4790-5044

### Existing Group Grab Logic

**Location:** GoJSApp.tsx, lines 4790-5044

```typescript
if (!isLaneGroup && groupAllowsGrab(sel, myModelview, myMetis)) {
  // Find nodes visually inside the moved group
  myDiagram.nodes.each((candidate: go.Node) => {
    if (isPartVisuallyInsideGroup(candidate, sel)) {
      // Attach candidate to group
      attachPartToGroup(myDiagram, candidate, sel, candidateData);
      // Update objectview.group
      candidateObjview.group = String(sel.key);
      // ... scale, loc updates ...
    }
  });
}
```

**When this runs:** After Pool/Lane processing, for groups that were moved.

**Why it might not work for your case:**
1. Might only run for `go.Group` instances (need to verify Container is recognized as Group)
2. Might be skipped if Container is processed as regular node in lines 3971-4070
3. Might break early due to `isMetamodelSelection()` returning true

## Move Scenarios to Support

### 1. Node Moves (ALREADY WORKS via changeNodeSizeAndPos)
- ✅ Node moved inside modelview (top-level)
- ✅ Node moved inside a container
- ✅ Node moved from outside → inside container (with Shift)
- ✅ Node moved from inside → outside container (with Shift)  
- ✅ Node moved from container A → container B (with Shift)

### 2. Group Moves (NEEDS FIX)
- ❌ **Container moved over nodes → nodes should become members**
- ❓ Container moved while holding members → members should follow
- ❓ Nested container moved from parent A → parent B
- ❓ Container resized to encompass more nodes

### 3. Special Cases
- Pool/Lane moves (WORKS - handled separately lines 4535+)
- Metamodel objecttype moves (WORKS - lines 3836-3879)
- Multi-selection moves
- Scaled/nested group scenarios (memberscale)

## Key Questions for Discussion

### Q1: Container Type Recognition
**Question:** Is your Container a proper `go.Group` instance or a regular `go.Node` with `isGroup=true`?

**Why it matters:** The existing grab logic at line 4790 checks `sel instanceof go.Group`. If Container is not recognized as a Group, it won't reach that code.

**How to verify:** 
```javascript
// In browser console with Container selected:
myDiagram.selection.first().constructor.name // Should be "Group"
myDiagram.selection.first() instanceof go.Group // Should be true
```

### Q2: Metamodel False Positive
**Question:** Does `isMetamodelSelection()` return true for your Container?

**Why it matters:** Lines 3836-3879 break early if any selected part has an `objecttype` property. Your Container probably HAS an objecttype (its type definition), so it might be incorrectly treated as a metamodel object.

**Current check:**
```typescript
function isMetamodelSelection(myMetis: any, selection: any) {
  if (myMetis?.modelType === 'Metamodelling') return true;
  for (let it = selection?.iterator; it?.next();) {
    const part = it.value;
    const data = part?.data;
    if (data?.objecttype || data?.category === constants.gojs.C_OBJECTTYPE) return true;
  }
  return false;
}
```

**Fix needed:** Should only return true if `modelType === 'Metamodelling'`, not just because objecttype exists.

### Q3: Node vs Group Processing
**Question:** Where in the flow should Container moves be processed?

**Options:**
- **A.** Skip Container in regular node loop (3971-4070), process separately like Pools/Lanes  
- **B.** Process Container in regular node loop but add grab logic there
- **C.** Ensure existing grab logic at lines 4790-5044 runs for Container

### Q4: Shift Key Requirement
**Question:** Should grab work:
- **Always** when `grabIsAllowed=true` (regardless of Shift)?
- **Only with Shift** (like current node-into-group behavior)?
- **Without Shift for grab, with Shift for reparenting** (different behaviors)?

### Q5: Scaling Behavior
**Question:** When nodes become members:
- Should they inherit `memberscale` from Container?
- Should their positions be scaled/adjusted?
- What happens to their existing scale values?

## Proposed Implementation Options

### Option A: Fix Metamodel Check + Ensure Grab Logic Runs

**Changes:**
1. **Fix `isMetamodelSelection()`** to only return true in Metamodelling mode
2. **Skip groups in node processing loop** (add `if (n instanceof go.Group) continue` at line ~3976)
3. **Verify existing grab logic** at lines 4790-5044 runs for Container

**Pros:** Minimal changes, uses existing grab infrastructure  
**Cons:** Need to verify Container is recognized as go.Group

### Option B: Dedicated Container Grab Handler

**Changes:**
1. Add new section after line 4534 specifically for non-swimlane group moves
2. Mirror the grab logic from `changeNodeSizeAndPos` 
3. Process Container moves with same geometric containment checks

**Pros:** Clear separation, easier to debug  
**Cons:** Code duplication with existing grab logic

### Option C: Refactor Grab into Shared Function

**Changes:**
1. Extract grab logic from `changeNodeSizeAndPos` into shared function `performGroupGrab(movedPart, diagram, model, ...)`
2. Call from both node moves and group moves
3. Single source of truth for grab behavior

**Pros:** DRY, maintainable, consistent behavior  
**Cons:** Larger refactoring effort

## Next Steps

1. **Verify Container properties** (Q1 & Q2 above)
2. **Discuss and decide:** Which questions above need answers?
3. **Choose implementation approach** (A, B, or C)
4. **Create detailed implementation plan** with specific line numbers and code changes
5. **Implement with proper guards** to avoid infinite loops
6. **Test thoroughly** with your Container + Method + EntityType scenario

---

## Solution Implemented

### Root Causes Identified
1. **Q1:** Container is a proper `go.Group` instance ✅
2. **Q2:** `isMetamodelSelection()` was returning true incorrectly ✅
3. **Position swapback:** Locks were being captured at wrong time with stale positions
4. **Visual flicker:** Forced React updates triggered unnecessary re-renders
5. **Watchdog issues:** Dispatching to Redux caused infinite loops

### Fixes Applied

#### 1. Fixed `isMetamodelSelection()` (GoJSApp.tsx ~line 1450)
**Before:** Returned true if `data?.objecttype` exists  
**After:** Only returns true if `data?.category === C_OBJECTTYPE`

**Why:** Regular model objects have an `objecttype` property defining their TYPE. This doesn't mean they ARE metamodel objects.

#### 2. Immediate Lock Capture for Groups (GoJSApp.tsx ~line 4604)
Locks are now captured immediately after setting group position, using the exact calculated `newLoc` value instead of reading back from `sel.location` which can be modified by subsequent code.

#### 3. Immediate Lock Capture for Nodes (GoJSApp.tsx ~line 4091)
Locks are now captured immediately after `changeNodeSizeAndPos` runs, using the actual live node position from the diagram.

#### 4. Skip Redundant Lock Processing (GoJSApp.tsx ~line 6020)
End of SelectionMoved handler now skips:
- Groups (already have locks from group processing)
- Nodes with existing locks (already set during node processing)

#### 5. Disabled Watchdog Redux Dispatches (GoJSApp.tsx ~line 6017-6067)
Watchdog is now completely disabled. Position was already dispatched at end of SelectionMoved, and watchdog dispatches caused infinite loops. The merge function with locks is sufficient to protect positions.

#### 6. Removed Forced Array Reference Change (GoJSApp.tsx ~line 6148)
Disabled `myGoModel.nodes = [...myGoModel.nodes]` which was causing visual flicker by triggering extra React re-renders. Locks are sufficient without forcing updates.

#### 7. Locks Must Use Global Storage (GoJSApp.tsx ~lines 75-80, 280-285, 4085+, 4675+)
**CRITICAL ROOT CAUSE:** Locks were being stored on the diagram instance (`myDiagram.__lockMovedNodeLocByKey`), but the diagram reference changes during React re-renders and focus changes! When you switched apps to take a screenshot, React component updated, `this.state?.myMetis?.myDiagram` became a different reference, and locks were lost.

**The flow:**
1. SelectionMoved sets locks on `e.diagram` (event diagram) ✅
2. User switches apps (screenshot, paste) → triggers focus change
3. React re-renders, `componentDidUpdate` runs
4. Merge function called with `this.state?.myMetis?.myDiagram` ❌ (different instance!)
5. Locks not found → position swaps back

**Fix:** Created **module-level global Maps** (`globalPreserveNodeStateByKey`, `globalLockMovedNodeLocByKey`) that survive:
- React re-renders
- Component state updates
- Focus changes (switching apps)
- Diagram instance changes

Merge function and SelectionMoved handler now both use the same global Maps, ensuring locks persist across all operations.

**Also includes:**
- Merge function actually uses locked positions (fix #7a)
- Extended lock duration: 15s preserve / 12s lock (from 5s/3.5s)

### Expected Behavior
With these fixes:
1. ✅ Container grab works when moved over nodes
2. ✅ Nodes don't swap back on second/subsequent moves  
3. ✅ Groups don't swap back on second/subsequent moves
4. ✅ No visual flicker during moves
5. ✅ No infinite console loops
6. ✅ Nodes inside containers don't swap back on second/subsequent moves
7. ✅ Locks survive React re-renders and focus changes (module-level global storage)

### Testing Verified
- [x] First move of Container - stays in place
- [x] Second+ moves of Container - stays in place
- [x] First move of regular node - stays in place
- [x] Second+ moves of regular node - stays in place
- [x] No visual flicker
- [x] Container grabs nodes when moved over them (Q1 issue resolved)
- [x] Nodes inside containers - first move stays in place
- [x] Nodes inside containers - second+ moves stay in place
- [x] Rapid sequential moves (inside and outside containers)

