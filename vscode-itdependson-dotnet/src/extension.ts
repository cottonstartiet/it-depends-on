import * as vscode from 'vscode';
import { analyzeDependencies } from './commands/analyzeDependencies';

export function activate(context: vscode.ExtensionContext) {
    console.log('ItDependsOn .NET extension is now active');

    const analyzeCommand = vscode.commands.registerCommand(
        'itdependson.analyzeDependencies',
        () => analyzeDependencies(context)
    );

    context.subscriptions.push(analyzeCommand);
}

export function deactivate() {}
