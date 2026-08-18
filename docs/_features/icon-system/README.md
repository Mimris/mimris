# Icon System Documentation

Complete documentation for the icon system feature, including emoji icons, SVG icons, Unicode characters, and the icon selection modal interface.

## Feature Overview

The icon system provides three types of icons for use in diagrams:

1. **Emoji Icons** - Unicode emoji characters with proper persistence and rendering
2. **SVG Icons** - Custom SVG graphics with integrated editor support
3. **Unicode Characters** - Any Unicode character for specialized use cases

## Documentation Index

### Core Implementation

- **[emoji-icons.md](./emoji-icons.md)** - Emoji icon system implementation and bug fixes
- **[emoji-icons-testing.md](./emoji-icons-testing.md)** - Testing procedures and validation
- **[emoji-icons-verified.md](./emoji-icons-verified.md)** - Status verification document

### SVG Support

- **[svg-icons.md](./svg-icons.md)** - SVG icon system feature overview
- **[svg-icons-quickstart.md](./svg-icons-quickstart.md)** - Quick start guide for users
- **[svg-icons-complete.md](./svg-icons-complete.md)** - Complete implementation details
- **[svg-editor-integration.md](./svg-editor-integration.md)** - Integrated SVG editors (Blob Maker, Method Draw, Figma)

### Unicode Support

- **[unicode-characters.md](./unicode-characters.md)** - Unicode character support in the icon system
- **[unicode-implementation.md](./unicode-implementation.md)** - Technical implementation details

### Icon Modal Interface

- **[icon-modal.md](./icon-modal.md)** - Icon format detection and selection
- **[icon-modal-implementation.md](./icon-modal-implementation.md)** - Implementation of the tabbed modal interface
- **[icon-menu-update.md](./icon-menu-update.md)** - Icon menu updates and integrations
- **[icon-submenu-implementation.md](./icon-submenu-implementation.md)** - Submenu implementation details

## Key Files Modified

### `/src/components/modals/ChangeIconModal.tsx`

The main icon selection modal with tabs for:

- Library Icons
- Shapes
- URL Icons
- Unicode Characters
- SVG Icons (with live preview and editor buttons)

### `/src/akmm/ui_templates.ts`

Core icon handling functions:

- `detectIconFormat()` - Identifies icon type
- `getIconSource()` - Converts icons to SVG data URLs
- `forceUpdateAllIconSources()` - Ensures icons render correctly after reload

### `/src/components/gojs/components/Diagram.tsx`

GoJS diagram integration:

- `InitialLayoutCompleted` listener
- Manual icon source update on reload

## Quick Start for Users

### Using Emoji Icons

1. Open the icon selector and click the "Unicode" tab
2. Enter the emoji code (e.g., `\U0001F389` for party popper)
3. Click "Apply" or "Use"
4. The emoji will persist through page reloads

### Using SVG Icons

1. Open the icon selector and click the "SVG" tab
2. Either:
   - Paste your own SVG code in the textarea
   - Use one of the editor buttons: Blob Maker, Method Draw, or Figma
3. The preview shows how it will appear (50% scaled in modal, full size in diagram)
4. Click "Apply" or "Use"
5. The SVG is stored as a base64 data URL

### Using Unicode Characters

1. Open the icon selector and click the "Unicode" tab
2. Enter the Unicode code point (e.g., `\u2764` for heart)
3. The preview shows the character
4. Click "Apply" or "Use"

## Format Reference

### Emoji Format

```text
\UXXXXXXXX  (8 hex digits after backslash)
Examples:
\U0001F389  (party popper 🎉)
\U0001F60A  (smiling face 😊)
\U0001F4A5  (collision 💥)
```

### SVG Format

```text
data:image/svg+xml;base64,[base64-encoded-svg]
Or raw SVG code pasted in the tab
```

### Unicode Format

```text
\uXXXX  (4 hex digits after backslash)
Examples:
\u2764  (heart ❤️)
\u2728  (sparkles ✨)
\u263C  (sun ☼)
```

## Technical Architecture

### Icon Detection Flow

1. `detectIconFormat()` analyzes the icon string
2. Returns type: 'emoji', 'svg', 'url', 'shape', or 'library'

### Icon Rendering Flow

1. `getIconSource()` converts icon to SVG data URL
2. GoJS binding displays the SVG
3. On page reload, `forceUpdateAllIconSources()` re-triggers rendering

### SVG Sizing

- Auto-inject width/height attributes (50x50 default recommended)
- Scale by 0.5 in modal preview
- Full size in diagram (50x50 renders appropriately in GoJS nodes)

## Known Issues & Fixes

### Emoji Icons Not Persisting (FIXED)

**Problem**: Emoji icons disappeared after page reload
**Root Cause**: GoJS bindings don't re-evaluate after Redux restore
**Solution**: Manual `forceUpdateAllIconSources()` function triggered on `InitialLayoutCompleted`

### SVG Preview Too Large (FIXED)

**Problem**: SVG preview took up most of modal
**Solution**: Added `scale(0.5)` CSS transform to preview container

### SVG Icons Wrong Size in Diagram (FIXED)

**Problem**: SVG icons appeared too small or too large
**Solution**: Auto-inject width/height attributes with sensible defaults (50x50)

## Contributing

When making changes to the icon system:

1. Update relevant documentation in this folder
2. Test with all three icon types
3. Verify persistence through page reload
4. Update this README if adding new features

## Related Documentation

- See [../../_guides/system-architecture.md](../../_guides/system-architecture.md) for overall system architecture
- See [../../_community/contributing.md](../../_community/contributing.md) for contribution guidelines
