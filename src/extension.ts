'use strict';

import * as vscode from 'vscode';

import { FileExplorer } from './fileExplorer';

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "boom-party" is now active!');

	const helloDaVinci = vscode.commands.registerCommand('boom-party.helloDaVinci', () => {
		vscode.window.showInformationMessage('Hello Da Vinci!');
	});

	context.subscriptions.push(helloDaVinci);

	context.subscriptions.push(vscode.commands.registerCommand('fileExplorer.refreshFile',()=>{
		new FileExplorer(context);
	}))

	new FileExplorer(context);
}

// this method is called when your extension is deactivated
export function deactivate() { }