/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Lilith Games, Avatar Team.
 *  Licensed under the MIT License.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import * as path from'path';
import {
	LanguageClient,
	LanguageClientOptions,
	TransportKind
} from 'vscode-languageclient/node';
import { FileExplorer } from './fileExplorer';

let languageclient: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
	//树状图
	new FileExplorer(context);
	// node 服务器路径
	let serverModule = context.asAbsolutePath(path.join('server','out','server.js'));
	// 开启调试模式
	let debugOptions = { execArgv: ["--nolazy", "--inspect=6004"] };
	let serverOptions = {
		// 运行时的参数
		run:{module:serverModule,transport: TransportKind.ipc},
		// 调试时的参数
		debug:{module: serverModule, transport: TransportKind.ipc, options: debugOptions}
	};
	// 客户端参数
	let clientOptions:LanguageClientOptions={
		documentSelector: [{ scheme: 'file', language: 'lua' }],
        synchronize: {
            //lua文件更改时通知服务器
            fileEvents: [vscode.workspace.createFileSystemWatcher('**/*.lua')]
        }
	};
	//logger.Logger.configure();
	// 创建客户端
	let connection = new LanguageClient('Boom!Party',serverOptions,clientOptions);
	//启动
	connection.start();

	// context.subscriptions.push(vscode.commands.registerCommand(ldoc.LDocCommandName,()=>{
	// 	let ldocObj = new ldoc.LDocCommand(connection);
	// 	ldocObj.onRequest();
	// }));

}

// this method is called when your extension is deactivated
export function deactivate() {}