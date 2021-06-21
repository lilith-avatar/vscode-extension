/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Lilith Games, Avatar Team.
 *  Licensed under the MIT License.
 *  @author Yuancheng Zhang, Yen Yuan
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as rimraf from 'rimraf';
import { workspace } from 'vscode';
import EventEmitter = require('events');

//#region Utilities

namespace _ {

    function handleResult<T>(resolve: (result: T) => void, reject: (error: Error) => void, error: Error | null | undefined, result: T): void {
        if (error) {
            reject(massageError(error));
        } else {
            resolve(result);
        }
    }

    function massageError(error: Error & { code?: string }): Error {
        if (error.code === 'ENOENT') {
            return vscode.FileSystemError.FileNotFound();
        }

        if (error.code === 'EISDIR') {
            return vscode.FileSystemError.FileIsADirectory();
        }

        if (error.code === 'EEXIST') {
            return vscode.FileSystemError.FileExists();
        }

        if (error.code === 'EPERM' || error.code === 'EACCESS') {
            return vscode.FileSystemError.NoPermissions();
        }

        return error;
    }

    export function checkCancellation(token: vscode.CancellationToken): void {
        if (token.isCancellationRequested) {
            throw new Error('Operation cancelled');
        }
    }

    export function normalizeNFC(items: string): string;
    export function normalizeNFC(items: string[]): string[];
    export function normalizeNFC(items: string | string[]): string | string[] {
        if (process.platform !== 'darwin') {
            return items;
        }

        if (Array.isArray(items)) {
            return items.map(item => item.normalize('NFC'));
        }

        return items.normalize('NFC');
    }

    export function readdir(path: string): Promise<string[]> {
        return new Promise<string[]>((resolve, reject) => {
            fs.readdir(path, (error, children) => handleResult(resolve, reject, error, normalizeNFC(children)));
        });
    }

    export function stat(path: string): Promise<fs.Stats> {
        return new Promise<fs.Stats>((resolve, reject) => {
            fs.stat(path, (error, stat) => handleResult(resolve, reject, error, stat));
        });
    }

    export function readfile(path: string): Promise<Buffer> {
        return new Promise<Buffer>((resolve, reject) => {
            fs.readFile(path, (error, buffer) => handleResult(resolve, reject, error, buffer));
        });
    }

    export function writefile(path: string, content: Buffer): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            fs.writeFile(path, content, error => handleResult(resolve, reject, error, void 0));
        });
    }

    export function exists(path: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            fs.exists(path, exists => handleResult(resolve, reject, null, exists));
        });
    }

    export function rmrf(path: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            rimraf(path, error => handleResult(resolve, reject, error, void 0));
        });
    }

    export function mkdir(path: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            mkdirp(path, error => handleResult(resolve, reject, error, void 0));
        });
    }

    export function rename(oldPath: string, newPath: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            fs.rename(oldPath, newPath, error => handleResult(resolve, reject, error, void 0));
        });
    }

    export function unlink(path: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            fs.unlink(path, error => handleResult(resolve, reject, error, void 0));
        });
    }
}

export class FileStat implements vscode.FileStat {

    constructor(private fsStat: fs.Stats) { }

    get type(): vscode.FileType {
        return this.fsStat.isFile() ? vscode.FileType.File : this.fsStat.isDirectory() ? vscode.FileType.Directory : this.fsStat.isSymbolicLink() ? vscode.FileType.SymbolicLink : vscode.FileType.Unknown;
    }

    get isFile(): boolean | undefined {
        return this.fsStat.isFile();
    }

    get isDirectory(): boolean | undefined {
        return this.fsStat.isDirectory();
    }

    get isSymbolicLink(): boolean | undefined {
        return this.fsStat.isSymbolicLink();
    }

    get size(): number {
        return this.fsStat.size;
    }

    get ctime(): number {
        return this.fsStat.ctime.getTime();
    }

    get mtime(): number {
        return this.fsStat.mtime.getTime();
    }
}

interface Entry {
    label: string,
    uri: vscode.Uri | undefined;
    type: vscode.FileType;
    subEntry: Entry[];
}

//#endregion

export class BoomTreeDataProvider implements vscode.TreeDataProvider<Entry>, vscode.FileSystemProvider {

    private _onDidChangeFile: vscode.EventEmitter<vscode.FileChangeEvent[]>;
    private luaFiles: any[] = [];
    private _onDidChangeTreeData: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
    readonly onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;
    private fsWathcer:vscode.FileSystemWatcher = vscode.workspace.createFileSystemWatcher("**/*.lua",false,false,false);

    constructor() {
        this._onDidChangeFile = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
        this.bindWorkspaceEvent()
    }

    //Todo 这个也需要优化一下
    bindWorkspaceEvent() {
        vscode.workspace.onDidChangeWorkspaceFolders(() => {
            this.refresh();
        });
        this.fsWathcer.onDidChange(()=>{
            this.refresh();
        });
        this.fsWathcer.onDidCreate(()=>{
            this.refresh();
        });
        this.fsWathcer.onDidDelete(()=>{
            this.refresh();
        });
    }

    get onDidChangeFile(): vscode.Event<vscode.FileChangeEvent[]> {
        return this._onDidChangeFile.event;
    }

    public refresh(): any {
        this._onDidChangeTreeData.fire(undefined);
    }

    watch(uri: vscode.Uri, options: { recursive: boolean; excludes: string[]; }): vscode.Disposable {
        const watcher = fs.watch(uri.fsPath, { recursive: options.recursive }, async (event: string, filename: string | Buffer) => {
            const filepath = path.join(uri.fsPath, _.normalizeNFC(filename.toString()));

            // TODO support excludes (using minimatch library?)

            this._onDidChangeFile.fire([{
                type: event === 'change' ? vscode.FileChangeType.Changed : await _.exists(filepath) ? vscode.FileChangeType.Created : vscode.FileChangeType.Deleted,
                uri: uri.with({ path: filepath })
            } as vscode.FileChangeEvent]);
        });

        return { dispose: () => watcher.close() };
    }

    stat(uri: vscode.Uri): vscode.FileStat | Thenable<vscode.FileStat> {
        return this._stat(uri.fsPath);
    }

    async _stat(path: string): Promise<vscode.FileStat> {
        return new FileStat(await _.stat(path));
    }

    readDirectory(uri: vscode.Uri): [string, vscode.FileType][] | Thenable<[string, vscode.FileType][]> {
        return this._readDirectory(uri);
    }

    async _readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
        const children = await _.readdir(uri.fsPath);
        console.log(uri);
        
        var result: [string, vscode.FileType][] = [];
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const stat = await this._stat(path.join(uri.fsPath, child));
            if (stat.type === vscode.FileType.File){
                result.push([child, stat.type]);
            }else{
                const dirUri = vscode.Uri.file(path.join(uri.fsPath, child));
                const fileInFolder = await this.readDirectory(dirUri);
                console.log(fileInFolder);
                result = result.concat(fileInFolder);
            }
        }
        return Promise.resolve(result);
    }

    createDirectory(uri: vscode.Uri): void | Thenable<void> {
        return _.mkdir(uri.fsPath);
    }

    readFile(uri: vscode.Uri): Uint8Array | Thenable<Uint8Array> {
        return _.readfile(uri.fsPath);
    }

    writeFile(uri: vscode.Uri, content: Uint8Array, options: { create: boolean; overwrite: boolean; }): void | Thenable<void> {
        return this._writeFile(uri, content, options);
    }

    async _writeFile(uri: vscode.Uri, content: Uint8Array, options: { create: boolean; overwrite: boolean; }): Promise<void> {
        const exists = await _.exists(uri.fsPath);
        if (!exists) {
            if (!options.create) {
                throw vscode.FileSystemError.FileNotFound();
            }

            await _.mkdir(path.dirname(uri.fsPath));
        } else {
            if (!options.overwrite) {
                throw vscode.FileSystemError.FileExists();
            }
        }

        return _.writefile(uri.fsPath, content as Buffer);
    }

    delete(uri: vscode.Uri, options: { recursive: boolean; }): void | Thenable<void> {
        if (options.recursive) {
            return _.rmrf(uri.fsPath);
        }
        this.refresh()
        return _.unlink(uri.fsPath);
    }

    rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { overwrite: boolean; }): void | Thenable<void> {
        return this._rename(oldUri, newUri, options);
    }

    async _rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { overwrite: boolean; }): Promise<void> {
        const exists = await _.exists(newUri.fsPath);
        if (exists) {
            if (!options.overwrite) {
                throw vscode.FileSystemError.FileExists();
            } else {
                await _.rmrf(newUri.fsPath);
            }
        }

        const parentExists = await _.exists(path.dirname(newUri.fsPath));
        if (!parentExists) {
            await _.mkdir(path.dirname(newUri.fsPath));
        }
        this.refresh()
        return _.rename(oldUri.fsPath, newUri.fsPath);
    }

    ////* avatar methods ⬇️

    // 解析结果，生成对应的树
    parseResult(result: [string, vscode.FileType][]): Entry[] {
        const entries: Entry[] = []
        for (let rs of result) {
            if (rs[1] !== vscode.FileType.File) continue;
            let filename = rs[0];
            filename = filename.replace('.ModuleScript.lua', '')
            filename = filename.replace('.Script.lua', '')
            const paths = this.getNodePath(filename)
            let tempEntries = entries
            for (let i = 0; i < paths.length; i++) {
                if (i == paths.length - 1) {
                    tempEntries = this.buildTree(tempEntries, paths[i], rs[0])
                } else {
                    tempEntries = this.buildTree(tempEntries, paths[i])
                }
            }
        }

        return entries;
    }

    // 生成结果树
    buildTree(entries: Entry[], link: string, filename?: string): Entry[] {
        for (let entry of entries) {
            if (entry.label == link) {
                return entry.subEntry
            }
        }
        let newEntry: Entry
        if (filename && vscode.workspace.workspaceFolders) {
            // todo: 这里应该读取所有文件夹下的文件
            const workspaceFolder = vscode.workspace.workspaceFolders.filter(folder => folder.uri.scheme === 'file')[0];
            const uri = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, filename));
            newEntry = {
                label: filename,
                uri: uri,
                type: vscode.FileType.File,
                subEntry: []
            }
        } else {
            newEntry = {
                label: link,
                uri: undefined,
                type: vscode.FileType.SymbolicLink,
                subEntry: []
            }
        }

        entries.push(newEntry)
        return newEntry.subEntry
    }


    ////* tree data provider methods ⬇️

    async getChildren(element?: Entry): Promise<Entry[]> {
        if (element) {
            if (element.type == vscode.FileType.SymbolicLink) {
                element.subEntry.sort((a, b) => {
                    if (a.type !== b.type) {
                        return a.type === vscode.FileType.SymbolicLink ? -1 : 1;
                    }
                    return a.label.localeCompare(b.label);

                });
                return element.subEntry;
            }
        }

        // 入口
        if (vscode.workspace.workspaceFolders) {
            const workspaceFolder = vscode.workspace.workspaceFolders.filter(folder => folder.uri.scheme === 'file')[0];
            const children = await this.readDirectory(workspaceFolder.uri);
            children.sort((a, b) => {
                if (a[1] !== b[1]) {
                    return a[0].localeCompare(b[0]);
                }
                return a[1] === vscode.FileType.SymbolicLink ? -1 : 1;
            });
            const entries = this.parseResult(children)
            return entries
            
        }
        return [];
    }

    getTreeItem(element: Entry): vscode.TreeItem {
        let treeItem: vscode.TreeItem
        if (element.uri) {
            treeItem = new vscode.TreeItem(
                element.uri,
                element.type === vscode.FileType.SymbolicLink ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
            );
            treeItem.label = this.getNodePath(element.label)[this.getNodePath(element.label).length - 1]
            treeItem.iconPath = {
                light: path.join(__filename, '..', '..', 'resources', this.getNodeType(element.label) + '.svg'),
                dark: path.join(__filename, '..', '..', 'resources', this.getNodeType(element.label) + '.svg')
            }
        } else {
            treeItem = new vscode.TreeItem(
                element.label,
                element.type === vscode.FileType.SymbolicLink ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
            )
            treeItem.iconPath = {
                light: path.join(__filename, '..', '..', 'resources', 'folder.svg'),
                dark: path.join(__filename, '..', '..', 'resources', 'folder.svg')
            }
        }

        if (element.type === vscode.FileType.File) {
            treeItem.command = { command: 'fileExplorer.openFile', title: "Open File", arguments: [element.uri], };
            treeItem.contextValue = 'file';
        }

        return treeItem;
    }

    getNodePath(fileName: string): string[] {
        const result = fileName.match(/(?<=\')\w+(?=')/g)
        if (result) {
            return result;
        }
        else {
            return []
        }
    }

    getNodeType(fileName: string): string | undefined {
        const result = fileName.match(/(?<=\.)\w+(?=\.)/g);
        if (result) {
            return result[0];
        }
        return;
    }

    

}

export class FileExplorer {
    private boomTreeViewer:vscode.TreeView<Entry>;

    constructor(context: vscode.ExtensionContext) {
        const treeDataProvider = new BoomTreeDataProvider();
        this.boomTreeViewer = vscode.window.createTreeView('fileExplorer', { treeDataProvider });
        context.subscriptions.push(vscode.window.createTreeView('fileExplorer', { treeDataProvider }));
        vscode.commands.registerCommand('fileExplorer.openFile', (resource) => this.openResource(resource));
        vscode.commands.registerCommand('fileExplorer.refreshFile', () => treeDataProvider.refresh())
    }

    private openResource(resource: vscode.Uri): void {
        vscode.window.showTextDocument(resource);
    }
}