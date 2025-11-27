import * as vscode from 'vscode';
import { DependencyGraph } from '../types';

/**
 * Manages the webview panel for displaying the dependency graph
 */
export class DependencyGraphPanel {
    public static currentPanel: DependencyGraphPanel | undefined;
    public static readonly viewType = 'dependencyGraph';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(
        extensionUri: vscode.Uri,
        graph: DependencyGraph,
        title: string
    ): void {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it
        if (DependencyGraphPanel.currentPanel) {
            DependencyGraphPanel.currentPanel._panel.reveal(column);
            DependencyGraphPanel.currentPanel._update(graph, title);
            return;
        }

        // Otherwise, create a new panel
        const panel = vscode.window.createWebviewPanel(
            DependencyGraphPanel.viewType,
            `Dependencies: ${title}`,
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media'),
                    vscode.Uri.joinPath(extensionUri, 'webview', 'dist'),
                ],
            }
        );

        DependencyGraphPanel.currentPanel = new DependencyGraphPanel(panel, extensionUri, graph, title);
    }

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        graph: DependencyGraph,
        title: string
    ) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        // Set the webview's initial html content
        this._update(graph, title);

        // Listen for when the panel is disposed
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            (message) => {
                switch (message.command) {
                    case 'alert':
                        vscode.window.showInformationMessage(message.text);
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    public dispose(): void {
        DependencyGraphPanel.currentPanel = undefined;

        // Clean up resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _update(graph: DependencyGraph, title: string): void {
        this._panel.title = `Dependencies: ${title}`;
        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview, graph);
    }

    private _getHtmlForWebview(webview: vscode.Webview, graph: DependencyGraph): string {
        // Get the local path to the webview script
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'webview', 'dist', 'index.js')
        );

        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'webview', 'dist', 'index.css')
        );

        // Use a nonce to only allow specific scripts to be run
        const nonce = getNonce();

        // Serialize graph data for the webview
        const graphData = JSON.stringify(graph);

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <link href="${styleUri}" rel="stylesheet">
    <title>Dependency Graph</title>
</head>
<body>
    <div id="root"></div>
    <script nonce="${nonce}">
        window.graphData = ${graphData};
    </script>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }
}

function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
