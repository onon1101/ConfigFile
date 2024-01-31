"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformOldPpy = exports.insertTextToUri = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const fs = require("fs");
const global_1 = require("../global");
const hdlFs_1 = require("../hdlFs");
async function insertTextToUri(uri, text, position) {
    if (!position) {
        position = new vscode.Position(0, 0);
    }
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const edit = new vscode.WorkspaceEdit();
        edit.insert(uri, position, text);
        vscode.workspace.applyEdit(edit);
    }
}
exports.insertTextToUri = insertTextToUri;
const PPY_REPLACE = {
    TOOL_CHAIN: 'toolChain',
    PRJ_NAME: 'prjName',
    ARCH: 'arch',
    SOC: 'soc',
    enableShowlog: 'enableShowLog',
    Device: 'device'
};
const PPY_ARCH_REPLACE = {
    PRJ_Path: 'prjPath',
    Hardware: 'hardware',
    Software: 'software'
};
const PPY_LIB_REPLACE = {
    Hardware: 'hardware'
};
async function transformOldPpy() {
    const propertyJsonPath = global_1.opeParam.propertyJsonPath;
    if (fs.existsSync(propertyJsonPath)) {
        const oldPpyContent = hdlFs_1.hdlFile.readJSON(propertyJsonPath);
        if (oldPpyContent.ARCH) {
            for (const oldName of Object.keys(PPY_ARCH_REPLACE)) {
                const newName = PPY_ARCH_REPLACE[oldName];
                oldPpyContent.ARCH[newName] = oldPpyContent.ARCH[oldName];
                delete oldPpyContent.ARCH[oldName];
            }
        }
        if (oldPpyContent.library) {
            for (const oldName of Object.keys(PPY_LIB_REPLACE)) {
                const newName = PPY_LIB_REPLACE[oldName];
                oldPpyContent.library[newName] = oldPpyContent.library[oldName];
                delete oldPpyContent.library[oldName];
            }
        }
        for (const oldName of Object.keys(PPY_REPLACE)) {
            const newName = PPY_REPLACE[oldName];
            oldPpyContent[newName] = oldPpyContent[oldName];
            delete oldPpyContent[oldName];
        }
        hdlFs_1.hdlFile.writeJSON(propertyJsonPath, oldPpyContent);
    }
    else {
        vscode.window.showErrorMessage('You have\'t create property.json!');
    }
}
exports.transformOldPpy = transformOldPpy;
//# sourceMappingURL=tool.js.map