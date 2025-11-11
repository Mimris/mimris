# SVG Icon Tab - Quick Start Guide

## 🎨 Adding SVG Icons to Your Diagram

### Step 1: Open Change Icon Modal
Right-click on any node in the diagram → Select "Change Icon"

### Step 2: Navigate to SVG Tab
Click the **SVG** tab in the modal header

### Step 3: Paste Your SVG Code
Copy and paste SVG code into the textarea:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" fill="#3498db"/>
</svg>
```

### Step 4: Preview Your Icon
- Live preview displays on the right
- Shows exactly how it will look in the diagram
- Updates as you type

### Step 5: Select Your Icon
Click "Select This SVG" button to apply the icon

---

## 📋 Simple SVG Examples

### Colored Circle
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" fill="#e74c3c"/>
</svg>
```

### Filled Square with Border
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect x="15" y="15" width="70" height="70" fill="#3498db" stroke="#2c3e50" stroke-width="2"/>
</svg>
```

### Triangle
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <polygon points="50,10 90,90 10,90" fill="#2ecc71"/>
</svg>
```

### Star
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <polygon points="50,10 61,40 93,40 68,60 79,90 50,70 21,90 32,60 7,40 39,40" fill="#f39c12"/>
</svg>
```

### Diamond with Gradient
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#9b59b6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3498db;stop-opacity:1" />
    </linearGradient>
  </defs>
  <polygon points="50,10 90,50 50,90 10,50" fill="url(#grad1)"/>
</svg>
```

### Hexagon
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="#16a085"/>
</svg>
```

### Circle with Icon (Checkmark)
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="45" fill="#27ae60" stroke="#229954" stroke-width="2"/>
  <polyline points="30,50 45,65 70,35" stroke="white" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

### Process Icon
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect x="10" y="25" width="25" height="25" fill="#3498db" stroke="#2c3e50" stroke-width="1" rx="2"/>
  <rect x="50" y="25" width="25" height="25" fill="#e74c3c" stroke="#2c3e50" stroke-width="1" rx="2"/>
  <path d="M 35 37.5 L 50 37.5" stroke="#2c3e50" stroke-width="2"/>
  <text x="50" y="70" font-size="12" text-anchor="middle" fill="#2c3e50">Process</text>
</svg>
```

---

## ⚙️ Tips & Tricks

### Resize Your SVG
Make sure the viewBox fits your shape:
- `viewBox="0 0 100 100"` - Standard square
- Adjust to match your shape's proportions

### Use Colors
```svg
<!-- Named colors -->
<circle fill="red"/>

<!-- Hex colors -->
<circle fill="#e74c3c"/>

<!-- RGB -->
<circle fill="rgb(231, 76, 60)"/>
```

### Add Borders/Strokes
```svg
<circle cx="50" cy="50" r="40" 
  fill="blue" 
  stroke="black" 
  stroke-width="2"/>
```

### Make Shapes Transparent
```svg
<rect x="10" y="10" width="80" height="80" 
  fill="blue" 
  opacity="0.5"/>  <!-- 50% transparent -->
```

---

## ✅ Validation

The tab will:
- ✅ Show preview only for valid SVG (must start with `<svg`)
- ⚠️ Show warning if SVG is invalid
- ✅ Only enable "Select This SVG" button for valid SVG
- ✅ Handle errors gracefully

---

## 💾 Persistence

- SVG icons are saved as base64 data URLs
- Icons persist through page reloads
- Icons are stored per-node in your diagram
- Redux localStorage handles automatic saving

---

## 🚀 Full Workflow

```
1. User right-clicks node → "Change Icon"
2. Opens ChangeIconModal
3. Clicks "SVG" tab
4. Pastes SVG code
5. Sees preview
6. Clicks "Select This SVG"
7. Modal closes
8. SVG icon appears in diagram
9. Icon automatically saved to Redux
10. Page reload → Icon still there! ✓
```

---

## 📖 More SVG Resources

- [MDN SVG Tutorial](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial)
- [SVG Reference](https://developer.mozilla.org/en-US/docs/Web/SVG/Element)
- [Free SVG Icons](https://www.svgrepo.com/)
- [SVG Generators](https://www.blobmaker.app/)

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Preview not showing | Make sure SVG starts with `<svg` |
| Icon looks small | Adjust viewBox proportions |
| Colors not showing | Use `fill` attribute on shapes |
| Text not visible | Add `fill` color to `<text>` elements |
| Very complex SVG | Simplify or reduce detail |

---

## Supported Shapes

✅ `<circle>` - Circles
✅ `<rect>` - Rectangles  
✅ `<polygon>` - Polygons (stars, diamonds, etc.)
✅ `<polyline>` - Connected lines
✅ `<path>` - Complex shapes
✅ `<text>` - Text
✅ `<line>` - Lines
✅ `<ellipse>` - Ellipses
✅ `<defs>` & `<linearGradient>` - Gradients
❌ `<script>` - Scripts (not allowed)
❌ External files - Can't load from URLs
