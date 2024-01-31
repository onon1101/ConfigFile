"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultVhdlLinter = exports.DefaultVlogLinter = exports.defaultVhdlLinter = exports.defaultVlogLinter = void 0;
const vscode = require("vscode");
const core_1 = require("../core");
const global_1 = require("../../../global");
class DefaultVlogLinter {
    constructor() {
        this.diagnostic = vscode.languages.createDiagnosticCollection('Digital-IDE Default Linter');
    }
    async lint(document) {
        const filePath = document.fileName;
        const vlogAll = await core_1.hdlSymbolStorage.getSymbol(filePath);
        // console.log('lint all finish');
        if (vlogAll) {
            const diagnostics = this.provideDiagnostics(document, vlogAll);
            this.diagnostic.set(document.uri, diagnostics);
        }
    }
    provideDiagnostics(document, all) {
        const diagnostics = [];
        if (all.error && all.error.length > 0) {
            for (const hdlError of all.error) {
                global_1.LspOutput.report(`<default linter> line: ${hdlError.range.line}, info: ${hdlError.message}`, global_1.ReportType.Run);
                const syntaxInfo = hdlError.message.replace(/\\r\\n/g, '\n');
                const range = this.makeCorrectRange(document, hdlError.range);
                const diag = new vscode.Diagnostic(range, syntaxInfo, hdlError.severity);
                diag.source = hdlError.source;
                diagnostics.push(diag);
            }
        }
        return diagnostics;
    }
    makeCorrectRange(document, range) {
        range.line--;
        if (range.character === 0 && range.line > 0) {
            range.line--;
        }
        while (range.line > 0) {
            const lineContent = document.lineAt(range.line).text;
            if (lineContent.trim().length > 0) {
                break;
            }
            else {
                range.line--;
            }
        }
        const currentLine = document.lineAt(range.line).text;
        if (range.character === 0 && currentLine.trim().length > 0) {
            range.character = currentLine.trimEnd().length;
        }
        const position = new vscode.Position(range.line, range.character);
        const wordRange = document.getWordRangeAtPosition(position, /[`_0-9a-zA-Z]+/);
        if (wordRange) {
            return wordRange;
        }
        else {
            const errorEnd = new vscode.Position(range.line, range.character + 1);
            const errorRange = new vscode.Range(position, errorEnd);
            return errorRange;
        }
    }
    async remove(uri) {
        this.diagnostic.delete(uri);
    }
    async initialise() {
        // move code to outer layer
        return true;
    }
}
exports.DefaultVlogLinter = DefaultVlogLinter;
class DefaultVhdlLinter {
    constructor() {
        this.diagnostic = vscode.languages.createDiagnosticCollection();
    }
    async lint(document) {
        const filePath = document.fileName;
        const vhdlAll = await core_1.hdlSymbolStorage.getSymbol(filePath);
        // console.log('lint all finish');
        if (vhdlAll) {
            const diagnostics = this.provideDiagnostics(document, vhdlAll);
            this.diagnostic.set(document.uri, diagnostics);
        }
    }
    provideDiagnostics(document, all) {
        const diagnostics = [];
        if (all.error && all.error.length > 0) {
            for (const hdlError of all.error) {
                global_1.LspOutput.report(`<default linter> line: ${hdlError.range.line}, info: ${hdlError.message}`, global_1.ReportType.Run);
                const range = this.makeCorrectRange(document, hdlError.range);
                const diag = new vscode.Diagnostic(range, hdlError.message, hdlError.severity);
                diag.source = hdlError.source;
                diagnostics.push(diag);
            }
        }
        return diagnostics;
    }
    makeCorrectRange(document, range) {
        range.line--;
        if (range.character === 0 && range.line > 0) {
            range.line--;
        }
        while (range.line > 0) {
            const lineContent = document.lineAt(range.line).text;
            if (lineContent.trim().length > 0) {
                break;
            }
            else {
                range.line--;
            }
        }
        const currentLine = document.lineAt(range.line).text;
        if (range.character === 0 && currentLine.trim().length > 0) {
            range.character = currentLine.trimEnd().length;
        }
        const position = new vscode.Position(range.line, range.character);
        const wordRange = document.getWordRangeAtPosition(position, /[`_0-9a-zA-Z]+/);
        if (wordRange) {
            return wordRange;
        }
        else {
            const errorEnd = new vscode.Position(range.line, range.character + 1);
            const errorRange = new vscode.Range(position, errorEnd);
            return errorRange;
        }
    }
    async remove(uri) {
        this.diagnostic.delete(uri);
    }
    async initialise() {
        // move code to outer layer
        return true;
    }
}
exports.DefaultVhdlLinter = DefaultVhdlLinter;
const defaultVlogLinter = new DefaultVlogLinter();
exports.defaultVlogLinter = defaultVlogLinter;
const defaultVhdlLinter = new DefaultVhdlLinter();
exports.defaultVhdlLinter = defaultVhdlLinter;
//# sourceMappingURL=default.js.map