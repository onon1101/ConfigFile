"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelsimLinter = exports.modelsimLinter = void 0;
const vscode = require("vscode");
const fs = require("fs");
const global_1 = require("../../../global");
const hdlFs_1 = require("../../../hdlFs");
const util_1 = require("../../../global/util");
const enum_1 = require("../../../global/enum");
class ModelsimLinter {
    constructor() {
        this.executableFileMap = new Map();
        this.executableInvokeNameMap = new Map();
        this.linterArgsMap = new Map();
        this.diagnostic = vscode.languages.createDiagnosticCollection();
        // configure map for executable file name
        this.executableFileMap.set(enum_1.HdlLangID.Verilog, 'vlog');
        this.executableFileMap.set(enum_1.HdlLangID.Vhdl, 'vcom');
        this.executableFileMap.set(enum_1.HdlLangID.SystemVerilog, 'vlog');
        this.executableFileMap.set(enum_1.HdlLangID.Unknown, undefined);
        // configure map for argruments when lintering
        this.linterArgsMap.set(enum_1.HdlLangID.Verilog, ['-quiet', '-nologo']);
        this.linterArgsMap.set(enum_1.HdlLangID.Vhdl, ['-quiet', '-nologo', '-2008']);
        this.linterArgsMap.set(enum_1.HdlLangID.SystemVerilog, ['-quiet', '-nolog', '-sv']);
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
            const { stdout } = await (0, util_1.easyExec)(executor, args);
            if (stdout.length > 0) {
                const diagnostics = this.provideDiagnostics(document, stdout);
                this.diagnostic.set(document.uri, diagnostics);
            }
        }
        else {
            global_1.LspOutput.report('modelsim linter is not available, please check prj.modelsim.install.path in your setting!', global_1.ReportType.Error, true);
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
    provideDiagnostics(document, stdout) {
        const diagnostics = [];
        for (const line of stdout.split(/\r?\n/g)) {
            const tokens = line.split(/(Error|Warning).+?(?: *?(?:.+?(?:\\|\/))+.+?\((\d+?)\):|)(?: *?near "(.+?)":|)(?: *?\((.+?)\)|) +?(.+)/gm);
            const headerInfo = tokens[1];
            if (headerInfo === 'Error') {
                const errorLine = parseInt(tokens[2]) - 1;
                const syntaxInfo = tokens[5];
                global_1.LspOutput.report(`<vlog linter> line: ${errorLine}, info: ${syntaxInfo}`, global_1.ReportType.Run);
                const range = this.makeCorrectRange(document, errorLine, syntaxInfo);
                const diag = new vscode.Diagnostic(range, syntaxInfo, vscode.DiagnosticSeverity.Error);
                diagnostics.push(diag);
            }
            else if (headerInfo === 'Warning') {
                const errorLine = parseInt(tokens[2]) - 1;
                const syntaxInfo = tokens[5];
                global_1.LspOutput.report(`<vlog linter> line: ${errorLine}, info: ${syntaxInfo}`, global_1.ReportType.Run);
                const range = this.makeCorrectRange(document, errorLine, syntaxInfo);
                const diag = new vscode.Diagnostic(range, syntaxInfo, vscode.DiagnosticSeverity.Warning);
                diagnostics.push(diag);
            }
        }
        return diagnostics;
    }
    makeCorrectRange(document, line, syntaxInfo) {
        // extract all the words like 'adawwd' in a syntax info
        const singleQuoteWords = syntaxInfo.match(/'([^']*)'/g);
        if (singleQuoteWords && singleQuoteWords.length > 0) {
            const targetWord = singleQuoteWords.map(val => val.replace(/'/g, ''))[0];
            // find range of target word
            const textLine = document.lineAt(line);
            const text = textLine.text;
            const startCharacter = text.indexOf(targetWord);
            if (startCharacter > -1) {
                const endCharacter = startCharacter + targetWord.length;
                const range = new vscode.Range(new vscode.Position(line, startCharacter), new vscode.Position(line, endCharacter));
                return range;
            }
        }
        // else target the first word in the line
        return this.makeCommonRange(document, line, syntaxInfo);
    }
    makeCommonRange(document, line, syntaxInfo) {
        const startPosition = new vscode.Position(line, 0);
        const wordRange = document.getWordRangeAtPosition(startPosition, /[`_0-9a-zA-Z]+/);
        if (wordRange) {
            return wordRange;
        }
        else {
            return new vscode.Range(startPosition, startPosition);
        }
    }
    getExecutableFilePath(langID) {
        // modelsim install path stored in prj.modelsim.install.path
        const modelsimConfig = vscode.workspace.getConfiguration('digital-ide.prj.modelsim');
        const modelsimInstallPath = modelsimConfig.get('install.path', '');
        const executorName = this.executableFileMap.get(langID);
        if (executorName === undefined) {
            return undefined;
        }
        // e.g. vlog.exe in windows, vlog in linux
        const fullExecutorName = global_1.opeParam.os === 'win32' ? executorName + '.exe' : executorName;
        if (modelsimInstallPath.trim() === '' || !fs.existsSync(modelsimInstallPath)) {
            global_1.LspOutput.report(`User's modelsim Install Path "${modelsimInstallPath}", which is invalid. Use ${executorName} in default.`, global_1.ReportType.Warn);
            global_1.LspOutput.report('If you have doubts, check prj.modelsim.install.path in setting', global_1.ReportType.Warn);
            return executorName;
        }
        else {
            global_1.LspOutput.report(`User's modelsim Install Path "${modelsimInstallPath}", which is invalid`);
            const executorPath = hdlFs_1.hdlPath.join(hdlFs_1.hdlPath.toSlash(modelsimInstallPath), fullExecutorName);
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
            global_1.LspOutput.report(`success to verify ${executorPath}, linter from modelsim is ready to go!`, global_1.ReportType.Launch);
            return true;
        }
        else {
            this.executableInvokeNameMap.set(langID, undefined);
            global_1.LspOutput.report(`Fail to execute ${executorPath}! Reason: ${stderr}`, global_1.ReportType.Error, true);
            return false;
        }
    }
    async initialise(langID) {
        const executorPath = this.getExecutableFilePath(langID);
        return this.setExecutableFilePath(executorPath, langID);
    }
}
exports.ModelsimLinter = ModelsimLinter;
const modelsimLinter = new ModelsimLinter();
exports.modelsimLinter = modelsimLinter;
//# sourceMappingURL=modelsim.js.map