"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VivadoLinter = exports.vivadoLinter = void 0;
const vscode = require("vscode");
const fs = require("fs");
const global_1 = require("../../../global");
const hdlFs_1 = require("../../../hdlFs");
const util_1 = require("../../../global/util");
const enum_1 = require("../../../global/enum");
class VivadoLinter {
    constructor() {
        this.executableFileMap = new Map();
        this.executableInvokeNameMap = new Map();
        this.linterArgsMap = new Map();
        this.diagnostic = vscode.languages.createDiagnosticCollection();
        // configure map for executable file name
        this.executableFileMap.set(enum_1.HdlLangID.Verilog, 'xvlog');
        this.executableFileMap.set(enum_1.HdlLangID.Vhdl, 'xvhdl');
        this.executableFileMap.set(enum_1.HdlLangID.SystemVerilog, 'xvlog');
        this.executableFileMap.set(enum_1.HdlLangID.Unknown, undefined);
        // configure map for argruments when lintering
        this.linterArgsMap.set(enum_1.HdlLangID.Verilog, ['--nolog']);
        this.linterArgsMap.set(enum_1.HdlLangID.Vhdl, ['--nolog']);
        this.linterArgsMap.set(enum_1.HdlLangID.SystemVerilog, ['--sv', '--nolog']);
        this.linterArgsMap.set(enum_1.HdlLangID.Unknown, []);
        // this.initialise(HdlLangID.Verilog);
        // this.initialise(HdlLangID.Vhdl);
        // this.initialise(HdlLangID.SystemVerilog);
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
            global_1.LspOutput.report('vivado linter is not available, please check prj.vivado.install.path in your setting', global_1.ReportType.Error, true);
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
            const tokens = line.split(/:?\s*(?:\[|\])\s*/);
            const headerInfo = tokens[0];
            // const standardInfo = tokens[1];
            const syntaxInfo = tokens[2];
            const parsedPath = tokens[3];
            if (headerInfo === 'ERROR') {
                const errorInfos = parsedPath.split(':');
                const errorLine = Math.max(parseInt(errorInfos[errorInfos.length - 1]) - 1, 0);
                global_1.LspOutput.report(`<xvlog linter> line: ${errorLine}, info: ${syntaxInfo}`, global_1.ReportType.Run);
                const range = this.makeCorrectRange(document, errorLine, syntaxInfo);
                const diag = new vscode.Diagnostic(range, syntaxInfo, vscode.DiagnosticSeverity.Error);
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
        // vivado install path stored in prj.vivado.install.path
        const vivadoConfig = vscode.workspace.getConfiguration('digital-ide.prj.vivado');
        const vivadoInstallPath = vivadoConfig.get('install.path', '');
        const executorName = this.executableFileMap.get(langID);
        if (executorName === undefined) {
            return undefined;
        }
        // e.g. xvlog.bat in windows, xvlog in linux
        const fullExecutorName = global_1.opeParam.os === 'win32' ? executorName + '.bat' : executorName;
        if (vivadoInstallPath.trim() === '' || !fs.existsSync(vivadoInstallPath)) {
            global_1.LspOutput.report(`User's Vivado Install Path "${vivadoInstallPath}", which is invalid. Use ${executorName} in default.`, global_1.ReportType.Warn);
            global_1.LspOutput.report('If you have doubts, check prj.vivado.install.path in setting', global_1.ReportType.Warn);
            return executorName;
        }
        else {
            global_1.LspOutput.report(`User's Vivado Install Path "${vivadoInstallPath}", which is invalid`);
            const executorPath = hdlFs_1.hdlPath.join(hdlFs_1.hdlPath.toSlash(vivadoInstallPath), fullExecutorName);
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
            global_1.LspOutput.report(`success to verify ${executorPath}, linter from vivado is ready to go!`, global_1.ReportType.Launch);
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
        return await this.setExecutableFilePath(executorPath, langID);
    }
}
exports.VivadoLinter = VivadoLinter;
const vivadoLinter = new VivadoLinter();
exports.vivadoLinter = vivadoLinter;
//# sourceMappingURL=vivado.js.map