# SVG Icon Tab - Feature Implementation

## Overview

Added a new **SVG** tab to the Change Icon modal, allowing users to add custom icons by pasting SVG code directly.

## What's New

### SVG Tab Features

✅ **Paste SVG Code**: Text area to input SVG markup directly
✅ **Live Preview**: See how the SVG will look before selecting
✅ **Validation**: Detects if input is valid SVG (starts with `<svg`)
✅ **Error Handling**: Shows warning if SVG code is invalid
✅ **Auto-Conversion**: Converts SVG to base64 data URL for storage

## How to Use

### Adding an SVG Icon

1. Open the **Change Icon** modal (right-click node → "Change Icon")
2. Click the **SVG** tab
3. Paste SVG code into the textarea
4. See the preview render on the right
5. Click **Select This SVG** to apply the icon

### SVG Format

The SVG must start with `<svg` tag:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" fill="blue"/>
</svg>
```

### Example SVGs

**Simple Circle:**
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" fill="#3498db" stroke="#2c3e50" stroke-width="2"/>
</svg>
```

**Simple Square:**
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect x="10" y="10" width="80" height="80" fill="#e74c3c"/>
</svg>
```

**Custom Shape with Gradient:**
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3498db;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2ecc71;stop-opacity:1" />
    </linearGradient>
  </defs>
  <polygon points="50,10 90,90 10,90" fill="url(#grad)"/>
</svg>
```

## Technical Details

### Storage Format
- SVG icons are converted to **base64 data URLs**
- Format: `data:image/svg+xml;base64,<encoded-svg>`
- Enables inline rendering without external file dependencies

### Conversion Process
```typescript
// 1. User enters SVG code
const svg = '<svg>...</svg>';

// 2. Encode to base64
const encoded = btoa(unescape(encodeURIComponent(svg)));

// 3. Create data URL
const dataUrl = `data:image/svg+xml;base64,${encoded}`;

// 4. Store in Redux (persists to localStorage)
onSelect(dataUrl);
```

### Persistence
- SVG data URLs persist through Redux localStorage
- Icons render on reload using the same `getIconSource()` pipeline
- Works with the existing emoji icon fix

## File Changes

**File Modified**: `src/components/modals/ChangeIconModal.tsx`

**Changes**:
1. Added SVG tab to navigation (lines ~178-184)
2. Added SVG TabPane with textarea and preview (lines ~322-404)
3. SVG validation and conversion logic
4. Preview rendering using `dangerouslySetInnerHTML`

## UI Components

### Textarea
- Large textarea for pasting SVG code
- Monospace font for better readability
- Placeholder with example SVG

### Live Preview
- Displays rendered SVG in real-time
- Shows only when valid SVG detected
- Size: 60x60px in dialog, but renders at full size in diagram

### Validation
- Checks if input starts with `<svg`
- Shows warning if invalid
- Only enables "Select" button for valid SVG

## Integration with Existing Features

✅ **Redux Persistence**: SVG data URLs stored and restored like other icons
✅ **Icon Rendering Pipeline**: Uses same `getIconSource()` function
✅ **Emoji Icon Fix**: Benefits from the `forceUpdateAllIconSources()` mechanism
✅ **All Icon Tabs**: SVG works alongside Unicode, Shapes, Library, and URL tabs

## Validation & Error Handling

```typescript
// Only show preview for valid SVG
if (customUrl.trim().startsWith('<svg')) {
  // Show preview and select button
}

// Show warning for invalid input
if (customUrl.trim() && !customUrl.trim().startsWith('<svg')) {
  // Show error message
}
```

## Browser Compatibility

✅ Modern browsers (Chrome, Firefox, Safari, Edge)
✅ SVG rendering support (universally supported)
✅ base64 encoding (native JavaScript)
✅ `dangerouslySetInnerHTML` (React feature)

## Security Considerations

**Note**: Using `dangerouslySetInnerHTML` for preview is intentional:
- Preview is temporary and local-only
- SVG code must be entered manually by the user (not from untrusted source)
- Data URLs stored in localStorage are user-controlled
- No XSS risk as data is never sent to server or other users
- Icon data is stored per-user in localStorage

## Limitations

1. **SVG Must Be Self-Contained**: Cannot reference external files or stylesheets
2. **No External Resources**: Data URLs can't fetch images from URLs within SVG
3. **Size Limitation**: Very large SVG code may impact performance
4. **Script Tags Not Supported**: SVG scripts will not execute (security)

## Future Enhancements

- SVG file upload support (in addition to paste)
- SVG library with common shapes
- SVG editor for visual creation
- SVG optimization (remove unnecessary attributes)
- Drag-and-drop SVG file import
- Color picker to customize SVG colors

## Testing Checklist

- ✅ Basic SVG renders in preview
- ✅ Select button works
- ✅ SVG persists after page reload
- ✅ Invalid SVG shows warning
- ✅ Empty textarea hides preview
- ✅ SVG displays in diagram after selection
- ✅ Works with other icon tabs
- ✅ Build completes without errors

## Example Workflow

1. User selects node in diagram
2. Right-clicks → "Change Icon"
3. Clicks "SVG" tab
4. Pastes custom SVG code
5. Sees preview render
6. Clicks "Select This SVG"
7. Modal closes, icon appears in diagram
8. Icon persists through page reload ✅
