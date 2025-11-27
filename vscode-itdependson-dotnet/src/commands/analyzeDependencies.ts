import * as vscode from 'vscode';
import * as path from 'path';
import { buildDependencyGraph } from '../parsers';
import { DependencyGraphPanel } from '../webview/DependencyGraphPanel';

/**
 * Command handler for analyzing .NET dependencies
 */
export async function analyzeDependencies(context: vscode.ExtensionContext): Promise<void> {
    // Show file picker dialog
    const fileUri = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        filters: {
            'Solution/Project Files': ['sln', 'csproj'],
        },
        title: 'Select a .NET Solution or Project File',
    });

    if (!fileUri || fileUri.length === 0) {
        return;
    }

    const selectedFile = fileUri[0].fsPath;
    const fileName = path.basename(selectedFile);

    // Show progress while analyzing
    await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: `Analyzing dependencies for ${fileName}...`,
            cancellable: false,
        },
        async (progress) => {
            try {
                progress.report({ increment: 0, message: 'Parsing project files...' });

                // Build the dependency graph
                const graph = await buildDependencyGraph(selectedFile);

                progress.report({ increment: 50, message: 'Building visualization...' });

                if (graph.nodes.length === 0) {
                    vscode.window.showWarningMessage('No projects found in the selected file.');
                    return;
                }

                // Show the dependency graph in a webview panel
                DependencyGraphPanel.createOrShow(context.extensionUri, graph, fileName);

                progress.report({ increment: 100, message: 'Complete!' });

                vscode.window.showInformationMessage(
                    `Found ${graph.nodes.length} projects with ${graph.edges.length} dependencies.`
                );
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                vscode.window.showErrorMessage(`Failed to analyze dependencies: ${errorMessage}`);
            }
        }
    );
}
