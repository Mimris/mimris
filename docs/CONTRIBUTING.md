# Contributing Guide 🌟

We welcome contributions from everyone! Before participating, please read our [Code of Conduct](CODE_OF_CONDUCT.md).

## Table of Contents
1. [First-Time Contributors](#first-time-contributors)
2. [Development Setup](#development-setup)
3. [Development Workflow](#development-workflow)
4. [Technology-Specific Guidelines](#technology-specific-guidelines)
5. [Testing](#testing)
6. [Pull Request Process](#pull-request-process)
7. [Documentation](#documentation)
8. [Need Help?](#need-help)
9. [Acknowledgements](#acknowledgements)

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

```
Use conventional branch prefixes:

feat/: New features
fix/: Bug fixes
docs/: Documentation
refactor/: Code improvements
💻 Development Workflow
Running the App
# Start development server
npm run dev

# Build production bundle
npm run build
📐 Technology-Specific Guidelines
TypeScript
Strict mode enabled (strict: true in tsconfig)

All components must have TypeScript interfaces

Use generics with Redux hooks:

const dispatch = useAppDispatch<AppDispatch>();
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

Next.js Pages
Client components in src/components
Dynamic routes follow [param]/page.tsx convention
documentation if needed

Include screenshots for UI changes

Describe changes in conventional commit format:

feat: add node connection system
fix: resolve undo history bug
docs: update contributing guide
📚 Documentation
Updating Docs
Modify Markdown files in /docs

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

#aknowledgements


