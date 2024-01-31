"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vhdlDefinitionProvider = void 0;
const vscode = require("vscode");
const hdlFs_1 = require("../../../hdlFs");
const hdlParser_1 = require("../../../hdlParser");
const keyword_1 = require("../util/keyword");
const util = require("../util");
const core_1 = require("../core");
class VhdlDefinitionProvider {
    async provideDefinition(document, position, token) {
        // console.log('VhdlDefinitionProvider');
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
        // locate at one entity or architecture
        // TODO: remove it after adjust of backend
        const rawSymbols = [];
        for (const symbol of all.content) {
            const rawSymbol = {
                name: symbol.name,
                type: symbol.type,
                parent: symbol.parent,
                range: util.transformRange(symbol.range, -1),
                signed: symbol.signed,
                netType: symbol.netType
            };
            rawSymbols.push(rawSymbol);
        }
        const moduleScope = util.locateVhdlSymbol(position, rawSymbols);
        if (!moduleScope) {
            return null;
        }
        const scopeType = moduleScope.module.type;
        if (scopeType === 'architecture') {
            return await this.makeArchitectureDefinition(filePath, targetWord, targetWordRange, moduleScope);
        }
        else if (scopeType === 'entity') {
            return await this.makeEntityDefinition(filePath, targetWord, targetWordRange, moduleScope);
        }
        return null;
    }
    async makeArchitectureDefinition(filePath, targetWord, targetWordRange, moduleScope) {
        const architecture = moduleScope.module;
        // point to the entity of the architecture
        if (architecture.parent && architecture.parent === targetWord) {
            const entity = hdlParser_1.hdlParam.getHdlModule(filePath, architecture.parent);
            if (entity) {
                const targetUri = vscode.Uri.file(entity.path);
                const targetRange = util.transformRange(entity.range, -1, 0);
                const link = { targetUri, targetRange, originSelectionRange: targetWordRange };
                return [link];
            }
        }
        // filter defined signal
        for (const symbol of moduleScope.symbols) {
            if (symbol.name === targetWord) {
                const targetUri = vscode.Uri.file(filePath);
                const targetRange = util.transformRange(symbol.range, 0, 0);
                const link = { targetUri, targetRange, originSelectionRange: targetWordRange };
                return [link];
            }
        }
        // inner variable mapping to entity
        if (architecture.parent) {
            const entity = hdlParser_1.hdlParam.getHdlModule(filePath, architecture.parent);
            if (entity) {
                // find params definitio
                for (const param of entity.params) {
                    if (param.name === targetWord) {
                        const targetUri = vscode.Uri.file(entity.path);
                        const targetRange = util.transformRange(param.range, -1, 0);
                        const link = { targetUri, targetRange, originSelectionRange: targetWordRange };
                        return [link];
                    }
                }
                // find ports definition
                for (const port of entity.ports) {
                    if (port.name === targetWord) {
                        const targetUri = vscode.Uri.file(entity.path);
                        const targetRange = util.transformRange(port.range, -1, 0);
                        const link = { targetUri, targetRange, originSelectionRange: targetWordRange };
                        return [link];
                    }
                }
            }
        }
        return null;
    }
    async makeEntityDefinition(filePath, targetWord, targetWordRange, moduleScope) {
        const entity = hdlParser_1.hdlParam.getHdlModule(filePath, moduleScope.module.name);
        if (entity) {
            if (targetWord === entity.name) {
                const targetUri = vscode.Uri.file(entity.path);
                const targetRange = util.transformRange(entity.range, -1, 0);
                const link = { targetUri, targetRange, originSelectionRange: targetWordRange };
                return [link];
            }
            // find params definitio
            for (const param of entity.params) {
                if (param.name === targetWord) {
                    const targetUri = vscode.Uri.file(entity.path);
                    const targetRange = util.transformRange(param.range, -1, 0);
                    const link = { targetUri, targetRange, originSelectionRange: targetWordRange };
                    return [link];
                }
            }
            // find ports definition
            for (const port of entity.ports) {
                if (port.name === targetWord) {
                    const targetUri = vscode.Uri.file(entity.path);
                    const targetRange = util.transformRange(port.range, -1, 0);
                    const link = { targetUri, targetRange, originSelectionRange: targetWordRange };
                    return [link];
                }
            }
        }
        return null;
    }
}
const vhdlDefinitionProvider = new VhdlDefinitionProvider();
exports.vhdlDefinitionProvider = vhdlDefinitionProvider;
//# sourceMappingURL=vhdl.js.map