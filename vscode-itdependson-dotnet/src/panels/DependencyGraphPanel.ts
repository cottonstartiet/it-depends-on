import * as vscode from 'vscode';
import { DependencyGraph } from '../types';

export class DependencyGraphPanel {
  public static currentPanel: DependencyGraphPanel | undefined;
  public static readonly viewType = 'dependencyGraph';

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri, graph: DependencyGraph): void {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it
    if (DependencyGraphPanel.currentPanel) {
      DependencyGraphPanel.currentPanel._panel.reveal(column);
      DependencyGraphPanel.currentPanel._update(graph);
      return;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      DependencyGraphPanel.viewType,
      'Dependency Graph',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'webview', 'dist'),
          vscode.Uri.joinPath(extensionUri, 'media')
        ]
      }
    );

    DependencyGraphPanel.currentPanel = new DependencyGraphPanel(panel, extensionUri, graph);
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    graph: DependencyGraph
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // Set the webview's initial html content
    this._update(graph);

    // Listen for when the panel is disposed
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.type) {
          case 'nodeClick':
            this._handleNodeClick(message.nodeId);
            break;
          case 'error':
            vscode.window.showErrorMessage(message.message);
            break;
        }
      },
      null,
      this._disposables
    );
  }

  private _handleNodeClick(nodeId: string): void {
    // Node click handler - could be used to open the file or perform other actions
    void nodeId;
  }

  public dispose(): void {
    DependencyGraphPanel.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private _update(graph: DependencyGraph): void {
    const webview = this._panel.webview;
    this._panel.title = 'Dependency Graph';
    this._panel.webview.html = this._getHtmlForWebview(webview, graph);
  }

  private _getHtmlForWebview(webview: vscode.Webview, graph: DependencyGraph): string {
    // Get the local path to the webview scripts
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'webview', 'dist', 'bundle.js')
    );

    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'webview', 'dist', 'styles.css')
    );

    // Use a nonce to only allow specific scripts to be run
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;">
    <link href="${styleUri}" rel="stylesheet">
    <title>Dependency Graph</title>
    <style>
        html, body, #root {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
            background-color: var(--vscode-editor-background, #1e1e1e);
        }
        .app-container {
            width: 100%;
            height: 100%;
        }
        .graph-container {
            width: 100%;
            height: 100%;
        }
    </style>
</head>
<body>
    <div id="root"></div>
    <script nonce="${nonce}">
        window.initialGraph = ${JSON.stringify(graph)};
        window.vscodeApi = acquireVsCodeApi();
        console.log('Graph data loaded:', window.initialGraph);
        console.log('Nodes:', window.initialGraph.nodes?.length || 0);
        console.log('Edges:', window.initialGraph.edges?.length || 0);
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