# Contributing Guide 🌟

We welcome contributions from everyone! Before participating, please read our [Code of Conduct](CODE_OF_CONDUCT.md).

## 🚀 First-Time Contributors

New to open source? Check out our [Good First Issues](https://github.com/mimris/modeller/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22) labeled `good first issue`.

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+
- GoJS 3.0+ (free trial OK for development)
- TypeScript 5.0+

### Installation

```bash
git clone https://github.com/yourusername/GraphicModelingApp.git
cd GraphicModelingApp
npm install
Branch Strategy
Create a new branch from main:

git checkout -b feat/your-feature-name
Use conventional branch prefixes:

feat/: New features
fix/: Bug fixes
docs/: Documentation
refactor/: Code improvements
💻 Development Workflow
Running the App
# Start development server
yarn dev

# Storybook for component development
yarn storybook
Key Scripts
# Type checking
yarn typecheck

# Linting
yarn lint

# Formatting
yarn format

# Build production bundle
yarn build
📐 Technology-Specific Guidelines
TypeScript
Strict mode enabled (strict: true in tsconfig)

All components must have TypeScript interfaces

Use generics with Redux hooks:

const dispatch = useAppDispatch<AppDispatch>();
const nodes = useAppSelector(selectNodes);
Redux Toolkit
Create slices in src/store/features

Use RTK Query for API interactions

Follow this slice structure:

export const diagramSlice = createSlice({
  name: 'diagram',
  initialState,
  reducers: {
    addNode: (state, action: PayloadAction<Node>) => {
      // Immutable updates only
    }
  },
  extraReducers(builder) {
    // Add async reducers
  }
});
GoJS Integration
Create custom nodes in src/lib/gojsTemplates

Use the diagram wrapper component:

import { ReactDiagram } from 'gojs-react';
import { nodeTemplate } from '../gojsTemplates';

const DiagramWrapper = () => (
  <ReactDiagram
    initDiagram={initializeDiagram}
    nodeTemplateMap={nodeTemplate}
    skipsDiagramUpdate={false}
  />
);
Never modify GoJS objects directly - use Redux actions

Next.js Pages
Use App Router structure
Server components in src/app
Client components in src/components
Dynamic routes follow [param]/page.tsx convention
🧪 Testing
Test Types
Test Type Location Command
Unit Tests __tests__/*.test.ts yarn test:unit
Integration cypress/e2e yarn test:e2e
Visual Reg. cypress/snapshots yarn test:visual
Testing Guidelines
Mock Redux store for component tests
Use @testing-library/user-event for interactions
Snapshots must be reviewed for GoJS diagrams
🔀 Pull Request Process
Ensure all tests pass

Update documentation if needed

Include screenshots for UI changes

Describe changes in conventional commit format:

feat: add node connection system
fix: resolve undo history bug
docs: update contributing guide
📚 Documentation
Updating Docs
Modify Markdown files in /docs

Run documentation server:

yarn docs:dev
Keep JSDoc comments updated

/**
 * Creates a new node in the diagram
 * @param position - {x,y} coordinates
 * @param type - Node type from NodeType enum
 */
function createNode(position: Coord, type: NodeType): Node {
  // implementation
}
🆘 Need Help?
Join our Discord Server
Ask in GitHub Discussions
Attend our weekly Office Hours (Wednesdays 3PM UTC)
🙌 Thank you for contributing to GraphicModelingApp! Your work helps build better creative tools for everyone.


This guide includes:
1. Technology-specific guidelines for your stack
2. Complete development workflow
3. Testing strategies
4. PR quality gates
5. Documentation standards
6. Community support channels

Would you like me to add any specific section or modify the existing content?
