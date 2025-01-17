"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vhdlHoverProvider = void 0;
const vscode = require("vscode");
const hdlFs_1 = require("../../../hdlFs");
const hdlParser_1 = require("../../../hdlParser");
const keyword_1 = require("../util/keyword");
const util = require("../util");
const core_1 = require("../core");
class VhdlHoverProvider {
    async provideHover(document, position, token) {
        // console.log('VhdlHoverProvider');
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
        const keywordHover = this.getKeywordHover(targetWord);
        if (keywordHover) {
            return keywordHover;
        }
        const filePath = document.fileName;
        const vhdlAll = await core_1.hdlSymbolStorage.getSymbol(filePath);
        if (!vhdlAll) {
            return null;
        }
        else {
            const hover = await this.makeHover(document, position, vhdlAll, targetWord, wordRange);
            return hover;
        }
    }
    getKeywordHover(words) {
        const content = new vscode.MarkdownString('', true);
        if (keyword_1.vhdlKeyword.compilerKeys().has(words)) {
            content.appendMarkdown('IEEE Library data type');
            return new vscode.Hover(content);
        }
        return undefined;
    }
    needSkip(document, position, targetWord) {
        // check keyword
        if (keyword_1.vhdlKeyword.isKeyword(targetWord)) {
            return true;
        }
        // TODO: check comment
        return false;
    }
    async makeHover(document, position, all, targetWord, targetWordRange) {
        const lineText = document.lineAt(position).text;
        const filePath = hdlFs_1.hdlPath.toSlash(document.fileName);
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
            return await this.makeArchitectureHover(filePath, targetWord, targetWordRange, moduleScope);
        }
        else if (scopeType === 'entity') {
            return await this.makeEntityHover(filePath, targetWord, targetWordRange, moduleScope);
        }
        return null;
    }
    async makeArchitectureHover(filePath, targetWord, targetWordRange, moduleScope) {
        const architecture = moduleScope.module;
        const content = new vscode.MarkdownString('', true);
        // point to the entity of the architecture
        if (architecture.parent && architecture.parent === targetWord) {
            const entity = hdlParser_1.hdlParam.getHdlModule(filePath, architecture.parent);
            if (entity) {
                await util.makeVhdlHoverContent(content, entity);
                return new vscode.Hover(content);
            }
        }
        // filter defined signal
        for (const symbol of moduleScope.symbols) {
            if (symbol.name === targetWord) {
                content.appendCodeblock(symbol.type, 'vhdl');
                return new vscode.Hover(content);
            }
        }
        // inner variable mapping to entity
        if (architecture.parent) {
            const entity = hdlParser_1.hdlParam.getHdlModule(filePath, architecture.parent);
            if (entity) {
                // find params definitio
                for (const param of entity.params) {
                    if (param.name === targetWord) {
                        const desc = util.makeParamDesc(param);
                        content.appendCodeblock(desc, 'vhdl');
                        return new vscode.Hover(content);
                    }
                }
                // find ports definition
                for (const port of entity.ports) {
                    if (port.name === targetWord) {
                        const desc = util.makePortDesc(port);
                        content.appendCodeblock(desc, 'vhdl');
                        return new vscode.Hover(content);
                    }
                }
            }
        }
        return null;
    }
    async makeEntityHover(filePath, targetWord, targetWordRange, moduleScope) {
        const entity = hdlParser_1.hdlParam.getHdlModule(filePath, moduleScope.module.name);
        const content = new vscode.MarkdownString('', true);
        if (entity) {
            if (targetWord === entity.name) {
                await util.makeVhdlHoverContent(content, entity);
                return new vscode.Hover(content);
            }
            // find params definitio
            for (const param of entity.params) {
                if (param.name === targetWord) {
                    const desc = util.makeParamDesc(param);
                    content.appendCodeblock(desc, 'vhdl');
                    return new vscode.Hover(content);
                }
            }
            // find ports definition
            for (const port of entity.ports) {
                if (port.name === targetWord) {
                    const desc = util.makePortDesc(port);
                    content.appendCodeblock(desc, 'vhdl');
                    return new vscode.Hover(content);
                }
            }
        }
        return null;
    }
}
const vhdlHoverProvider = new VhdlHoverProvider();
exports.vhdlHoverProvider = vhdlHoverProvider;
//# sourceMappingURL=vhdl.js.map