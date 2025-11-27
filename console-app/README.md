# Project Dependencies Visualizer

A C# console application that visualizes project dependencies from .NET solution (.sln) or project (.csproj) files as an interactive HTML page.

## Features

- **Parse Solution Files**: Analyze entire .NET solutions to discover all projects
- **Parse Project Files**: Analyze individual .csproj files
- **Interactive Visualization**: Click on projects to expand and view their dependencies
- **Project Metadata**: Display target framework, output type, NuGet packages, and more
- **Static HTML Output**: Generate a standalone HTML file that works in any browser

## Usage

```bash
dotnet run <input-file> [output-file]
```

### Arguments

- `input-file`: Path to a .sln or .csproj file (required)
- `output-file`: Path for the output HTML file (optional, default: dependencies.html)

### Examples

```bash
# Analyze a solution file
dotnet run MySolution.sln

# Analyze a project file with custom output
dotnet run MyProject.csproj my-dependencies.html
```

## Building

```bash
dotnet build
```

## Running

```bash
dotnet run -- <input-file> [output-file]
```

## How It Works

1. **Parsing**: The application parses .sln or .csproj files to extract:
   - Project names and paths
   - Project references (dependencies)
   - Target frameworks
   - Output types
   - NuGet package references

2. **Graph Building**: Creates a dependency graph mapping projects to their dependencies

3. **HTML Generation**: Produces an interactive HTML visualization where:
   - Each project is displayed as a clickable node
   - Clicking a project reveals its direct dependencies
   - Project metadata is displayed on each node
   - Visual distinction between expanded and collapsed nodes

## Output

The generated HTML file features:
- Modern, responsive design
- Color-coded project nodes
- Hover effects for better interactivity
- Statistics showing total, visible, and expanded projects
- Controls to show all projects or clear the view

## Requirements

- .NET 6.0 or later
