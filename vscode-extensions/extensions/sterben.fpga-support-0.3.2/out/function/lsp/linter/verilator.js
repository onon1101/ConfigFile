"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerilatorLinter = exports.verilatorLinter = void 0;
const vscode = require("vscode");
const fs = require("fs");
const global_1 = require("../../../global");
const hdlFs_1 = require("../../../hdlFs");
const util_1 = require("../../../global/util");
const enum_1 = require("../../../global/enum");
class VerilatorLinter {
    constructor() {
        this.executableFileMap = new Map();
        this.executableInvokeNameMap = new Map();
        this.linterArgsMap = new Map();
        this.diagnostic = vscode.languages.createDiagnosticCollection();
        // configure map for executable file name
        this.executableFileMap.set(enum_1.HdlLangID.Verilog, 'verilator');
        this.executableFileMap.set(enum_1.HdlLangID.SystemVerilog, 'verilator');
        this.executableFileMap.set(enum_1.HdlLangID.Unknown, undefined);
        // configure map for argruments when lintering
        this.linterArgsMap.set(enum_1.HdlLangID.Verilog, ['--lint-only', '-Wall', '-bbox-sys', '--bbox-unsup', '-DGLBL']);
        this.linterArgsMap.set(enum_1.HdlLangID.SystemVerilog, ['--lint-only', '-sv', '-Wall', '-bbox-sys', '--bbox-unsup', '-DGLBL']);
        this.linterArgsMap.set(enum_1.HdlLangID.Unknown, []);
    }
    async lint(document) {
        const filePath = hdlFs_1.hdlPath.toSlash(document.fileName);
        const langID = hdlFs_1.hdlFile.getLanguageId(filePath);
        // acquire install path
        const linterArgs = this.linterArgsMap.get(langID);
        if (linterArgs === undefined) {
            return;
        }
        const args = [filePath, ...linterArgs];
        const executor = this.executableInvokeNameMap.get(langID);
        if (executor !== undefined) {
            const { stderr } = await (0, util_1.easyExec)(executor, args);
            if (stderr.length > 0) {
                const diagnostics = this.provideDiagnostics(document, stderr);
                this.diagnostic.set(document.uri, diagnostics);
            }
        }
        else {
            global_1.LspOutput.report('verilator linter is not available, please check prj.verilator.install.path in your setting', global_1.ReportType.Error, true);
        }
    }
    async remove(uri) {
        this.diagnostic.delete(uri);
    }
    /**
     * @param document
     * @param stdout stdout from xvlog
     * @returns { vscode.Diagnostic[] } linter info
     */
    provideDiagnostics(document, stderr) {
        const diagnostics = [];
        for (let line of stderr.split(/\r?\n/g)) {
            if (!line.startsWith('%')) {
                continue;
            }
            else {
                line = line.substring(1);
            }
            const tokens = line.split(':');
            if (tokens.length < 3) {
                continue;
            }
            const header = tokens[0].toLowerCase();
            const fileName = tokens[1];
            const lineNo = parseInt(tokens[2]) - 1;
            const characterNo = parseInt(tokens[3]) - 1;
            const syntaxInfo = tokens[4];
            if (header.startsWith('warning')) {
                const range = this.makeCorrectRange(document, lineNo, characterNo);
                const diag = new vscode.Diagnostic(range, syntaxInfo, vscode.DiagnosticSeverity.Warning);
                diagnostics.push(diag);
            }
            else if (header.startsWith('error')) {
                const range = this.makeCorrectRange(document, lineNo, characterNo);
                const diag = new vscode.Diagnostic(range, syntaxInfo, vscode.DiagnosticSeverity.Error);
                diagnostics.push(diag);
            }
        }
        return diagnostics;
    }
    makeCorrectRange(document, line, character) {
        const startPosition = new vscode.Position(line, character);
        const wordRange = document.getWordRangeAtPosition(startPosition, /[`_0-9a-zA-Z]+/);
        if (wordRange) {
            return wordRange;
        }
        else {
            return new vscode.Range(startPosition, startPosition);
        }
    }
    getExecutableFilePath(langID) {
        // verilator install path stored in prj.verilator.install.path
        const verilatorConfig = vscode.workspace.getConfiguration('digital-ide.prj.verilator');
        const verilatorInstallPath = verilatorConfig.get('install.path', '');
        const executorName = this.executableFileMap.get(langID);
        if (executorName === undefined) {
            return undefined;
        }
        // e.g. vlog.exe in windows, vlog in linux
        const fullExecutorName = global_1.opeParam.os === 'win32' ? executorName + '.exe' : executorName;
        if (verilatorInstallPath.trim() === '' || !fs.existsSync(verilatorInstallPath)) {
            global_1.LspOutput.report(`User's verilator Install Path ${verilatorInstallPath}, which is invalid. Use ${executorName} in default.`, global_1.ReportType.Warn);
            global_1.LspOutput.report('If you have doubts, check prj.verilator.install.path in setting', global_1.ReportType.Warn);
            return executorName;
        }
        else {
            global_1.LspOutput.report(`User's verilator Install Path ${verilatorInstallPath}, which is invalid`);
            const executorPath = hdlFs_1.hdlPath.join(hdlFs_1.hdlPath.toSlash(verilatorInstallPath), fullExecutorName);
            // prevent path like C://stupid name/xxx/xxx/bin
            // blank space
            const safeExecutorPath = '"' + executorPath + '"';
            return safeExecutorPath;
        }
    }
    async setExecutableFilePath(executorPath, langID) {
        if (executorPath === undefined) {
            return false;
        }
        const { stderr } = await (0, util_1.easyExec)(executorPath, []);
        if (stderr.length === 0) {
            this.executableInvokeNameMap.set(langID, executorPath);
            global_1.LspOutput.report(`success to verify ${executorPath}, linter from verilator is ready to go!`, global_1.ReportType.Launch);
            return true;
        }
        else {
            this.executableInvokeNameMap.set(langID, undefined);
            console.log(stderr);
            global_1.LspOutput.report(`Fail to execute ${executorPath}! Reason: ${stderr}`, global_1.ReportType.Error, true);
            return false;
        }
    }
    async initialise(langID) {
        const executorPath = this.getExecutableFilePath(langID);
        return this.setExecutableFilePath(executorPath, langID);
    }
}
exports.VerilatorLinter = VerilatorLinter;
const verilatorLinter = new VerilatorLinter();
exports.verilatorLinter = verilatorLinter;
//# sourceMappingURL=verilator.js.map