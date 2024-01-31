"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vlogPositionPortProvider = exports.vlogMacroCompletionProvider = exports.vlogIncludeCompletionProvider = exports.vlogCompletionProvider = void 0;
const vscode = require("vscode");
const fs = require("fs");
const util = require("../util");
const hdlFs_1 = require("../../../hdlFs");
const hdlParser_1 = require("../../../hdlParser");
const keyword_1 = require("../util/keyword");
const instance_1 = require("../../sim/instance");
const core_1 = require("../core");
class VlogIncludeCompletionProvider {
    provideCompletionItems(document, position, token, context) {
        // console.log('VlogIncludeCompletionProvider');
        try {
            const items = this.provideIncludeFiles(document, position);
            return items;
        }
        catch (err) {
            console.log(err);
        }
    }
    provideIncludeFiles(document, position) {
        if (position.character === 0) {
            return [];
        }
        const filePath = hdlFs_1.hdlPath.toSlash(document.fileName);
        const lineText = document.lineAt(position).text;
        let firstQIndex = lineText.lastIndexOf('"', position.character - 1);
        let lastQIndex = lineText.indexOf('"', position.character);
        if (firstQIndex !== -1 && lastQIndex !== -1) {
            const currentPath = lineText.substring(firstQIndex + 1, lastQIndex);
            const folderName = currentPath.length === 0 ? '.' : currentPath;
            const folderAbsPath = hdlFs_1.hdlPath.rel2abs(filePath, folderName);
            return this.filterIncludeFiles(folderAbsPath, filePath);
        }
        return [];
    }
    filterIncludeFiles(folderPath, currentPath) {
        if (fs.existsSync(folderPath)) {
            const suggestFiles = [];
            for (const fileName of fs.readdirSync(folderPath)) {
                const filePath = hdlFs_1.hdlPath.join(folderPath, fileName);
                if (filePath === currentPath) {
                    continue;
                }
                const stat = fs.statSync(filePath);
                const clItem = new vscode.CompletionItem(fileName);
                if (stat.isDirectory()) {
                    clItem.kind = vscode.CompletionItemKind.Folder;
                }
                else if (stat.isFile()) {
                    clItem.kind = vscode.CompletionItemKind.File;
                }
                suggestFiles.push(clItem);
            }
            return suggestFiles;
        }
        return [];
    }
}
;
class VlogMacroCompletionProvider {
    async provideCompletionItems(document, position, token, context) {
        // console.log('VlogMacroCompletionProvider');
        try {
            const targetWordRange = document.getWordRangeAtPosition(position, /[`_0-9a-zA-Z]+/);
            const targetWord = document.getText(targetWordRange);
            const filePath = document.fileName;
            const symbolResult = await core_1.hdlSymbolStorage.getSymbol(filePath);
            if (!symbolResult) {
                return null;
            }
            const items = this.provideMacros(targetWord, symbolResult.macro.defines);
            return items;
        }
        catch (err) {
            console.log(err);
        }
    }
    provideMacros(targetWord, defines) {
        const suggestMacros = [];
        if (!defines || defines.length === 0) {
            return suggestMacros;
        }
        for (const define of defines) {
            const name = '`' + define.name;
            const clItem = new vscode.CompletionItem(name, vscode.CompletionItemKind.Constant);
            clItem.detail = 'macro ' + define.replacement;
            clItem.insertText = targetWord.startsWith('`') ? define.name : name;
            suggestMacros.push(clItem);
        }
        return suggestMacros;
    }
}
class VlogPositionPortProvider {
    async provideCompletionItems(document, position, token, context) {
        // console.log('enter VlogPositionPortProvider');
        try {
            const suggestPositionPorts = [];
            const filePath = hdlFs_1.hdlPath.toSlash(document.fileName);
            const symbolResult = await core_1.hdlSymbolStorage.getSymbol(filePath);
            // console.log(symbolResult?.content);
            // console.log(position.character, position.line);
            if (!symbolResult) {
                return null;
            }
            const scopeSymbols = util.locateVlogSymbol(position, symbolResult.content);
            if (!scopeSymbols ||
                !scopeSymbols.module ||
                !scopeSymbols.symbols ||
                !hdlParser_1.hdlParam.hasHdlModule(filePath, scopeSymbols.module.name)) {
                return suggestPositionPorts;
            }
            const currentModule = hdlParser_1.hdlParam.getHdlModule(filePath, scopeSymbols.module.name);
            if (!currentModule) {
                return;
            }
            const currentInst = util.filterInstanceByPosition(position, scopeSymbols.symbols, currentModule);
            // find instance and instMod is not null (solve the dependence already)
            if (currentInst && currentInst.module && currentInst.instModPath) {
                const portsparams = this.providePositionPorts(position, currentInst);
                suggestPositionPorts.push(...portsparams);
            }
            return suggestPositionPorts;
        }
        catch (err) {
            console.log(err);
        }
    }
    providePositionPorts(position, currentInst) {
        if (!currentInst.module) {
            return [];
        }
        const params = currentInst.instparams;
        const ports = currentInst.instports;
        if (params &&
            util.positionAfterEqual(position, params.start) &&
            util.positionAfterEqual(params.end, position)) {
            return currentInst.module.params.map(param => {
                const clItem = new vscode.CompletionItem(param.name, vscode.CompletionItemKind.Constant);
                clItem.detail = 'param';
                return clItem;
            });
        }
        if (ports &&
            util.positionAfterEqual(position, ports.start) &&
            util.positionAfterEqual(ports.end, position)) {
            return currentInst.module.ports.map(port => {
                const clItem = new vscode.CompletionItem(port.name, vscode.CompletionItemKind.Interface);
                clItem.detail = 'port';
                return clItem;
            });
        }
        return [];
    }
}
class VlogCompletionProvider {
    async provideCompletionItems(document, position, token, context) {
        // console.log('VlogCompletionProvider');
        try {
            const filePath = hdlFs_1.hdlPath.toSlash(document.fileName);
            // 1. provide keyword
            const completions = this.makeKeywordItems(document, position);
            completions.push(...this.makeCompilerKeywordItems(document, position));
            completions.push(...this.makeSystemKeywordItems(document, position));
            const symbolResult = await core_1.hdlSymbolStorage.getSymbol(filePath);
            if (!symbolResult) {
                return completions;
            }
            // locate at one module
            const scopeSymbols = util.locateVlogSymbol(position, symbolResult.content);
            if (!scopeSymbols ||
                !scopeSymbols.module ||
                !hdlParser_1.hdlParam.hasHdlModule(filePath, scopeSymbols.module.name)) {
                // MainOutput.report('Fail to get HdlModule ' + filePath + ' ' + scopeSymbols?.module.name, ReportType.Debug);
                return completions;
            }
            // find wrapper module
            const currentModule = hdlParser_1.hdlParam.getHdlModule(filePath, scopeSymbols.module.name);
            if (!currentModule) {
                return completions;
            }
            // 3. provide modules
            const suggestModulesPromise = this.provideModules(document, position, filePath, symbolResult.macro.includes);
            // 4. provide params and ports of wrapper module
            const suggestParamsPortsPromise = this.provideParamsPorts(currentModule);
            // 5. provide nets
            const suggestNetsPromise = this.provideNets(scopeSymbols.symbols);
            // collect
            completions.push(...await suggestModulesPromise);
            completions.push(...await suggestParamsPortsPromise);
            completions.push(...await suggestNetsPromise);
            return completions;
        }
        catch (err) {
            console.log(err);
        }
    }
    makeKeywordItems(document, position) {
        if (this.keywordItems !== undefined && this.keywordItems.length > 0) {
            return this.keywordItems;
        }
        const vlogKeywordItems = [];
        for (const keyword of keyword_1.vlogKeyword.keys()) {
            const clItem = this.makekeywordCompletionItem(keyword);
            vlogKeywordItems.push(clItem);
        }
        this.keywordItems = vlogKeywordItems;
        return vlogKeywordItems;
    }
    makeCompilerKeywordItems(document, position) {
        const items = [];
        const targetRange = document.getWordRangeAtPosition(position, /[`_0-9a-zA-Z]+/);
        const targetWord = document.getText(targetRange);
        const prefix = targetWord.startsWith('`') ? '' : '`';
        for (const keyword of keyword_1.vlogKeyword.compilerKeys()) {
            const clItem = new vscode.CompletionItem(keyword, vscode.CompletionItemKind.Keyword);
            clItem.insertText = new vscode.SnippetString(prefix + keyword);
            clItem.detail = 'compiler directive';
            items.push(clItem);
        }
        return items;
    }
    makeSystemKeywordItems(document, position) {
        const items = [];
        for (const keyword of keyword_1.vlogKeyword.systemKeys()) {
            const clItem = new vscode.CompletionItem(keyword, vscode.CompletionItemKind.Method);
            clItem.insertText = new vscode.SnippetString('\\$' + keyword + '($1);');
            clItem.detail = 'system task';
            items.push(clItem);
        }
        return items;
    }
    makekeywordCompletionItem(keyword) {
        const clItem = new vscode.CompletionItem(keyword, vscode.CompletionItemKind.Keyword);
        clItem.detail = 'verilog keyword';
        switch (keyword) {
            case 'begin':
                clItem.insertText = new vscode.SnippetString("begin$1\nend");
                break;
            case 'function':
                clItem.insertText = new vscode.SnippetString("function ${1:name}\n\nendfunction");
                break;
            default: break;
        }
        return clItem;
    }
    async provideModules(document, position, filePath, includes) {
        const suggestModules = [];
        const lspVlogConfig = vscode.workspace.getConfiguration('digital-ide.function.lsp.completion.vlog');
        const autoAddInclude = lspVlogConfig.get('autoAddInclude', true);
        const completeWholeInstante = lspVlogConfig.get('completeWholeInstante', true);
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
        for (const module of hdlParser_1.hdlParam.getAllHdlModules()) {
            const clItem = new vscode.CompletionItem(module.name, vscode.CompletionItemKind.Class);
            // feature 1 : auto add include path if there's no corresponding include path
            if (autoAddInclude && !includePaths.has(module.path)) {
                const relPath = hdlFs_1.hdlPath.relative(fileFolder, module.path);
                const includeString = '`include "' + relPath + '"\n';
                const textEdit = new vscode.TextEdit(insertRange, includeString);
                clItem.additionalTextEdits = [textEdit];
            }
            // feature 2 : auto complete instance
            if (completeWholeInstante) {
                const snippetString = (0, instance_1.instanceVlogCode)(module, '', true);
                clItem.insertText = new vscode.SnippetString(snippetString);
            }
            clItem.detail = 'module';
            suggestModules.push(clItem);
        }
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
const vlogCompletionProvider = new VlogCompletionProvider();
exports.vlogCompletionProvider = vlogCompletionProvider;
const vlogIncludeCompletionProvider = new VlogIncludeCompletionProvider();
exports.vlogIncludeCompletionProvider = vlogIncludeCompletionProvider;
const vlogMacroCompletionProvider = new VlogMacroCompletionProvider();
exports.vlogMacroCompletionProvider = vlogMacroCompletionProvider;
const vlogPositionPortProvider = new VlogPositionPortProvider();
exports.vlogPositionPortProvider = vlogPositionPortProvider;
//# sourceMappingURL=vlog.js.map