# Unicode Characters Tab - Feature Addition

## Summary
Added a fourth tab to the "Change Icon" modal for selecting Unicode characters. Users can now choose from 160+ Unicode symbols organized by category.

## New Tab: Unicode

### Categories Included

1. **Arrows** (20 chars)
   - Directional arrows: ←, →, ↑, ↓, ↖, ↗, ↘, ↙, ⬅, ➡, ⬆, ⬇, ↔, ↕, ⟵, ⟶, ⟷, ⟸, ⟹, ⟺

2. **Symbols** (20 chars)
   - Star, checkmark, X, diamonds, circles: ★, ☆, ✓, ✗, ✘, ◆, ◇, ○, ●, ◎, ◉, ⊕, ⊖, ⊗, ⊙, ⊚, ⊛, ⊜, ⊝, ⊞

3. **Shapes** (20 chars)
   - Geometric shapes: ▲, ▼, ◀, ▶, ◆, ▪, ▫, ▯, ▢, ▣, ▤, ▥, ▦, ▧, ▨, ▩, ▬, ▭, ▮, ▯

4. **Math** (20 chars)
   - Mathematical symbols: ±, ×, ÷, ≈, ≠, ≤, ≥, <, >, ∑, ∏, √, ∞, ∫, ∂, ∇, π, °, ∠, ⊥

5. **Misc** (20 chars)
   - Copyright, currency, etc: ©, ®, ™, €, ¥, £, ¢, §, ¶, †, ‡, •, ◦, ‣, ․, ‥, …, ′, ″, ‴

6. **Zodiac** (20 chars)
   - Zodiac signs and planets: ♈, ♉, ♊, ♋, ♌, ♍, ♎, ♏, ♐, ♑, ♒, ♓, ☿, ♀, ♂, ♃, ♄, ♅, ♆, ♇

7. **Chess** (16 chars)
   - Chess pieces (white & black): ♔, ♕, ♖, ♗, ♘, ♙, ♚, ♛, ♜, ♝, ♞, ♟, ♠, ♣, ♥, ♦

**Total**: 160+ Unicode characters across 7 categories

## Implementation Details

### Files Modified

1. **src/components/gojs/components/Diagram.tsx**
   - Added 4th tab: `{ tabName: 'Unicode' }` to selpropgroup (Line 8950)
   - Created `renderUnicode()` function with categorized character grid (Lines 9079-9130)
   - Updated `renderTabContent()` switch to handle case '3' for Unicode tab (Line 9155)

2. **src/akmm/ui_modal.ts**
   - Added `isUnicode` flag detection in "Change Icon" handler (Line 205)
   - Sets `unicode` property when Unicode character selected (Lines 236, 243, 258, 262)
   - Clears other icon properties to ensure only one type is active (Lines 237-239, 244-246, 259-261, 264-266)
   - Persists to backend via `UPDATE_OBJECTVIEW_PROPERTIES` and `UPDATE_OBJECTTYPEVIEW_PROPERTIES` dispatch

### Data Properties

Now supports four icon type properties on node data:

| Property | Type | Example |
|----------|------|---------|
| `icon` | Icon library name | `"box"`, `"star"` |
| `figure` | GoJS shape name | `"Rectangle"`, `"Triangle"` |
| `iconUrl` | External image URL | `"https://example.com/icon.png"` |
| `unicode` | Single Unicode character | `"★"`, `"→"`, `"♔"` |

**Behavior**: Setting one property automatically clears the others to ensure clean state.

### UI Features

- **Categorized Display**: Characters grouped by semantic type
- **Hover Effects**: Light gray background on hover for visual feedback
- **Unicode Info**: Tooltip shows Unicode code point (e.g., "U+2605" for ★)
- **Responsive Grid**: Auto-fills grid layout based on available width
- **Auto-Close**: Modal closes after character selection
- **Scrollable**: Category list scrolls if needed

### Example Usage

User workflow:
1. Right-click on object → "Change Icon" 
2. Click "Unicode" tab
3. Browse or search category
4. Click character (e.g., ★)
5. Character applied immediately
6. Modal closes
7. Node displays Unicode character
8. Changes persisted to backend

## Technical Details

### Unicode Character Selection
Characters are stored as single UTF-8 characters in the `unicode` property. The rendering system displays them using the browser's font rendering at 24px size.

### Rendering
Characters render as text nodes in GoJS templates using the `unicode` property:
```typescript
if (node.unicode) {
  // Display unicode character
  textShape.text = node.unicode;
}
```

### Persistence
All Unicode selections are saved through the standard backend dispatch system:
```typescript
myMetis.myDiagram.dispatch({ 
  type: 'UPDATE_OBJECTVIEW_PROPERTIES', 
  data: { unicode: selectedCharacter }
})
```

## Future Enhancement Ideas

- Custom Unicode input field for any UTF-8 character
- Search/filter by Unicode name (requires Unicode database)
- Recently used characters quick-access
- User-defined Unicode favorites
- Font selector for Unicode rendering style
- Emoji support (if Unicode extended)
- Copy-paste Unicode support

## Build Status
✅ **Build successful** - No errors

## Testing Checklist

- [ ] Open "Change Icon" modal
- [ ] Click "Unicode" tab
- [ ] Verify all 7 categories display
- [ ] Verify hover effects work
- [ ] Verify Unicode character tooltip shows code point
- [ ] Click a character and verify it applies to node
- [ ] Modal closes after selection
- [ ] Node displays selected Unicode character
- [ ] Reload page and verify character persists
- [ ] Test with multiple selected objects
- [ ] Test with both objects and object types
