"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pickSvlogLinter = exports.pickVhdlLinter = exports.pickVlogLinter = void 0;
const vscode = require("vscode");
const vivado_1 = require("./vivado");
const modelsim_1 = require("./modelsim");
const enum_1 = require("../../../global/enum");
const util_1 = require("../../../global/util");
let _selectVlogLinter = null;
let _selectVhdlLinter = null;
async function makeDefaultPickItem() {
    return {
        label: '$(getting-started-beginner) default',
        name: 'default',
        available: true,
        description: 'Digital-IDE build in diagnostic tool',
        detail: 'inner build is ready'
    };
}
async function makeVivadoPickItem(langID) {
    const executablePath = vivado_1.vivadoLinter.getExecutableFilePath(langID);
    const linterName = vivado_1.vivadoLinter.executableFileMap.get(langID);
    if (executablePath) {
        const { stderr } = await (0, util_1.easyExec)(executablePath, []);
        if (stderr.length > 0) {
            return {
                label: '$(extensions-warning-message) vivado',
                name: 'vivado',
                available: false,
                description: `vivado diagnostic tool ${linterName}`,
                detail: `${executablePath} is not available`
            };
        }
    }
    return {
        label: '$(getting-started-beginner) vivado',
        name: 'vivado',
        available: true,
        description: `vivado diagnostic tool ${linterName}`,
        detail: `${executablePath} is ready`
    };
}
async function makeModelsimPickItem(langID) {
    const executablePath = modelsim_1.modelsimLinter.getExecutableFilePath(langID);
    const linterName = modelsim_1.modelsimLinter.executableFileMap.get(langID);
    if (executablePath) {
        const { stderr } = await (0, util_1.easyExec)(executablePath, []);
        if (stderr.length > 0) {
            return {
                label: '$(extensions-warning-message) modelsim',
                name: 'modelsim',
                available: false,
                description: `modelsim diagnostic tool ${linterName}`,
                detail: `${executablePath} is not available`
            };
        }
    }
    return {
        label: '$(getting-started-beginner) modelsim',
        name: 'modelsim',
        available: true,
        description: `modelsim diagnostic tool ${linterName}`,
        detail: `${executablePath} is ready`
    };
}
async function pickVlogLinter() {
    const pickWidget = vscode.window.createQuickPick();
    pickWidget.placeholder = 'select a linter for verilog code diagnostic';
    pickWidget.canSelectMany = false;
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Parsing local environment ...',
        cancellable: true
    }, async () => {
        pickWidget.items = [
            await makeDefaultPickItem(),
            await makeVivadoPickItem(enum_1.HdlLangID.Verilog),
            await makeModelsimPickItem(enum_1.HdlLangID.Verilog)
        ];
    });
    pickWidget.onDidChangeSelection(items => {
        const selectedItem = items[0];
        _selectVlogLinter = selectedItem.name;
    });
    pickWidget.onDidAccept(() => {
        if (_selectVlogLinter) {
            const vlogLspConfig = vscode.workspace.getConfiguration('digital-ide.function.lsp.linter.vlog');
            vlogLspConfig.update('diagnostor', _selectVlogLinter);
            pickWidget.hide();
        }
    });
    pickWidget.show();
}
exports.pickVlogLinter = pickVlogLinter;
async function pickSvlogLinter() {
    const pickWidget = vscode.window.createQuickPick();
    pickWidget.placeholder = 'select a linter for verilog code diagnostic';
    pickWidget.canSelectMany = false;
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Parsing local environment ...',
        cancellable: true
    }, async () => {
        pickWidget.items = [
            // TODO : add this if system verilog is supported
            // await makeDefaultPickItem(),
            await makeVivadoPickItem(enum_1.HdlLangID.Verilog),
            await makeModelsimPickItem(enum_1.HdlLangID.Verilog)
        ];
    });
    pickWidget.onDidChangeSelection(items => {
        const selectedItem = items[0];
        _selectVlogLinter = selectedItem.name;
    });
    pickWidget.onDidAccept(() => {
        if (_selectVlogLinter) {
            const vlogLspConfig = vscode.workspace.getConfiguration('digital-ide.function.lsp.linter.svlog');
            vlogLspConfig.update('diagnostor', _selectVlogLinter);
            pickWidget.hide();
        }
    });
    pickWidget.show();
}
exports.pickSvlogLinter = pickSvlogLinter;
async function pickVhdlLinter() {
    const pickWidget = vscode.window.createQuickPick();
    pickWidget.placeholder = 'select a linter for code diagnostic';
    pickWidget.canSelectMany = false;
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Parsing local environment ...',
        cancellable: true
    }, async () => {
        pickWidget.items = [
            await makeDefaultPickItem(),
            await makeVivadoPickItem(enum_1.HdlLangID.Vhdl),
            await makeModelsimPickItem(enum_1.HdlLangID.Vhdl)
        ];
    });
    pickWidget.onDidChangeSelection(items => {
        const selectedItem = items[0];
        _selectVlogLinter = selectedItem.name;
    });
    pickWidget.onDidAccept(() => {
        if (_selectVlogLinter) {
            const vlogLspConfig = vscode.workspace.getConfiguration('digital-ide.function.lsp.linter.vhdl');
            vlogLspConfig.update('diagnostor', _selectVlogLinter);
            pickWidget.hide();
        }
    });
    pickWidget.show();
}
exports.pickVhdlLinter = pickVhdlLinter;
//# sourceMappingURL=command.js.map