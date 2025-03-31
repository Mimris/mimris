# modeller
# GraphicModelingApp 🎨 [![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

Open-source vector graphics editor with node-based modeling capabilities

![App Screenshot](screenshot.png)

## Table of Contents
- [modeller](#modeller)
- [GraphicModelingApp 🎨 ](#graphicmodelingapp--)
  - [Table of Contents](#table-of-contents)
  - [Features ✨](#features-)
  - [Quick Start �](#quick-start-)
  - [Installation 📦](#installation-)
    - [Prerequisites](#prerequisites)
  - [Usage 🖌️](#usage-️)
    - [Basic Workflow](#basic-workflow)
  - [Development 💻](#development-)
    - [Project Structure](#project-structure)
    - [Run Tests](#run-tests)
  - [Contributing 🤝](#contributing-)
  - [License 📄](#license-)

## Features ✨
- Node-based visual programming interface
- Multi-format export (SVG, PNG, PDF, DXF)
- Customizable templates & components
- Plugin system for extensions
- Cross-platform support (Windows/Linux/macOS)

## Quick Start �
```bash
# Clone repository
git clone https://github.com/yourusername/GraphicModelingApp.git
cd GraphicModelingApp

# Install dependencies
npm install

# Launch development mode
npm run dev
```

## Installation 📦
### Prerequisites
- Node.js v18+
- npm v9+
- Python 3.10+ (for computational geometry modules)

See [INSTALLATION.md](docs/INSTALLATION.md) for detailed instructions.

## Usage 🖌️
### Basic Workflow
1. Create new project: `File > New`
2. Drag components from toolbox
3. Connect nodes using interactive wires
4. Export to desired format

```typescript
// Example configuration
interface AppConfig {
  canvasSize: 'A4' | 'Letter' | 'Custom';
  colorSpace: 'RGB' | 'CMYK';
  gridSnapping: boolean;
}

const defaultConfig: AppConfig = {
  canvasSize: 'A4',
  colorSpace: 'RGB',
  gridSnapping: true
};
```

## Development 💻
### Project Structure
```
/src
  /core       - Engine modules
  /ui         - React components
  /plugins    - Extension system
  /io         - Import/export handlers
  /shared     - Common utilities
```

### Run Tests
```bash
npm test
```

## Contributing 🤝
We welcome contributions under these guidelines:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

Review our [CONTRIBUTING GUIDE](CONTRIBUTING.md) before submitting code.

Priority Areas:
- 🐛 Bug fixes
- 📖 Documentation improvements
- 🔒 Security enhancements
- 🧩 Plugin API extensions

## License 📄
This project is licensed under the GNU General Public License v3.0 - see [LICENSE](LICENSE) file for details.

**Key License Requirements:**
- All derivative works must remain open-source
- Modifications must be clearly marked
- Source code must be distributed with any binaries

---

**Maintained by** [Your Organization] • 📧 contact@example.com • [Live Demo](https://example.com)
```

Changes made:
1. Removed all Norwegian text
2. Changed license from MIT to GPLv3
3. Added GPL-specific requirements section
4. Updated license badge and link
5. Streamlined language for international contributors
6. Added TypeScript example for stronger typing

For even stronger restrictions, consider:
1. AGPLv3 (requires network service providers to share code)
2. Add CLA (Contributor License Agreement)
3. Include patent protection clauses

Always consult with legal counsel when choosing licenses for critical projects.