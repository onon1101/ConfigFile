"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vlogDefinitionProvider = void 0;
const vscode = require("vscode");
const hdlFs_1 = require("../../../hdlFs");
const hdlParser_1 = require("../../../hdlParser");
const keyword_1 = require("../util/keyword");
const util = require("../util");
const global_1 = require("../../../global");
const core_1 = require("../core");
class VlogDefinitionProvider {
    async provideDefinition(document, position, token) {
        // console.log('VlogDefinitionProvider');
        // get current words
        const wordRange = document.getWordRangeAtPosition(position, /[`_0-9A-Za-z]+/);
        if (!wordRange) {
            return null;
        }
        const targetWord = document.getText(wordRange);
        // check if need skip
        if (this.needSkip(document, position, targetWord)) {
            return null;
        }
        const filePath = document.fileName;
        const vlogAll = await core_1.hdlSymbolStorage.getSymbol(filePath);
        if (!vlogAll) {
            return null;
        }
        else {
            const location = await this.makeDefinition(document, position, vlogAll, targetWord, wordRange);
            return location;
        }
    }
    needSkip(document, position, targetWord) {
        // check keyword
        if (keyword_1.vlogKeyword.isKeyword(targetWord)) {
            return true;
        }
        // TODO: check comment
        return false;
    }
    async makeDefinition(document, position, all, targetWord, targetWordRange) {
        const filePath = hdlFs_1.hdlPath.toSlash(document.fileName);
        const lineText = document.lineAt(position).text;
        // match `include        
        const includeResult = util.matchInclude(document, position, all.macro.includes);
        if (includeResult) {
            const absPath = hdlFs_1.hdlPath.rel2abs(filePath, includeResult.name);
            const targetFile = vscode.Uri.file(absPath);
            const targetPosition = new vscode.Position(0, 0);
            const targetRange = new vscode.Range(targetPosition, targetPosition);
            const originSelectionRange = document.getWordRangeAtPosition(position, /["\.\\\/_0-9A-Za-z]+/);
            const link = { targetUri: targetFile, targetRange, originSelectionRange };
            return [link];
        }
        // match macro
        const macroResult = util.matchDefineMacro(position, targetWord, all.macro.defines);
        if (macroResult) {
            const targetRange = util.transformRange(macroResult.range, -1, -1);
            const link = { targetUri: document.uri, targetRange: targetRange, originSelectionRange: targetWordRange };
            return [link];
        }
        // locate at one module
        const scopeSymbols = util.locateVlogSymbol(position, all.content);
        if (!scopeSymbols || !scopeSymbols.module) {
            return null;
        }
        const currentModule = hdlParser_1.hdlParam.getHdlModule(filePath, scopeSymbols.module.name);
        if (!currentModule) {
            global_1.MainOutput.report('Fail to get HdlModule ' + filePath + ' ' + scopeSymbols.module.name, global_1.ReportType.Debug);
            return null;
        }
        // match instance
        const instResult = util.matchInstance(targetWord, currentModule);
        if (instResult) {
            const instModule = instResult.module;
            if (!instModule || !instResult.instModPath) {
                return null;
            }
            const targetFile = vscode.Uri.file(instResult.instModPath);
            const targetRange = util.transformRange(instModule.range, -1, 0, 1);
            const link = { targetUri: targetFile, targetRange };
            return [link];
        }
        // match port or param definition (position input)
        if (util.isPositionInput(lineText, position.character)) {
            const currentInstResult = util.filterInstanceByPosition(position, scopeSymbols.symbols, currentModule);
            if (!currentInstResult || !currentInstResult.instModPath) {
                return null;
            }
            const instParamPromise = util.getInstParamByPosition(currentInstResult, position, targetWord);
            const instPortPromise = util.getInstPortByPosition(currentInstResult, position, targetWord);
            const instParam = await instParamPromise;
            const instPort = await instPortPromise;
            const instModPathUri = vscode.Uri.file(currentInstResult.instModPath);
            if (instParam) {
                const targetRange = util.transformRange(instParam.range, -1, 0);
                const link = { targetUri: instModPathUri, targetRange };
                return [link];
            }
            if (instPort) {
                const targetRange = util.transformRange(instPort.range, -1, 0);
                const link = { targetUri: instModPathUri, targetRange };
                return [link];
            }
            return null;
        }
        // match params
        const paramResult = util.matchParams(targetWord, currentModule);
        if (paramResult) {
            const targetRange = util.transformRange(paramResult.range, -1, 0);
            const link = { targetUri: document.uri, targetRange };
            return [link];
        }
        // match ports
        const portResult = util.matchPorts(targetWord, currentModule);
        if (portResult) {
            const targetRange = util.transformRange(portResult.range, -1, 0);
            const link = { targetUri: document.uri, targetRange };
            return [link];
        }
        // match others
        const normalResult = util.matchNormalSymbol(targetWord, scopeSymbols.symbols);
        if (normalResult) {
            const targetRange = util.transformRange(normalResult.range, -1, 0);
            const link = { targetUri: document.uri, targetRange };
            return [link];
        }
        return null;
    }
}
const vlogDefinitionProvider = new VlogDefinitionProvider();
exports.vlogDefinitionProvider = vlogDefinitionProvider;
//# sourceMappingURL=vlog.js.map