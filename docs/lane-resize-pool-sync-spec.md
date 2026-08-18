 # Lane Resize Pool Synchronization Specification

## Goal
When a user drags the right edge of a lane to resize it, both lanes should resize together and the pool should expand/contract to match, while keeping the left gray area (pool header + lane headers) fixed and visible.

## Current Structure
- **Pool**: Table panel with 2 columns
  - Column 0: Pool header (gray vertical bar with "Pool" text, rotated 270°) - **MUST STAY FIXED at 40px width**
  - Column 1: Placeholder containing lanes
- **Lane**: Horizontal panel with 2 parts
  - Lane HEADER: Gray area with rotated text "Lane 1"/"Lane 2" (270°) - part of the fixed left gray area
  - Lane SHAPE: Resizable white background area (this is what `resizeObjectName="SHAPE"` refers to)

## Desired Behavior When Dragging Lane Right Edge

### 1. Lane Resize
- User drags the right edge (blue handle) of any lane
- The lane SHAPE (white area) width changes to match the drag
- **ALL lanes** in the pool should resize to the **same width** (synchronized)
- Lane total width = Lane HEADER width + Lane SHAPE width

### 2. Pool Resize  
- Pool should automatically expand or contract to match the lanes
- **Pool header (40px gray vertical bar with "Pool" text) MUST STAY FIXED** - never grow, shrink, or move
- **Lane headers (gray areas with "Lane 1"/"Lane 2" text) MUST STAY VISIBLE** - never disappear
- **The entire left gray area (pool header + lane headers) must remain stable and visible at all times**
- Pool's **right edge** should align **exactly** with the lanes' right edges

### 3. Position Stability
- **Pool position (top-left corner) must NEVER move** during resize
- **Pool header must NEVER disappear** or be cut off on the left
- Lanes should stay in their vertical positions within the pool

### 4. Persistence
- All size changes should be saved to `data.size` in the model
- Changes should persist through page reload

## Visual Requirements

```
Before resize:
┌────┬────────────────────────┐
│Pool│Lane1│     SHAPE         │  ← Left gray area stays visible
├────┼─────┴───────────────────┤
│    │Lane2│     SHAPE         │
└────┴─────┴───────────────────┘
 40px  Lane headers + white areas
 ^
 FIXED - never changes

After dragging right edge to expand:
┌────┬───────────────────────────────┐
│Pool│Lane1│     SHAPE (wider)        │  ← Left gray still visible and same size
├────┼─────┴────────────────────────────┤  ← Pool right edge aligns with lane right
│    │Lane2│     SHAPE (wider)        │
└────┴─────┴────────────────────────────┘
 40px  Lane headers + white areas (expanded)
 ^
 STILL FIXED - same as before

After dragging right edge to contract:
┌────┬────────────────┐
│Pool│Lane1│  SHAPE   │  ← Left gray STILL visible and same size
├────┼─────┴──────────┤  ← Pool right edge aligns with lane right
│    │Lane2│  SHAPE   │
└────┴─────┴──────────┘
 40px  Lane headers + white areas (contracted)
 ^
 STILL FIXED - never disappeared
```

## Critical Requirements (Must Never Happen)
❌ **Pool header growing from 40px to larger sizes** (Screenshot 2 shows this bug)
❌ **Pool header disappearing or being cut off on the left side** (Screenshot 4 shows this bug)
❌ **Gray area expanding to the left** (Screenshot 2 shows this bug)
❌ **Pool right edge extending beyond lane right edges**
❌ **Pool right edge stopping short of lane right edges** (Screenshot 3 shows this bug)
❌ **Pool moving/jumping position during resize**
❌ **Lanes becoming different widths from each other**

## Success Criteria
✅ Pool header stays exactly 40px wide and fully visible at all times
✅ Lane headers stay visible at all times
✅ Entire left gray area (pool + lane headers) stays fixed in size and position
✅ Pool right edge exactly aligns with lane right edges
✅ Both lanes stay the same width (synchronized)
✅ Pool never moves from its position
✅ No parts of pool header or lane headers get cut off
✅ Sizes persist through reload

## Current Bugs (from screenshots)
1. **Screenshot 2**: When expanding lanes, pool header gray area expands to the left (should stay 40px)
2. **Screenshot 3**: Pool right edge doesn't reach lane right edges (pool too narrow)
3. **Screenshot 4**: When contracting lanes, pool header disappears on left side (unacceptable!)

## Root Cause Hypothesis
The Table panel is recalculating column widths PROPORTIONALLY when pool.data.size changes, instead of keeping column 0 fixed at 40px. The RowColumnDefinition with `sizing: go.RowColumnDefinition.None` is being overridden.
