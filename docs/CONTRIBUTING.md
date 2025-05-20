# Contributing Guide 🌟

We welcome contributions from everyone! Before participating, please read our [Code of Conduct](CODE_OF_CONDUCT.md).

## Table of Contents
- [Contributing Guide 🌟](#contributing-guide-)
  - [Table of Contents](#table-of-contents)
  - [🚀 First-Time Contributors](#-first-time-contributors)
  - [🛠️ Development Setup](#️-development-setup)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
- [Start development server](#start-development-server)
- [Build production bundle](#build-production-bundle)

## 🚀 First-Time Contributors

New to open source? Check out our [Good First Issues](https://github.com/mimris/modeller/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22) labeled `good first issue`.

## 🛠️ Development Setup

### Prerequisites

- Node.js
- Next.js
- Redux Toolkit
- React
- GoJS
- TypeScript

### Installation

```bash
git clone https://github.com/mimris/mimris.git
cd mimris
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
<<<<<<< HEAD
npm dev
=======
npm run dev
>>>>>>> 5309607e6bc14960eb09d70fc1107799f4189a78

# Build production bundle
npm run build
📐 Technology-Specific Guidelines
TypeScript
Strict mode enabled (strict: true in tsconfig)

<<<<<<< HEAD
Update documentation if needed
=======
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
>>>>>>> 5309607e6bc14960eb09d70fc1107799f4189a78

Include screenshots for UI changes

Describe changes in conventional commit format:

📚 Documentation
Updating Docs
Modify Markdown files in /docs

<<<<<<< HEAD
=======
🆘 Need Help?
Join our Discord Server
Ask in GitHub Discussions
Attend our weekly Office Hours (Wednesdays 3PM UTC)
>>>>>>> 5309607e6bc14960eb09d70fc1107799f4189a78
🙌 Thank you for contributing to GraphicModelingApp! Your work helps build better creative tools for everyone.

This guide includes:
1. Technology-specific guidelines for your stack
2. Complete development workflow
3. Testing strategies
4. PR quality gates
5. Documentation standards
6. Community support channels

Would you like me to add any specific section or modify the existing content?

##aknowledgements


