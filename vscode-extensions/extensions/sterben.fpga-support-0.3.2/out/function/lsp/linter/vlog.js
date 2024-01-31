"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vlogLinterManager = void 0;
const vscode = require("vscode");
const global_1 = require("../../../global");
const enum_1 = require("../../../global/enum");
const default_1 = require("./default");
const modelsim_1 = require("./modelsim");
const vivado_1 = require("./vivado");
const hdlFs_1 = require("../../../hdlFs");
class VlogLinterManager {
    constructor() {
        this.activateLinterName = 'default';
        this.initialized = false;
        // make a status bar for rendering
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
        this.statusBarItem.command = 'digital-ide.lsp.vlog.linter.pick';
        // when changing file, hide if langID is not verilog
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (!editor) {
                return;
            }
            const currentFileName = hdlFs_1.hdlPath.toSlash(editor.document.fileName);
            if (hdlFs_1.hdlFile.isVerilogFile(currentFileName)) {
                this.statusBarItem.show();
            }
            else {
                this.statusBarItem.hide();
            }
        });
        // update when user's config is changed
        vscode.workspace.onDidChangeConfiguration(() => {
            this.updateLinter();
        });
    }
    async initialise() {
        const success = await this.updateLinter();
        if (!success) {
            return;
        }
        this.initialized = true;
        for (const doc of vscode.workspace.textDocuments) {
            const fileName = hdlFs_1.hdlPath.toSlash(doc.fileName);
            if (hdlFs_1.hdlFile.isVerilogFile(fileName)) {
                await this.lint(doc);
            }
        }
        global_1.LspOutput.report('<vlog lsp manager> finish initialization of vlog linter. Linter name: ' + this.activateLinterName, global_1.ReportType.Launch);
        // hide it if current window is not verilog
        const editor = vscode.window.activeTextEditor;
        if (editor && hdlFs_1.hdlFile.isVerilogFile(editor.document.fileName)) {
            this.statusBarItem.show();
        }
        else {
            this.statusBarItem.hide();
        }
    }
    async lint(document) {
        this.currentLinter?.remove(document.uri);
        await this.currentLinter?.lint(document);
    }
    async remove(uri) {
        this.currentLinter?.remove(uri);
    }
    getUserDiagnostorSelection() {
        const vlogLspConfig = vscode.workspace.getConfiguration('digital-ide.function.lsp.linter.vlog');
        const diagnostor = vlogLspConfig.get('diagnostor', 'xxx');
        return diagnostor;
    }
    async updateLinter() {
        const diagnostorName = this.getUserDiagnostorSelection();
        const lastDiagnostorName = this.activateLinterName;
        const lastDiagnostor = this.currentLinter;
        if (this.initialized && diagnostorName === lastDiagnostorName) {
            // no need for update
            return true;
        }
        global_1.LspOutput.report(`<vlog lsp manager> detect linter setting changes, switch from ${lastDiagnostorName} to ${diagnostorName}.`, global_1.ReportType.Launch);
        let launch = false;
        switch (diagnostorName) {
            case 'vivado':
                launch = await this.activateVivado();
                break;
            case 'modelsim':
                launch = await this.activateModelsim();
                break;
            case 'default':
                launch = await this.activateDefault();
                break;
            default:
                launch = await this.activateDefault();
                break;
        }
        for (const doc of vscode.workspace.textDocuments) {
            const fileName = hdlFs_1.hdlPath.toSlash(doc.fileName);
            if (hdlFs_1.hdlFile.isVerilogFile(fileName)) {
                lastDiagnostor?.remove(doc.uri);
                await this.lint(doc);
            }
        }
        return launch;
    }
    async activateVivado() {
        const selectedLinter = vivado_1.vivadoLinter;
        let launch = true;
        launch = await selectedLinter.initialise(enum_1.HdlLangID.Verilog);
        if (launch) {
            this.statusBarItem.text = '$(getting-started-beginner) Linter(vivado)';
            global_1.LspOutput.report('<vlog lsp manager> vivado linter has been activated', global_1.ReportType.Info);
        }
        else {
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
            this.statusBarItem.tooltip = 'Fail to launch vivado linter';
            this.statusBarItem.text = '$(extensions-warning-message) Linter(vivado)';
            global_1.LspOutput.report('<vlog lsp manager> Fail to launch vivado linter', global_1.ReportType.Error);
        }
        this.currentLinter = selectedLinter;
        this.activateLinterName = 'vivado';
        this.statusBarItem.show();
        return launch;
    }
    async activateModelsim() {
        const selectedLinter = modelsim_1.modelsimLinter;
        let launch = true;
        launch = await selectedLinter.initialise(enum_1.HdlLangID.Verilog);
        if (launch) {
            this.statusBarItem.text = '$(getting-started-beginner) Linter(modelsim)';
            global_1.LspOutput.report('<vlog lsp manager> modelsim linter has been activated', global_1.ReportType.Info);
        }
        else {
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
            this.statusBarItem.tooltip = 'Fail to launch modelsim linter';
            this.statusBarItem.text = '$(extensions-warning-message) Linter(modelsim)';
            global_1.LspOutput.report('<vlog lsp manager> Fail to launch modelsim linter', global_1.ReportType.Error);
        }
        this.currentLinter = selectedLinter;
        this.activateLinterName = 'modelsim';
        this.statusBarItem.show();
        return launch;
    }
    async activateDefault() {
        const selectedLinter = default_1.defaultVlogLinter;
        let launch = true;
        if (launch) {
            this.statusBarItem.text = '$(getting-started-beginner) Linter(default)';
            global_1.LspOutput.report('<vlog lsp manager> default build-in linter has been activated', global_1.ReportType.Info);
        }
        else {
            this.statusBarItem.backgroundColor = undefined;
            this.statusBarItem.tooltip = 'Fail to launch default linter';
            this.statusBarItem.text = '$(extensions-warning-message) Linter(default)';
            global_1.LspOutput.report('<vlog lsp manager> Fail to launch default linter', global_1.ReportType.Error);
        }
        this.currentLinter = selectedLinter;
        this.activateLinterName = 'default';
        this.statusBarItem.show();
        return launch;
    }
}
const vlogLinterManager = new VlogLinterManager();
exports.vlogLinterManager = vlogLinterManager;
//# sourceMappingURL=vlog.js.map