
# GraphicModelingApp 🎨

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
![TypeScript](https://img.shields.io/badge/TypeScript-4.0+-3178C6?logo=typescript)
![Next.js](https://img.shields.io/badge/Next.js-13.0+-000000?logo=next.js)

![GoJS Diagram Example](https://i.imgur.com/sample-diagram.png)

> Advanced node-based vector graphics editor built with modern web technologies

## Table of Contents
- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Development Setup](#-development-setup)
- [Architecture](#-architecture)
- [State Management](#-state-management)
- [Diagram Engine](#-diagram-engine)
- [Contributing](#-contributing)

## 🏗️ Tech Stack
- **Frontend Framework**: Next.js 13 (App Router)
- **Language**: TypeScript 5+
- **Diagram Library**: GoJS 3.0
- **State Management**: Redux Toolkit
- **Rendering**: React 18 (Server Components)
- **Build System**: Turborepo
- **Styling**: Tailwind CSS + CSS Modules

## ✨ Features
- **📐 GoJS-Powered Node Editor**
  - Hierarchical node diagrams with custom palettes
  - Advanced link routing and automatic layout
  - Undo/redo history with transaction management
- **Next.js Optimized Rendering**
  - Hybrid SSR/CSR for complex diagrams
  - Dynamic component loading with React Suspense
- **Redux State Syncing**
  - Real-time collaboration through state synchronization
  - Time-travel debugging capabilities
- **Type-Safe Development**
  - Strict TypeScript configuration
  - Generated API types from OpenAPI spec

## 🛠️ Development Setup

### Core Dependencies

```bash
# Install with yarn
yarn add next react react-dom @reduxjs/toolkit gojs
```

### Recommended VSCode Extensions

- TypeScript Importer
- Redux DevTools
- GoJS Diagramming Tools

### Environment Configuration

```typescript
// next.config.js
const withTM = require('next-transpile-modules')(['gojs']);

module.exports = withTM({
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['gojs'],
  },
});
```

## 🏛️ Architecture

### Component Structure

```tsx
// Example node component
import { Diagram, Node, Link } from 'gojs';

export default function NodeCanvas() {
  const dispatch = useAppDispatch();
  const nodes = useAppSelector(selectAllNodes);

  const handleDiagramChange = useCallback((e: DiagramEvent) => {
    dispatch(updateDiagramState(e.diagram.toJSON()));
  }, [dispatch]);

  return (
    <Diagram
      initDiagram={initializeDiagram}
      modelData={nodes}
      onModelChange={handleDiagramChange}
    />
  );
}
```

## 🧩 State Management

### Redux Store Structure

```typescript
// store/diagramSlice.ts
import { createSlice } from '@reduxjs/toolkit';

interface DiagramState {
  nodes: NodeData[];
  connections: ConnectionData[];
  history: DiagramHistory[];
}

const initialState: DiagramState = {
  nodes: [],
  connections: [],
  history: [],
};

export const diagramSlice = createSlice({
  name: 'diagram',
  initialState,
  reducers: {
    addNode: (state, action: PayloadAction<NodeData>) => {
      state.nodes.push(action.payload);
      state.history.push(/* ... */);
    },
    // Additional reducers...
  },
});
```

## 📐 Diagram Engine

### GoJS Configuration

```typescript
// lib/gojsConfig.ts
import * as go from 'gojs';

export function initializeDiagram(): go.Diagram {
  const $ = go.GraphObject.make;
  
  return $(go.Diagram, {
    'undoManager.isEnabled': true,
    layout: $(go.ForceDirectedLayout),
    model: $(go.GraphLinksModel, {
      linkKeyProperty: 'key'
    })
  });
}

// Custom node template
export const nodeTemplate = (
  <Node
    locationSpot={go.Spot.Center}
    selectionAdorned={true}
  >
    <Shape 
      figure="Rectangle" 
      fill="#2F80ED" 
      strokeWidth={0}
    />
    <TextBlock 
      text="{name}" 
      margin={8} 
      stroke="white"
    />
  </Node>
);
```

## 🤝 Contributing

### TypeScript Guidelines

- Strict null checks enabled
- All components must have PropTypes or TypeScript interfaces
- Redux actions should use RTK Query where possible

### Diagram Development

1. Create new node types in `/lib/gojsTemplates`
2. Add corresponding Redux actions
3. Write integration tests in Cypress

### Running Storybook

```bash
yarn storybook
```

Explore component library at `http://localhost:6006`

---

[![Powered by GoJS](https://gojs.net/images/gojs-logo.svg)](https://gojs.net)
[![Next.js Reference](https://img.shields.io/badge/docs-next.js-000000?logo=next.js)](https://nextjs.org/docs)

**License**: GNU GPLv3 (excluding GoJS commercial license)

```

Key integrations added:
1. Added GoJS-specific configuration and examples
2. Integrated Redux Toolkit state management patterns
3. Included Next.js optimization techniques
4. Added TypeScript-specific development guidelines
5. Showcased architecture combining all four technologies
6. Added environment configuration for GoJS+Next.js
7. Included Redux-GoJS synchronization examples
8. Added commercial license notice for GoJS
9. Included component development guidelines with all libraries
10. Added relevant badges and documentation links

This version provides a comprehensive view of how the different technologies interact while maintaining readability and developer focus.
