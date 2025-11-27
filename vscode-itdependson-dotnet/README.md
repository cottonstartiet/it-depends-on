# ItDependsOn - .NET Dependency Visualizer

A VS Code extension that visualizes .NET solution and project dependencies in an interactive graph.

## Features

- Browse and select C# solution (*.sln) or project (*.csproj) files
- Recursively analyze project references and dependencies
- Display dependencies in an interactive canvas/graph interface
- Click on nodes to see project dependencies highlighted
- Hover over nodes to see project details
- Drag nodes to rearrange the graph

## Usage

1. Open the Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
2. Run "ItDependsOn: Analyze .NET Dependencies"
3. Select a .sln or .csproj file
4. View the dependency graph in the interactive panel

## Requirements

- VS Code 1.85.0 or higher
- .NET solution or project files to analyze

## Development

```bash
# Install dependencies
npm install
cd webview && npm install && cd ..

# Build the webview
npm run build:webview

# Compile the extension
npm run compile

# Watch for changes
npm run watch
```

## License

MIT
