# Objectview and Relshipview Attribute Inheritance Pattern

## Overview

Implements a **delta-only storage pattern** for objectview and relshipview attributes, where visual properties inherit from their typeview by default and are only stored when explicitly overridden by the user.

## Principle

- **Display**: View attributes resolve to `view.attribute || typeview.attribute`
- **Storage**: Only write to view attributes when user explicitly changes a value
- **Reset**: Delete a view attribute to restore the typeview default

## Benefits

1. **Data efficiency**: Smaller JSON payloads, reduced redundancy
2. **Template propagation**: Update typeview → all non-overridden views update automatically
3. **Clear intent**: Stored attributes explicitly signal "user customized this"
4. **Maintainability**: Single source of truth for defaults

## Implementation

### 1. Metamodeller Class Methods (src/akmm/metamodeller.ts)

Added to `cxObjectView` and `cxRelationshipView` classes:

```typescript
/**
 * Resolve an attribute value: returns view value if set, 
 * otherwise falls back to typeview default.
 */
resolveAttribute(attrName: string): { value: any; isInherited: boolean }

/**
 * Set an attribute value with automatic delta storage.
 * If value matches typeview default, removes the override.
 */
setAttributeWithDelta(attrName: string, value: any): void
```

### 2. JSON Serialization (src/akmm/ui_json.ts)

**Deep integration** in `jsnObjectView` and `jsnRelshipView` constructors:

- Delta-only logic applied at serialization time (when converting to JSON)
- Only stores visual attributes that differ from typeview defaults
- Core attributes (id, name, loc, refs) always stored
- Visual attributes (fillcolor, strokecolor, template, etc.) stored only when different
- **Result**: All JSON exports automatically use delta-only storage

Visual attributes filtered:
- **Objectview**: template, figure, geometry, colors, stroke, text, icons, scale values
- **Relshipview**: template, colors, arrows, stroke, text, scale values

### 3. Visual Indicators (src/components/gojs/components/InspectorRow.tsx)

- Added `isInherited` prop to InspectorRow interface
- Inherited values displayed in **italic font** with reduced opacity (0.8)
- Applies to text inputs, textareas, and select dropdowns
- Works for both objectviews and relshipviews

### 4. Modal Dialog Delta Storage (src/akmm/ui_modal.ts)

Helper function `applyDeltaStorage()`:

- Filters view data before dispatch to Redux
- Removes attributes that match typeview defaults
- Removes empty attributes when typeview has a value (allows inheritance)

Applied to:
- `UPDATE_OBJECTVIEW_PROPERTIES` dispatches
- `UPDATE_RELSHIPVIEW_PROPERTIES` dispatches

### 5. Attribute Resolution in Templates (src/akmm/ui_common.ts)

Updated `setObjviewAttributes()` and `setRelviewAttributes()`:

- Resolve attributes with fallback logic: `view[attr] || typeview[attr]`
- Apply resolved values to GoJS diagram data
- Ensures visual rendering reflects inherited values

## Behavior

## Behavior

### When Data is Saved or Exported

**Automatic cleanup on every save**: The delta-only storage logic runs whenever data is serialized to JSON:
- File save operations (Save, Save As, Export)
- GitHub sync operations
- Model template exports
- Any `jsnExportMetis` serialization

This means:
- **Existing redundant data is cleaned up** on next save
- **All future saves** automatically use minimal storage
- **No migration needed** - cleanup happens organically
- **Applies to both objectviews and relshipviews**

### When User Edits an Attribute

1. **Value matches typeview default**: Attribute is removed from view (automatic reset)
2. **Value differs from typeview**: Attribute is stored in view
3. **Value is empty and typeview has value**: Attribute removed (inherited)

### Visual Feedback

- **Normal font**: Value is stored in view (overridden)
- **Italic font**: Value is inherited from typeview (not stored)

### Data Structure

**Before** (redundant storage):
```json
{
  "objectview": {
    "id": "123",
    "fillcolor": "white",  // Same as typeview
    "strokecolor": "black"  // Same as typeview
  },
  "typeview": {
    "fillcolor": "white",
    "strokecolor": "black"
  }
}
```

**After** (delta-only storage):
```json
{
  "objectview": {
    "id": "123"
    // No color attributes - inherited from typeview
  },
  "typeview": {
    "fillcolor": "white",
    "strokecolor": "black"
  }
}
```

**With Override**:
```json
{
  "objectview": {
    "id": "123",
    "fillcolor": "red"  // Only override stored
  },
  "typeview": {
    "fillcolor": "white",
    "strokecolor": "black"
  }
}
```

**Relshipview Example**:
```json
{
  "relshipview": {
    "id": "456",
    "strokecolor": "blue"  // Only custom color stored
    // arrowscale, textscale inherited from typeview
  },
  "typeview": {
    "strokecolor": "black",
    "arrowscale": 1.0,
    "textscale": 1.0
  }
}
```

## Visual Attributes Affected

### Objectviews
- Colors: `fillcolor`, `fillcolor2`, `strokecolor`, `strokecolor2`, `textcolor`, `textcolor2`
- Sizes: `strokewidth`, `textscale`, `memberscale`, `arrowscale`, `scale`
- Shapes: `icon`, `icon1`, `icon2`, `icon3`, `image`, `figure`, `geometry`
- Templates: `template`, `template2`, `groupLayout`

### Relshipviews
- Colors: `strokecolor`, `textcolor`, `fromArrowColor`, `toArrowColor`
- Sizes: `strokewidth`, `textscale`, `arrowscale`
- Arrows: `fromArrow`, `toArrow`, `dash`
- Templates: `template`, `template2`, `routing`, `curve`, `corner`

## Edge Cases Handled

1. **Typeview attribute deleted**: View overrides persist (become custom attributes)
2. **Typeview attribute value changes**: Non-overridden views automatically update
3. **User sets value equal to typeview**: Override is removed (automatic optimization)
4. **Views without typeviews**: All attributes stored normally

## Testing

1. **Create objectview/relshipview** from typeview → Verify empty properties not stored in JSON
2. **Edit view attribute** to match typeview → Verify attribute removed from JSON on save
3. **Edit view attribute** to differ → Verify only that attribute stored
4. **Change typeview attribute** → Verify non-overridden views update visually
5. **Inspect view properties** → Verify inherited values show in italic
6. **Save model** → Verify JSON file size reduced compared to previous version

To verify implementation:

1. Open objectview properties dialog
2. Check that inherited values appear in italic
3. Modify an attribute → saves to JSON
4. Set attribute back to typeview value → removed from JSON
5. Update typeview attribute → non-overridden objectviews update automatically

## Future Enhancements

Potential improvements:

- Add "Reset to default" button in UI for explicit resets
- Visual indicator showing which typeview provides the inherited value
- Migration script to clean up existing redundant data
- Extend pattern to relshipviews and other view classes

## Configuration

No configuration needed. The pattern is:

- **Automatic**: Values matching typeview defaults are removed automatically
- **No custom attributes**: Objectview attributes must exist in typeview (enforced)
- **Always italic**: Inherited values always shown in italic

## Related Files

- `/Users/dagrojahnkarlsen/github/mimris/src/akmm/metamodeller.ts` - Resolution methods
- `/Users/dagrojahnkarlsen/github/mimris/src/components/gojs/components/InspectorRow.tsx` - Visual indicators
- `/Users/dagrojahnkarlsen/github/mimris/src/components/gojs/components/SelectionInspector.tsx` - Inheritance detection
- `/Users/dagrojahnkarlsen/github/mimris/src/akmm/ui_modal.ts` - Delta storage logic
- `/Users/dagrojahnkarlsen/github/mimris/src/akmm/ui_common.ts` - Template resolution
- `/Users/dagrojahnkarlsen/github/mimris/src/reducers/reducer.js` - Redux state management
