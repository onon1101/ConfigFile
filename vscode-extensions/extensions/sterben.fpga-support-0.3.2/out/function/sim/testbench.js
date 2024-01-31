"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testbench = void 0;
const vscode = require("vscode");
const global_1 = require("../../global");
const hdlFs_1 = require("../../hdlFs");
const core_1 = require("../../hdlParser/core");
const instance_1 = require("./instance");
function overwrite() {
    const options = {
        preview: false,
        viewColumn: vscode.ViewColumn.Active
    };
    const tbSrcPath = hdlFs_1.hdlPath.join(global_1.opeParam.extensionPath, 'lib', 'testbench.v');
    const uri = vscode.Uri.file(tbSrcPath);
    vscode.window.showTextDocument(uri, options);
}
function generateTestbenchFile(module) {
    const tbSrcPath = hdlFs_1.hdlPath.join(global_1.opeParam.extensionPath, 'lib', 'testbench.v');
    const tbDisPath = hdlFs_1.hdlPath.join(global_1.opeParam.prjInfo.arch.hardware.sim, 'testbench.v');
    if (!hdlFs_1.hdlFile.isFile(tbDisPath)) {
        var temp = hdlFs_1.hdlFile.readFile(tbSrcPath);
    }
    else {
        var temp = hdlFs_1.hdlFile.readFile(tbDisPath);
    }
    if (!temp) {
        return null;
    }
    let content = '';
    const lines = temp.split('\n');
    const len = lines.length;
    for (let index = 0; index < len; index++) {
        const line = lines[index];
        content += line + '\n';
        if (line.indexOf("//Instance ") !== -1) {
            content += (0, instance_1.instanceByLangID)(module) + '\n';
        }
    }
    try {
        hdlFs_1.hdlFile.writeFile(tbDisPath, content);
        global_1.MainOutput.report("Generate testbench to " + tbDisPath);
    }
    catch (err) {
        vscode.window.showErrorMessage("Generate testbench failed:" + err);
    }
}
async function testbench() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('please select a editor!');
        return;
    }
    const uri = editor.document.uri;
    const option = {
        placeHolder: 'Select a Module to generate testbench'
    };
    const path = hdlFs_1.hdlPath.toSlash(uri.fsPath);
    if (!hdlFs_1.hdlFile.isHDLFile(path)) {
        return;
    }
    console.log(path);
    const currentHdlFile = core_1.hdlParam.getHdlFile(path);
    if (!currentHdlFile) {
        vscode.window.showErrorMessage('There is no hdlFile respect to ' + path);
        return;
    }
    const currentHdlModules = currentHdlFile.getAllHdlModules();
    const items = (0, instance_1.getSelectItem)(currentHdlModules);
    const select = await vscode.window.showQuickPick(items, option);
    if (select) {
        generateTestbenchFile(items[0].module);
    }
}
exports.testbench = testbench;
//# sourceMappingURL=testbench.js.map