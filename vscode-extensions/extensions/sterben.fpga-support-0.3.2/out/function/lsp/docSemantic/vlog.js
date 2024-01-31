"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vlogLegend = exports.vlogDocSenmanticProvider = void 0;
const vscode = require("vscode");
const util_1 = require("../util");
const tokenTypes = ['class', 'function', 'variable'];
const tokenModifiers = ['declaration', 'documentation'];
const vlogLegend = new vscode.SemanticTokensLegend(tokenTypes, tokenModifiers);
exports.vlogLegend = vlogLegend;
class VlogDocSenmanticProvider {
    async provideDocumentSemanticTokens(document, token) {
        // TODO : finish this
        const tokensBuilder = new vscode.SemanticTokensBuilder(vlogLegend);
        // const filePath = document.fileName;
        // const vlogAll = await HdlSymbol.all(filePath);
        // if (vlogAll) {
        //     this.prepareTokensBuilder(tokensBuilder, vlogAll);
        // }
        return tokensBuilder.build();
    }
    prepareTokensBuilder(builder, all) {
        for (const rawSymbol of all.content) {
            const semanticRange = (0, util_1.transformRange)(rawSymbol.range, -1, 0);
            const tokenType = this.getTokenTypes(rawSymbol.type);
            if (tokenType) {
                builder.push(semanticRange, tokenType);
            }
        }
    }
    getTokenTypes(type) {
        switch (type) {
            case 'input':
                return 'variable';
            case 'output':
                return 'variable';
            case 'wire':
                return 'variable';
            case 'reg':
                return 'variable';
            default:
                return;
        }
    }
}
const vlogDocSenmanticProvider = new VlogDocSenmanticProvider();
exports.vlogDocSenmanticProvider = vlogDocSenmanticProvider;
//# sourceMappingURL=vlog.js.map