# Markdown Documentation Generator

📚 A powerful CLI tool to generate beautiful HTML documentation from markdown files with theme support.

## Features

- 🎨 **Multiple Themes**: Default, Dark, and GitHub themes
- 📱 **Responsive Design**: Mobile-friendly documentation portal
- 🔍 **Auto-Discovery**: Automatically finds and categorizes markdown files
- 🎯 **Front Matter Support**: YAML metadata for custom titles and categories
- 👀 **Live Watching**: Real-time regeneration when files change
- 📂 **Flexible Structure**: Works with any project structure
- 🚀 **Easy Setup**: One command to add to existing projects
- 🔧 **Configurable**: Customizable via config.json

## Installation

```bash
# Use directly with npx (recommended)
npx markdown-docs-generator setup

# Or install globally
npm install -g markdown-docs-generator
```

## Quick Start

### Add to Existing Project

```bash
# Navigate to your project
cd your-project

# Setup documentation system
npx markdown-docs-generator setup

# Generate documentation
npm run docs

# Start live watching
npm run docs:watch
```

### Create New Project

```bash
# Create new directory
mkdir my-docs-project
cd my-docs-project

# Initialize with documentation system
npx markdown-docs-generator init

# Start developing
npm run docs:watch
```

## Usage

### Commands

| Command | Description |
|---------|-------------|
| `setup` | Add documentation system to existing project |
| `init` | Initialize new project with documentation system |
| `update` | Update existing documentation system |
| `help` | Show help information |

### Options

| Option | Description |
|--------|-------------|
| `-t, --theme <theme>` | Choose theme: default, dark, github |
| `-f, --force` | Overwrite existing files |
| `--no-install` | Skip npm install |
| `--backup` | Create backup of existing files |

### Examples

```bash
# Setup with dark theme
npx markdown-docs-generator setup --theme dark

# Force setup (overwrite existing files)
npx markdown-docs-generator setup --force

# Update with backup
npx markdown-docs-generator update --backup

# Initialize new project
npx markdown-docs-generator init --theme github
```

## Generated Scripts

After setup, these scripts will be added to your `package.json`:

```json
{
  "scripts": {
    "docs": "cd docs/generator && node docs-generator.js",
    "docs:watch": "cd docs/generator && node docs-generator.js --watch",
    "docs:dark": "cd docs/generator && node docs-generator.js --theme dark",
    "docs:github": "cd docs/generator && node docs-generator.js --theme github"
  }
}
```

## Project Structure

After setup, your project will have this structure:

```
your-project/
├── docs/
│   ├── generator/
│   │   ├── docs-generator.js      # Main generator script
│   │   ├── config.json           # Configuration file
│   │   └── styles/
│   │       ├── default.css       # Default theme
│   │       ├── dark.css         # Dark theme
│   │       └── github.css       # GitHub theme
│   ├── CLAUDE.md                # Documentation guidelines
│   └── *.md                     # Your documentation files
├── README.md                    # Project README
├── index.html                   # Generated documentation
└── package.json
```

## Documentation Format

Create markdown files with front matter for better organization:

```markdown
---
title: Getting Started
category: overview
created: 2024-01-01T00:00:00Z
---

# Getting Started

Your documentation content here...
```

### Front Matter Fields

| Field | Description | Example |
|-------|-------------|---------|
| `title` | Document title | `"Getting Started"` |
| `category` | Category for grouping | `"overview"` |
| `created` | Creation date | `"2024-01-01T00:00:00Z"` |

### Available Categories

- `overview` - Project overviews and introductions
- `technical` - Technical specifications and API docs
- `analysis` - Research and analysis documents
- `planning` - Project plans and roadmaps
- `misc` - Other documents

## Themes

### Default Theme
Clean, modern design with light colors and excellent readability.

### Dark Theme
GitHub-inspired dark theme perfect for developers who prefer dark interfaces.

### GitHub Theme
Matches GitHub's official styling for familiar documentation experience.

## Configuration

The `docs/generator/config.json` file controls the generator behavior:

```json
{
  "theme": "default",
  "title": "Project Documentation",
  "subtitle": "Project Documentation",
  "outputFile": "index.html",
  "docsDir": "docs",
  "excludeFiles": ["temp.md", "draft.md", "*temp*", "*draft*", "*.bak"],
  "categoryOrder": ["overview", "technical", "analysis", "planning", "misc"],
  "defaultCategory": "Documentation"
}
```

## Korean Font Support

The generator includes optimized Korean typography:

```css
font-family: -apple-system, BlinkMacSystemFont, 
    "Apple SD Gothic Neo", "Pretendard Variable", 
    Pretendard, "Noto Sans KR", "Malgun Gothic", 
    "Apple Color Emoji", "Segoe UI", Roboto, sans-serif;
```

## Live Server Integration

The generated `index.html` works perfectly with VS Code Live Server extension:

1. Install [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
2. Run `npm run docs:watch` to start file watching
3. Right-click `index.html` and select "Open with Live Server"
4. Edit markdown files and see changes in real-time

## Advanced Usage

### Custom Themes

Create custom themes by adding CSS files to `docs/generator/styles/`:

```bash
# Create custom theme
echo "/* Custom theme */" > docs/generator/styles/custom.css

# Use custom theme
npm run docs -- --theme custom
```

### File Exclusion

Use glob patterns to exclude files:

```json
{
  "excludeFiles": [
    "temp.md",
    "draft.md", 
    "*temp*",
    "*draft*",
    "*.bak"
  ]
}
```

### Programmatic Usage

```javascript
const { setup } = require('markdown-docs-generator');

await setup({
  theme: 'dark',
  force: true,
  backup: true
});
```

## Troubleshooting

### Common Issues

1. **"Cannot find module" errors**: Run `npm install` in your project
2. **Permission denied**: Run `chmod +x docs/generator/docs-generator.js`
3. **Files not detected**: Check `excludeFiles` in config.json
4. **Styles not loading**: Verify theme file exists in `docs/generator/styles/`

### Debug Mode

Enable verbose logging:

```bash
DEBUG=markdown-docs-generator npm run docs
```

## Requirements

- Node.js 14.0.0 or higher
- npm 6.0.0 or higher

## Dependencies

- `commander` - CLI framework
- `inquirer` - Interactive prompts
- `fs-extra` - Enhanced file system operations
- `handlebars` - Template engine
- `chalk` - Terminal styling
- `chokidar` - File watching
- `gray-matter` - Front matter parsing
- `marked` - Markdown parsing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Changelog

### v1.0.0
- Initial release
- Support for multiple themes (default, dark, github)
- CLI commands: init, setup, update
- File watching and live regeneration
- Korean font optimization
- Responsive design
- Front matter support

## Support

- 🐛 [Report bugs](https://github.com/USERNAME/markdown-docs-generator/issues)
- 💡 [Request features](https://github.com/USERNAME/markdown-docs-generator/issues)
- 📖 [Documentation](https://github.com/USERNAME/markdown-docs-generator)
- 💬 [Discussions](https://github.com/USERNAME/markdown-docs-generator/discussions)

---

Made with ❤️ for developers who love beautiful documentation.