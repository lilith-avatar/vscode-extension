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
	CompletionItemKind,
	DocumentFormattingParams,
	TextEdit,
	DocumentRangeFormattingParams
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import * as fmter from 'lua-fmt';
import { buildDocumentFormatEdits, buildDocumentRangeFormatEdits } from './services/formatServeice';
import { FormatOptions } from './config';

// let watchDog = new WatchDog
// 创建链接，通过ipc管道与客户端通信
let connection: Connection = createConnection(ProposedFeatures.all);

// npm模块，用于实现使用Node.js作为运行时的LSP服务器中可用的文本文档：
let documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);
let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;
let fmtOp = new FormatOptions();


connection.onInitialize((params: InitializeParams) => {
	let capabilities = params.capabilities;

	return {
		capabilities: {
			textDocumentSync: {
				openClose: true,
				change: TextDocumentSyncKind.Full
			},
			documentFormattingProvider:true
		}
	};
});

// 三次握手后触发
connection.onInitialized(() => {
	//connection.window.showInformationMessage('Hello World! from server side.');
});

connection.onDocumentFormatting(
	(params: DocumentFormattingParams): TextEdit[] => {
		const uri = params.textDocument.uri;
		const document = documents.get(uri);

		if (!document) {
			return [];
		}

		return buildDocumentFormatEdits(uri, document, fmtOp, params.options);
	}
);

connection.onDocumentRangeFormatting(
	(params: DocumentRangeFormattingParams): TextEdit[] => {

		const uri = params.textDocument.uri;
		const document = documents.get(uri);

		if (!document) {
			return [];
		}

		return buildDocumentRangeFormatEdits(uri, document, params.range, fmtOp, params.options);
	}
);

documents.listen(connection);

connection.listen();