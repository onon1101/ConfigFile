"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vlogHoverProvider = void 0;
const vscode = require("vscode");
const hdlFs_1 = require("../../../hdlFs");
const hdlParser_1 = require("../../../hdlParser");
const keyword_1 = require("../util/keyword");
const util = require("../util");
const global_1 = require("../../../global");
const enum_1 = require("../../../global/enum");
const core_1 = require("../core");
class VlogHoverProvider {
    async provideHover(document, position, token) {
        // console.log('VlogHoverProvider');
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
            const hover = await this.makeHover(document, position, vlogAll, targetWord, wordRange);
            return hover;
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
    async makeHover(document, position, all, targetWord, targetWordRange) {
        const lineText = document.lineAt(position).text;
        const filePath = hdlFs_1.hdlPath.toSlash(document.fileName);
        // total content rendered on the hover box
        const content = new vscode.MarkdownString('', true);
        // match `include
        const includeResult = util.matchInclude(document, position, all.macro.includes);
        if (includeResult) {
            const absPath = hdlFs_1.hdlPath.rel2abs(filePath, includeResult.name);
            content.appendCodeblock(`"${absPath}"`, enum_1.HdlLangID.Verilog);
            const targetRange = document.getWordRangeAtPosition(position, /[1-9a-zA-Z_\.]+/);
            return new vscode.Hover(content, targetRange);
        }
        else if (lineText.trim().startsWith('`include')) {
            return null;
        }
        // match macro
        const macroResult = util.matchDefineMacro(position, targetWord, all.macro.defines);
        if (macroResult) {
            const name = macroResult.name;
            const value = macroResult.value;
            content.appendCodeblock(`\`define ${name} ${value}`, enum_1.HdlLangID.Verilog);
            return new vscode.Hover(content, targetWordRange);
        }
        // locate at one module        
        const scopeSymbols = util.locateVlogSymbol(position, all.content);
        if (!scopeSymbols || !scopeSymbols.module || !hdlParser_1.hdlParam.hasHdlModule(filePath, scopeSymbols.module.name)) {
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
                content.appendMarkdown('cannot find the definition of the module');
                return new vscode.Hover(content);
            }
            await util.makeVlogHoverContent(content, instModule);
            return new vscode.Hover(content);
        }
        // match port or param definition (position input)
        /** for example, when you hover the ".clk" below, the branch will be entered
        template u_template(
                 //input
                 .clk        		( clk        		),
             );
         *
         */
        if (util.isPositionInput(lineText, position.character)) {
            console.log('enter position input');
            const currentInstResult = util.filterInstanceByPosition(position, scopeSymbols.symbols, currentModule);
            if (!currentInstResult || !currentInstResult.instModPath) {
                return null;
            }
            console.log(currentInstResult);
            const instParamPromise = util.getInstParamByPosition(currentInstResult, position, targetWord);
            const instPortPromise = util.getInstPortByPosition(currentInstResult, position, targetWord);
            const instParam = await instParamPromise;
            const instPort = await instPortPromise;
            if (instParam) {
                const paramComment = await util.searchCommentAround(currentInstResult.instModPath, instParam.range);
                const paramDesc = util.makeParamDesc(instParam);
                content.appendCodeblock(paramDesc, enum_1.HdlLangID.Verilog);
                if (paramComment) {
                    content.appendCodeblock(paramComment, enum_1.HdlLangID.Verilog);
                }
                return new vscode.Hover(content);
            }
            if (instPort) {
                const portComment = await util.searchCommentAround(currentInstResult.instModPath, instPort.range);
                const portDesc = util.makePortDesc(instPort);
                content.appendCodeblock(portDesc, enum_1.HdlLangID.Verilog);
                if (portComment) {
                    content.appendCodeblock(portComment, enum_1.HdlLangID.Verilog);
                }
                return new vscode.Hover(content);
            }
            return null;
        }
        // match params
        const paramResult = util.matchParams(targetWord, currentModule);
        if (paramResult) {
            global_1.LspOutput.report('<vlog hover> get param info ' + paramResult?.name, global_1.ReportType.Info);
            const paramComment = await util.searchCommentAround(filePath, paramResult.range);
            const paramDesc = util.makeParamDesc(paramResult);
            content.appendCodeblock(paramDesc, enum_1.HdlLangID.Verilog);
            if (paramComment) {
                content.appendCodeblock(paramComment, enum_1.HdlLangID.Verilog);
            }
            return new vscode.Hover(content);
        }
        // match ports        
        const portResult = util.matchPorts(targetWord, currentModule);
        if (portResult) {
            global_1.LspOutput.report('<vlog hover> get port info ' + portResult?.name, global_1.ReportType.Info);
            const portComment = await util.searchCommentAround(filePath, portResult.range);
            const portDesc = util.makePortDesc(portResult);
            content.appendCodeblock(portDesc, enum_1.HdlLangID.Verilog);
            if (portComment) {
                content.appendCodeblock(portComment, enum_1.HdlLangID.Verilog);
            }
            return new vscode.Hover(content);
        }
        // match others        
        const normalResult = util.matchNormalSymbol(targetWord, scopeSymbols.symbols);
        if (normalResult) {
            const normalComment = await util.searchCommentAround(filePath, normalResult.range);
            const normalDesc = util.makeNormalDesc(normalResult);
            content.appendCodeblock(normalDesc, enum_1.HdlLangID.Verilog);
            if (normalComment) {
                content.appendCodeblock(normalComment, enum_1.HdlLangID.Verilog);
            }
            return new vscode.Hover(content);
        }
        // feature 1. number signed and unsigned number display
        const numberResult = util.transferVlogNumber(lineText, position.character);
        if (numberResult) {
            const bits = targetWord.length - 1;
            content.appendCodeblock(bits + "'" + targetWord, enum_1.HdlLangID.Verilog);
            content.appendMarkdown("`unsigned` " + numberResult.unsigned);
            content.appendText('\n');
            content.appendMarkdown("`signed` " + numberResult.signed);
        }
        return new vscode.Hover(content);
    }
}
const vlogHoverProvider = new VlogHoverProvider();
exports.vlogHoverProvider = vlogHoverProvider;
//# sourceMappingURL=vlog.js.map