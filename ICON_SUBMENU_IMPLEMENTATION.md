# Change Icon Submenu Implementation

## Overview
A comprehensive "Change Icon" submenu system has been implemented that allows users to switch between three different icon types:
1. **Icon Library** - Preset icons from the icon library
2. **Built-in Shapes** - GoJS native shapes (figures)
3. **Custom Image URLs** - External image URLs

---

## Features Implemented

### 1. **Icon Type Selection** - Three Independent Paths

#### A. Icon Library (Presets)
- Opens the icon selection modal with all available preset icons
- Same functionality as the original "Change Icon" feature
- User can browse and select from predefined icon library

#### B. Built-in Shapes - Multi-Level Nested Submenus
```
Built-in Shapes
├── Basic Shapes
│   ├── Rectangle
│   ├── Circle
│   ├── Ellipse
│   ├── Triangle
│   ├── Diamond
│   ├── Pentagon
│   ├── Hexagon
│   └── Star
├── Arrows
│   ├── Arrow Left (TriangleLeft)
│   ├── Arrow Right (TriangleRight)
│   ├── Arrow Up (TriangleUp)
│   └── Arrow Down (TriangleDown)
├── Symbols
│   ├── Plus
│   ├── Minus
│   ├── XLine
│   ├── LineH
│   └── LineV
└── Database Shapes
    ├── Database
    ├── Cylinder
    └── Cone
```

#### C. Custom Image URL
- Prompts user to enter an image URL
- Validates and applies the URL as custom icon source
- Persists custom URL to the objectview data

#### D. Clear Icon
- Removes all icon types (preset icon, figure, and custom URL)
- Only enabled when at least one icon type is set

---

## Implementation Details

### Helper Function: `applyIconType()`
Located near other icon handlers (line ~4573), this function:

```typescript
const applyIconType = (diagram: go.Diagram, part: go.Part, iconType: 'icon' | 'figure' | 'custom' | 'none', value: any) => {
  // Parameters:
  // - diagram: GoJS diagram instance
  // - part: the node/object being edited
  // - iconType: 'icon' | 'figure' | 'custom' | 'none'
  // - value: the icon name, figure name, or URL
}
```

**What it does:**
1. ✅ Clears all previous icon types (icon, figure, iconUrl)
2. ✅ Sets the new icon type with the provided value
3. ✅ Updates the GoJS model with `startTransaction/commitTransaction`
4. ✅ Calls `diagram.requestUpdate()` to refresh visuals
5. ✅ Updates the objectview backend data
6. ✅ Dispatches `UPDATE_OBJECTVIEW_PROPERTIES` to persist changes

### Data Model Properties

The system uses these properties on nodeData:

```typescript
{
  icon?: string;        // Preset icon name (e.g., "Activity", "Decision")
  figure?: string;      // GoJS figure name (e.g., "Circle", "Diamond")
  iconUrl?: string;     // Custom image URL
  iconType?: string;    // (Optional) type indicator: 'icon' | 'figure' | 'custom'
}
```

---

## Where the Menu is Accessible

### 1. **Full Menu Context** (Right-click object)
- Right-click → Objectview… → Change Icon
- Full submenu with all options available

### 2. **Icon-Only Menu** (Right-click directly on icon)
- Right-click on the icon/picture element
- Same submenu structure appears
- Fewer menu items overall (just Change Icon + Set Icon Colors)

---

## User Workflow Examples

### Changing to a Built-in Shape
1. Right-click object
2. Objectview… → Change Icon
3. Built-in Shapes → Basic Shapes → Circle ✓
4. Node now displays as a circle

### Using a Custom Image
1. Right-click object
2. Objectview… → Change Icon
3. Custom Image URL
4. Enter URL: `https://example.com/my-icon.png`
5. Node updates with custom image

### Switching Between Icon Types
- User can freely switch between icon library, shapes, and custom URLs
- Switching automatically clears previous type and applies new type
- No conflicts or layering of icon types

### Clearing an Icon
1. Right-click object
2. Objectview… → Change Icon
3. Clear Icon
4. Icon removed (reverts to text-only or shape-only display)

---

## Technical Benefits

✅ **Cascading Submenu Structure**
- Integrates seamlessly with existing `showSubMenu()` system
- No modal dialogs needed
- Fits existing context menu architecture

✅ **Atomic Updates**
- All three icon types managed through single `applyIconType()` function
- Prevents conflicts between icon types
- Transaction-based for consistency

✅ **Backend Persistence**
- Dispatches `UPDATE_OBJECTVIEW_PROPERTIES` for each change
- Automatically persisted to database
- Objectview data always in sync with GoJS model

✅ **Smart Clearing**
- "Clear Icon" button only enabled when needed
- Single-click clearing of all icon types

---

## Code Changes

### File Modified
`/Users/snorrefossland/GitHub/mimris/src/components/gojs/components/Diagram.tsx`

### Changes Made

1. **Added `applyIconType()` function** (~57 lines)
   - Helper to apply icon types and persist to backend
   - Handles icon, figure, custom URL, and clear operations

2. **Enhanced "Change Icon" in Objectview menu** (~55 lines)
   - Changed from simple modal trigger to cascading submenu
   - Added all three icon type paths
   - Added Clear Icon option

3. **Enhanced "Change Icon" in Icon-only menu** (~55 lines)
   - Same cascading submenu as Objectview menu
   - Maintains consistency across both menu contexts

---

## GoJS Figures Included

The "Built-in Shapes" submenu includes commonly used GoJS figures:

**Basic:** Rectangle, Circle, Ellipse, Triangle, Diamond, Pentagon, Hexagon, Star
**Arrows:** TriangleLeft, TriangleRight, TriangleUp, TriangleDown
**Symbols:** Plus, Minus, XLine, LineH, LineV
**Database:** Database, Cylinder, Cone

Additional figures can be easily added by following the same pattern:
```typescript
{ label: "Figure Name", action: (diagram) => applyIconType(diagram, part, 'figure', 'FigureName') }
```

---

## Future Enhancements

Possible improvements that could be added:

1. **Shape Preview** - Show preview of selected shape before applying
2. **Custom URL Validation** - Validate URL before applying
3. **Favorites/Recents** - Quick access to recently used icons/shapes
4. **Search Filter** - Search through available shapes
5. **Color Tinting** - Apply color to built-in shapes
6. **Size Adjustment** - Menu to adjust icon/shape size
7. **Import Custom Shapes** - Allow uploading custom SVG shapes

---

## Testing Checklist

- [ ] Right-click object → Objectview… → Change Icon displays submenu
- [ ] Icon Library option opens icon selection modal
- [ ] Built-in Shapes submenu expands with categories
- [ ] Selecting a shape updates node visual immediately
- [ ] Custom Image URL prompt accepts and applies URLs
- [ ] Clear Icon removes all icon types
- [ ] Right-click icon → Change Icon shows same submenu
- [ ] Visual updates persist after page reload
- [ ] Backend receives UPDATE_OBJECTVIEW_PROPERTIES dispatch
- [ ] Switching between icon types works smoothly

---

## Notes

- The `applyIconType()` function is defensive - it wraps all model updates in try-catch blocks
- Previous icon types are always cleared before applying new type (no conflicts)
- The implementation follows existing patterns in the codebase for consistency
- All changes work with the existing context menu system (no additional dependencies)
