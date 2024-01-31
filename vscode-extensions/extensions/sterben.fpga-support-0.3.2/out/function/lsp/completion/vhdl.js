"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vhdlCompletionProvider = void 0;
const vscode = require("vscode");
const keyword_1 = require("../util/keyword");
const hdlFs_1 = require("../../../hdlFs");
const core_1 = require("../core");
class VhdlCompletionProvider {
    async provideCompletionItems(document, position, token, context) {
        try {
            const filePath = hdlFs_1.hdlPath.toSlash(document.fileName);
            // 1. provide keyword
            const completions = this.makeKeywordItems(document, position);
            const symbolResult = await core_1.hdlSymbolStorage.getSymbol(filePath);
            if (!symbolResult) {
                return completions;
            }
            const symbols = symbolResult.content;
            for (const symbol of symbols) {
                const kind = this.getCompletionItemKind(symbol.type);
                const clItem = new vscode.CompletionItem(symbol.name, kind);
                completions.push(clItem);
            }
            return completions;
        }
        catch (err) {
            console.log(err);
        }
    }
    getCompletionItemKind(type) {
        switch (type) {
            case 'entity':
                return vscode.CompletionItemKind.Class;
                break;
            case 'port':
                return vscode.CompletionItemKind.Variable;
                break;
            default:
                return vscode.CompletionItemKind.Value;
                break;
        }
    }
    makeKeywordItems(document, position) {
        if (this.keywordItems !== undefined && this.keywordItems.length > 0) {
            return this.keywordItems;
        }
        const vhdlKeywordItems = [];
        for (const keyword of keyword_1.vhdlKeyword.keys()) {
            const clItem = this.makekeywordCompletionItem(keyword, 'vhdl keyword');
            vhdlKeywordItems.push(clItem);
        }
        for (const keyword of keyword_1.vhdlKeyword.compilerKeys()) {
            const clItem = this.makekeywordCompletionItem(keyword, 'IEEE lib function');
            vhdlKeywordItems.push(clItem);
        }
        for (const keyword of keyword_1.vhdlKeyword.systemKeys()) {
            const clItem = this.makekeywordCompletionItem(keyword, 'vhdl keyword');
            vhdlKeywordItems.push(clItem);
        }
        this.keywordItems = vhdlKeywordItems;
        return vhdlKeywordItems;
    }
    makekeywordCompletionItem(keyword, detail) {
        const clItem = new vscode.CompletionItem(keyword, vscode.CompletionItemKind.Keyword);
        clItem.detail = detail;
        switch (keyword) {
            case 'begin':
                clItem.insertText = new vscode.SnippetString("begin$1\nend");
                break;
            case 'entity':
                clItem.insertText = new vscode.SnippetString("entity ${1:name} is\n\t${2:content}\nend entity;");
                break;
            case 'architecture':
                clItem.insertText = new vscode.SnippetString("architecture ${1:name} of ${2:entity} is\n\t${3:definition}\nbegin\n\t${4:content}\nend architecture;");
                break;
            default: break;
        }
        return clItem;
    }
    async provideModules(document, position, filePath, includes) {
        const suggestModules = [];
        const lspVhdlConfig = vscode.workspace.getConfiguration('digital-ide.function.lsp.completion.vhdl');
        const autoAddInclude = lspVhdlConfig.get('autoAddInclude', true);
        const completeWholeInstante = lspVhdlConfig.get('completeWholeInstante', true);
        const includePaths = new Set();
        let lastIncludeLine = 0;
        for (const include of includes) {
            const absIncludePath = hdlFs_1.hdlPath.rel2abs(filePath, include.path);
            includePaths.add(absIncludePath);
            lastIncludeLine = Math.max(include.range.end.line, lastIncludeLine);
        }
        const insertPosition = new vscode.Position(lastIncludeLine, 0);
        const insertRange = new vscode.Range(insertPosition, insertPosition);
        const fileFolder = hdlFs_1.hdlPath.resolve(filePath, '..');
        // used only when completeWholeInstante is true
        let completePrefix = '';
        if (completeWholeInstante) {
            const wordRange = document.getWordRangeAtPosition(position);
            const countStart = wordRange ? wordRange.start.character : position.character;
            const spaceNumber = Math.floor(countStart / 4) * 4;
            console.log(wordRange, countStart, spaceNumber);
            completePrefix = ' '.repeat(spaceNumber);
        }
        // for (const module of hdlParam.getAllHdlModules()) {            
        //     const clItem = new vscode.CompletionItem(module.name, vscode.CompletionItemKind.Class);
        //     // feature 1 : auto add include path if there's no corresponding include path
        //     if (autoAddInclude && !includePaths.has(module.path)) {
        //         const relPath: RelPath = hdlPath.relative(fileFolder, module.path);
        //         const includeString = '`include "' + relPath + '"\n';
        //         const textEdit = new vscode.TextEdit(insertRange, includeString);
        //         clItem.additionalTextEdits = [textEdit];
        //     }
        //     // feature 2 : auto complete instance
        //     if (completeWholeInstante) {
        //         const snippetString = instanceVhdlCode(module, '', true);
        //         clItem.insertText = new vscode.SnippetString(snippetString);
        //     }
        //     clItem.detail = 'module';
        //     suggestModules.push(clItem);
        // }
        return suggestModules;
    }
    async provideParamsPorts(module) {
        if (!module) {
            return [];
        }
        const suggestParamsPorts = [];
        for (const param of module.params) {
            const clItem = new vscode.CompletionItem(param.name, vscode.CompletionItemKind.Constant);
            clItem.detail = 'param';
            suggestParamsPorts.push(clItem);
        }
        for (const port of module.ports) {
            const clItem = new vscode.CompletionItem(port.name, vscode.CompletionItemKind.Interface);
            clItem.detail = 'port';
            suggestParamsPorts.push(clItem);
        }
        return suggestParamsPorts;
    }
    async provideNets(symbols) {
        if (!symbols) {
            return [];
        }
        const suggestNets = [];
        for (const symbol of symbols) {
            if (symbol.type === 'wire' || symbol.type === 'reg') {
                const clItem = new vscode.CompletionItem(symbol.name, vscode.CompletionItemKind.Variable);
                clItem.sortText = '';
                clItem.detail = symbol.type;
                suggestNets.push(clItem);
            }
        }
        return suggestNets;
    }
}
;
const vhdlCompletionProvider = new VhdlCompletionProvider();
exports.vhdlCompletionProvider = vhdlCompletionProvider;
//# sourceMappingURL=vhdl.js.map