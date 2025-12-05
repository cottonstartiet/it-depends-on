import * as vscode from 'vscode';
import { DependencyGraphPanel } from './panels/DependencyGraphPanel';
import { ProjectParser } from './parsers/ProjectParser';

export function activate(context: vscode.ExtensionContext) {
  console.log('It Depends On - .NET Dependency Visualizer is now active');

  // Command to open file picker and visualize dependencies
  const openSolutionCommand = vscode.commands.registerCommand(
    'itdependson.openSolution',
    async () => {
      const fileUri = await vscode.window.showOpenDialog({
        canSelectMany: false,
        openLabel: 'Select Solution or Project',
        filters: {
          'C# Files': ['sln', 'slnx', 'csproj']
        }
      });

      if (fileUri && fileUri[0]) {
        await visualizeDependencies(fileUri[0], context);
      }
    }
  );

  // Command to visualize dependencies from context menu
  const visualizeCommand = vscode.commands.registerCommand(
    'itdependson.visualizeDependencies',
    async (uri: vscode.Uri) => {
      if (uri) {
        await visualizeDependencies(uri, context);
      } else {
        // If no URI provided, prompt user to select a file
        vscode.commands.executeCommand('itdependson.openSolution');
      }
    }
  );

  context.subscriptions.push(openSolutionCommand, visualizeCommand);
}

async function visualizeDependencies(
  uri: vscode.Uri,
  context: vscode.ExtensionContext
): Promise<void> {
  try {
    const parser = new ProjectParser();

    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Analyzing dependencies...',
        cancellable: false
      },
      async (progress) => {
        progress.report({ message: 'Parsing project files...' });

        const graph = await parser.parseFile(uri.fsPath);

        progress.report({ message: 'Building dependency graph...' });

        // Create and show the webview panel
        DependencyGraphPanel.createOrShow(context.extensionUri, graph);
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    vscode.window.showErrorMessage(`Failed to analyze dependencies: ${errorMessage}`);
  }
}

export function deactivate() {
  // Cleanup if needed
}