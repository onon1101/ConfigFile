"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.svlogLinterManager = void 0;
const vscode = require("vscode");
const global_1 = require("../../../global");
const enum_1 = require("../../../global/enum");
const default_1 = require("./default");
const modelsim_1 = require("./modelsim");
const vivado_1 = require("./vivado");
const hdlFs_1 = require("../../../hdlFs");
class SvlogLinterManager {
    constructor() {
        this.activateLinterName = 'default';
        this.initialized = false;
        // make a status bar for rendering
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
        this.statusBarItem.command = 'digital-ide.lsp.svlog.linter.pick';
        // when changing file, hide if langID is not verilog
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (!editor) {
                return;
            }
            const currentFileName = hdlFs_1.hdlPath.toSlash(editor.document.fileName);
            if (hdlFs_1.hdlFile.isSystemVerilogFile(currentFileName)) {
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
            if (hdlFs_1.hdlFile.isSystemVerilogFile(fileName)) {
                await this.lint(doc);
            }
        }
        global_1.LspOutput.report('<svlog lsp manager> finish initialization of svlog linter. Linter name: ' + this.activateLinterName, global_1.ReportType.Launch);
        // hide it if current window is not verilog
        const editor = vscode.window.activeTextEditor;
        if (editor && hdlFs_1.hdlFile.isSystemVerilogFile(editor.document.fileName)) {
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
        const vlogLspConfig = vscode.workspace.getConfiguration('digital-ide.function.lsp.linter.svlog');
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
        global_1.LspOutput.report(`<svlog lsp manager> detect linter setting changes, switch from ${lastDiagnostorName} to ${diagnostorName}.`, global_1.ReportType.Launch);
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
            if (hdlFs_1.hdlFile.isSystemVerilogFile(fileName)) {
                lastDiagnostor?.remove(doc.uri);
                await this.lint(doc);
            }
        }
        return launch;
    }
    async activateVivado() {
        const selectedLinter = vivado_1.vivadoLinter;
        let launch = true;
        launch = await selectedLinter.initialise(enum_1.HdlLangID.SystemVerilog);
        if (launch) {
            this.statusBarItem.text = '$(getting-started-beginner) Linter(vivado)';
            global_1.LspOutput.report('<svlog lsp manager> vivado linter has been activated', global_1.ReportType.Info);
        }
        else {
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
            this.statusBarItem.tooltip = 'Fail to launch vivado linter';
            this.statusBarItem.text = '$(extensions-warning-message) Linter(vivado)';
            global_1.LspOutput.report('<svlog lsp manager> Fail to launch vivado linter', global_1.ReportType.Error);
        }
        this.currentLinter = selectedLinter;
        this.activateLinterName = 'vivado';
        this.statusBarItem.show();
        return launch;
    }
    async activateModelsim() {
        const selectedLinter = modelsim_1.modelsimLinter;
        let launch = true;
        launch = await selectedLinter.initialise(enum_1.HdlLangID.SystemVerilog);
        if (launch) {
            this.statusBarItem.text = '$(getting-started-beginner) Linter(modelsim)';
            global_1.LspOutput.report('<svlog lsp manager> modelsim linter has been activated', global_1.ReportType.Info);
        }
        else {
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
            this.statusBarItem.tooltip = 'Fail to launch modelsim linter';
            this.statusBarItem.text = '$(extensions-warning-message) Linter(modelsim)';
            global_1.LspOutput.report('<svlog lsp manager> Fail to launch modelsim linter', global_1.ReportType.Error);
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
            global_1.LspOutput.report('<svlog lsp manager> default build-in linter has been activated', global_1.ReportType.Info);
        }
        else {
            this.statusBarItem.backgroundColor = undefined;
            this.statusBarItem.tooltip = 'Fail to launch default linter';
            this.statusBarItem.text = '$(extensions-warning-message) Linter(default)';
            global_1.LspOutput.report('<svlog lsp manager> Fail to launch default linter', global_1.ReportType.Error);
        }
        this.currentLinter = selectedLinter;
        this.activateLinterName = 'default';
        this.statusBarItem.show();
        return launch;
    }
}
const svlogLinterManager = new SvlogLinterManager();
exports.svlogLinterManager = svlogLinterManager;
//# sourceMappingURL=svlog.js.map