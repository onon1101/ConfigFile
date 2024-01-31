"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vhdlDocSymbolProvider = void 0;
const vscode = require("vscode");
const core_1 = require("../core");
;
const vhdlSymbolKind = {
    entity: vscode.SymbolKind.Interface,
    port: vscode.SymbolKind.Property,
    architecture: vscode.SymbolKind.Variable,
    signal: vscode.SymbolKind.Property
};
class VhdlDocSymbolProvider {
    async provideDocumentSymbols(document, token) {
        const path = document.fileName;
        const vhdlAll = await core_1.hdlSymbolStorage.getSymbol(path);
        if (!vhdlAll || !vhdlAll.content) {
            return [];
        }
        else {
            const symbols = vhdlAll.content;
            const symbolInfos = this.makeDocumentSymbols(document, symbols);
            return symbolInfos;
        }
    }
    makeDocumentSymbols(document, symbols) {
        const docSymbols = [];
        for (const symbol of symbols) {
            const symbolStart = new vscode.Position(symbol.range.start.line - 1, symbol.range.start.character);
            const symbolEnd = new vscode.Position(symbol.range.end.line - 1, symbol.range.end.character);
            const symbolRange = new vscode.Range(symbolStart, symbolEnd);
            if (symbol.type === 'entity') {
                const docSymbol = new vscode.DocumentSymbol(symbol.name, symbol.name, vhdlSymbolKind[symbol.type], symbolRange, symbolRange);
                docSymbols.push(docSymbol);
            }
            else if (symbol.type === 'port') {
                const parentEntity = docSymbols[docSymbols.length - 1];
                const docSymbol = new vscode.DocumentSymbol(symbol.name, symbol.name, vhdlSymbolKind[symbol.type], symbolRange, symbolRange);
                parentEntity.children.push(docSymbol);
            }
            else if (symbol.type === 'architecture') {
                const docSymbol = new vscode.DocumentSymbol(symbol.name, symbol.name, vhdlSymbolKind[symbol.type], symbolRange, symbolRange);
                docSymbols.push(docSymbol);
            }
            else if (symbol.type === 'signal') {
                const parentArchitecture = docSymbols[docSymbols.length - 1];
                if (parentArchitecture.kind === vhdlSymbolKind['architecture']) {
                    const docSymbol = new vscode.DocumentSymbol(symbol.name, symbol.name, vhdlSymbolKind[symbol.type], symbolRange, symbolRange);
                    parentArchitecture.children.push(docSymbol);
                }
            }
        }
        return docSymbols;
    }
}
const vhdlDocSymbolProvider = new VhdlDocSymbolProvider();
exports.vhdlDocSymbolProvider = vhdlDocSymbolProvider;
//# sourceMappingURL=vhdl.js.map