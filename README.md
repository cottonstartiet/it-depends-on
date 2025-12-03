## Development

### Project Structure

```
vscode-itdependson-dotnet/
├── src/                    # Extension source code
│   ├── extension.ts        # Extension entry point
│   ├── parsers/            # Project file parsers
│   ├── panels/             # Webview panel management
│   └── types/              # TypeScript type definitions
├── webview/                # React webview application
│   ├── src/
│   │   ├── App.tsx         # Main React component
│   │   ├── components/     # React components
│   │   └── styles.css      # Styles
│   └── package.json
├── scripts/                # Build scripts
│   ├── build-vsix.ps1      # Windows PowerShell build script
│   └── build-vsix.sh       # Linux/macOS build script
└── package.json            # Extension manifest
```

### Building

```bash
# Install all dependencies
npm install
cd webview && npm install && cd ..

# Build everything
npm run compile

# Watch mode for extension
npm run watch
```

### Packaging VSIX

The extension can be packaged into a `.vsix` file for distribution using several methods:

#### Using npm scripts

```bash
# Build and package in one command
npm run build:vsix

# Just package (assumes already compiled)
npm run package

# Package and install locally for testing
npm run package:install
```

#### Using build scripts

**Windows (PowerShell):**
```powershell
# Basic build
.\scripts\build-vsix.ps1

# Clean build (removes previous build artifacts)
.\scripts\build-vsix.ps1 -Clean

# Skip dependency installation (faster, for CI/CD)
.\scripts\build-vsix.ps1 -SkipInstall
```

**Linux/macOS (Bash):**
```bash
# Basic build
./scripts/build-vsix.sh

# Clean build
./scripts/build-vsix.sh --clean

# Skip dependency installation
./scripts/build-vsix.sh --skip-install
```

#### Installing the VSIX

After building, install the extension:

```bash
# Using VS Code CLI
code --install-extension itdependson-dotnet-0.0.1.vsix

# Or in VS Code:
# 1. Open Extensions view (Ctrl+Shift+X)
# 2. Click "..." menu → "Install from VSIX..."
# 3. Select the .vsix file
```

### Available npm Scripts

| Script                      | Description                           |
| --------------------------- | ------------------------------------- |
| `npm run compile`           | Compile both extension and webview    |
| `npm run compile:extension` | Compile only the extension TypeScript |
| `npm run compile:webview`   | Build only the webview React app      |
| `npm run watch`             | Watch mode for extension development  |
| `npm run watch:webview`     | Watch mode for webview development    |
| `npm run lint`              | Run ESLint on source files            |
| `npm run clean`             | Remove build directories              |
| `npm run package`           | Create VSIX package                   |
| `npm run build:vsix`        | Compile and package in one step       |
| `npm run package:install`   | Package and install locally           |

### Debugging

1. Open the project in VS Code
2. Press F5 to launch the Extension Development Host
3. In the new window, open a folder with .NET projects
4. Use the Command Palette or context menu to visualize dependencies

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- [reagraph](https://github.com/reaviz/reagraph) - React graph visualization library
- [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser) - XML parsing