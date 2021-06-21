/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Lilith Games, Avatar Team.
 *  Licensed under the MIT License.
 *--------------------------------------------------------------------------------------------*/

import {
	createConnection,
	ProposedFeatures,
	TextDocuments,
	Connection,
	InitializeParams,
	TextDocumentSyncKind,
	TextDocumentPositionParams,
	CompletionItem,
	CompletionItemKind
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

// let watchDog = new WatchDog
// 创建链接，通过ipc管道与客户端通信
let connection: Connection = createConnection(ProposedFeatures.all);

// npm模块，用于实现使用Node.js作为运行时的LSP服务器中可用的文本文档：
let documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);
let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

connection.onInitialize((params: InitializeParams) => {
	let capabilities = params.capabilities;

	return {
		capabilities: {
			textDocumentSync: {
				openClose: true,
				change: TextDocumentSyncKind.Incremental
			},
			completionProvider: {
				resolveProvider: true
			}
		}
	};
});

// 三次握手后触发
connection.onInitialized(() => {
	//connection.window.showInformationMessage('Hello World! from server side.');
});

// 以下为范例，可以用json来转
connection.onCompletion(
	(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
		return [
			{
				label: 'TextView' + _textDocumentPosition.position.character,
				kind: CompletionItemKind.Text,
				data: 1
			},
			{
				label: 'Button' + _textDocumentPosition.position.line,
				kind: CompletionItemKind.Text,
				data: 2
			},
			{
				label: 'ListView',
				kind: CompletionItemKind.Text,
				data: 3
			}
		];
	}
);

connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		if (item.data === 1) {
			item.detail = 'TextView';
			item.documentation = 'TextView documentation';
		} else if (item.data === 2) {
			item.detail = 'Button';
			item.documentation = 'JavaScript documentation';
		} else if (item.data === 3) {
			item.detail = 'ListView';
			item.documentation = 'ListView documentation';
		}
		return item;
	}
);

documents.listen(connection);

connection.listen();