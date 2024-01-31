"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshArchTree = exports.openFileByUri = exports.collapseTreeView = exports.expandTreeView = exports.moduleTreeProvider = exports.toolTreeProvider = exports.softwareTreeProvider = exports.hardwareTreeProvider = void 0;
const vscode = require("vscode");
const hdlFs_1 = require("../../hdlFs");
const command_1 = require("./command");
Object.defineProperty(exports, "hardwareTreeProvider", { enumerable: true, get: function () { return command_1.hardwareTreeProvider; } });
Object.defineProperty(exports, "softwareTreeProvider", { enumerable: true, get: function () { return command_1.softwareTreeProvider; } });
Object.defineProperty(exports, "toolTreeProvider", { enumerable: true, get: function () { return command_1.toolTreeProvider; } });
const tree_1 = require("./tree");
Object.defineProperty(exports, "moduleTreeProvider", { enumerable: true, get: function () { return tree_1.moduleTreeProvider; } });
async function openFileAtPosition(uri, line, character) {
    const document = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(document);
    const position = new vscode.Position(line, character);
    editor.selection = new vscode.Selection(position, position);
    editor.revealRange(new vscode.Range(position, position));
}
function openFileByUri(path, range) {
    if (range === undefined) {
        vscode.window.showErrorMessage(`${path} not support jump yet`);
        return;
    }
    if (hdlFs_1.hdlPath.exist(path)) {
        const uri = vscode.Uri.file(path);
        const start = range.start;
        openFileAtPosition(uri, start.line - 1, start.character);
    }
}
exports.openFileByUri = openFileByUri;
function refreshArchTree(element) {
    // TODO : diff and optimize
    tree_1.moduleTreeProvider.refresh(element);
}
exports.refreshArchTree = refreshArchTree;
function expandTreeView() {
    vscode.commands.executeCommand('setContext', 'TOOL-tree-expand', false);
}
exports.expandTreeView = expandTreeView;
function collapseTreeView() {
    vscode.commands.executeCommand('workbench.actions.treeView.digital-ide-treeView-arch.collapseAll');
    vscode.commands.executeCommand('setContext', 'TOOL-tree-expand', true);
}
exports.collapseTreeView = collapseTreeView;
//# sourceMappingURL=index.js.map