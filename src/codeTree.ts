import * as vscode from 'vscode';
import * as json from 'jsonc-parser';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

export class CodeTreeProvider implements vscode.TreeDataProvider<Dependency> {

    private _onDidChangeTreeData: vscode.EventEmitter<Dependency | undefined | void> = new vscode.EventEmitter<Dependency | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<Dependency | undefined | void> = this._onDidChangeTreeData.event;
    private ignoreList = ['.git', '.gitattributes', '.vscode', '.github', '.gitignore']

    // private tree: json.Node;
    private jsonTree: any = {}

    constructor(private workspaceRoot: string) {
        // console.log('constructor constructor constructor constructor');
        console.log(workspaceRoot);
        this.parseTree(this.workspaceRoot, '.root', this.jsonTree);
        console.log(this.jsonTree);
    }

    refresh(): void {
        // console.log("refresh refresh refresh refresh refresh");
        console.log(this.workspaceRoot);
        this.parseTree(this.workspaceRoot, '.root', this.jsonTree);
        console.log(this.jsonTree);
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: Dependency): vscode.TreeItem {
        return element;
    }

    private parseTree(fpath: string, fname: string, tree: any) {
        if (!fpath || fpath === undefined || fpath === "" || !fs.existsSync(fpath)) {
            vscode.window.showInformationMessage('No dependency in empty workspace');
            console.log('No dependency in empty workspace');
            return;
        }
        const stats = fs.statSync(fpath);
        if (stats.isFile()) {
            // TODO
            if (!this.ignoreList.includes(fname)) {
                tree[fname] = fpath;
            }
        } else if (stats.isDirectory()) {
            tree[fname] = {}
            fs.readdirSync(fpath)
                .filter(file => !this.ignoreList.includes(file))
                .forEach(file => {
                    this.parseTree(path.join(fpath, file).toString(), file, tree[fname]);
                })
        }
    }

    getChildren(element?: Dependency): Thenable<Dependency[]> {
        if (!this.workspaceRoot) {
            vscode.window.showInformationMessage('No dependency in empty workspace');
            return Promise.resolve([]);
        }

        return Promise.resolve([new Dependency(this.workspaceRoot, "0.1", vscode.TreeItemCollapsibleState.None)]);
    }
}

export class Dependency extends vscode.TreeItem {

    constructor(
        public readonly label: string,
        private readonly version: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);

        this.tooltip = `${this.label}-${this.version}`;
        this.description = this.version;
    }

    iconPath = {
        light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
        dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
    };

    contextValue = 'dependency';
}

