'use strict';

import * as vscode from 'vscode';

import { CodeTreeProvider, Dependency } from './codeTree';

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "project-da-vinci-vs-code-extension" is now active!');

	const helloDaVinci = vscode.commands.registerCommand('project-da-vinci-vs-code-extension.helloDaVinci', () => {
		vscode.window.showInformationMessage('Hello Da Vinci!');
	});

	context.subscriptions.push(helloDaVinci);

	if (vscode.workspace.rootPath) {
		const codeTreeProvider = new CodeTreeProvider(vscode.workspace.rootPath);
		vscode.window.registerTreeDataProvider('codeTree', codeTreeProvider);
		vscode.commands.registerCommand('codeTree.refresh', () => codeTreeProvider.refresh());
	}
}

// this method is called when your extension is deactivated
export function deactivate() { }
