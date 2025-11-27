# It Depends On - .NET Dependency Visualizer

A Visual Studio Code extension that visualizes C# solution and project dependencies in an interactive graph.

![Dependency Graph Visualization](media/screenshot.png)

## Features

- 📁 **Browse & Select**: Open any `.sln` or `.csproj` file to analyze
- 🔍 **Recursive Analysis**: Automatically traverses all project references to build a complete dependency graph
- 📊 **Interactive Graph**: Visualize dependencies using an interactive force-directed graph
- 🖱️ **Click & Explore**: Click on nodes to see detailed project information
- 🎯 **Hover Details**: Hover over nodes to see quick project details
- 🔄 **Drag & Drop**: Rearrange nodes by dragging them around
- 🎨 **Color Coded**: Different colors for solutions, libraries, executables, and projects

## Installation

### From Source

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   cd webview && npm install && cd ..
   ```
3. Build the extension:
   ```bash
   npm run compile
   ```
4. Press F5 in VS Code to launch the Extension Development Host

### From VSIX (Coming Soon)

Download the `.vsix` file and install via:
- VS Code: Extensions → ... → Install from VSIX
- Command line: `code --install-extension itdependson-dotnet-*.vsix`

## Usage

### Method 1: Command Palette
1. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Type "It Depends On: Open Solution/Project File"
3. Select a `.sln` or `.csproj` file
4. View the dependency graph

### Method 2: Context Menu
1. Right-click on any `.sln` or `.csproj` file in the Explorer
2. Select "Visualize Dependencies"
3. View the dependency graph

## Graph Interaction

- **Click** on a node to select it and view details in the side panel
- **Hover** over a node to see a quick tooltip with project info
- **Drag** nodes to rearrange the graph layout
- **Scroll** to zoom in/out
- **Pan** by dragging the canvas background

## Node Colors

| Color | Type |
|-------|------|
| 🟣 Indigo | Solution (.sln) |
| 🔵 Blue | Project (default) |
| 🟢 Green | Library (OutputType=Library) |
| 🟡 Amber | Executable (OutputType=Exe) |

## Project Information Displayed

- Project name and path
- Target framework
- SDK version
- Output type
- Assembly name
- Root namespace
- Version, authors, and description (if available)
- NuGet package references

## Requirements

- Visual Studio Code 1.85.0 or higher
- .NET projects using SDK-style project format

## Known Limitations

- Only supports SDK-style project files (modern .NET/Core format)
- Classic .NET Framework projects may not parse correctly
- Large solutions may take a moment to analyze

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