"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tclCompletionProvider = void 0;
const vscode = require("vscode");
const keyword_1 = require("../util/keyword");
const global_1 = require("../../../global");
class TCLCompletionProvider {
    constructor() {
        this.keywordsCompletionItems = this.provideKeywords();
        global_1.MainOutput.report('lsp for tcl is ready');
    }
    provideCompletionItems(document, position, token, context) {
        try {
            const items = this.provideKeywords();
            return items;
        }
        catch (err) {
            console.log(err);
        }
    }
    provideKeywords() {
        if (this.keywordsCompletionItems === undefined) {
            const keywords = [];
            for (const tcl of keyword_1.tclKeyword.keys()) {
                const item = new vscode.CompletionItem(tcl);
                item.kind = vscode.CompletionItemKind.Keyword;
                keywords.push(item);
            }
            this.keywordsCompletionItems = keywords;
            global_1.MainOutput.report('tcl lsp is ready');
        }
        return this.keywordsCompletionItems;
    }
}
const tclCompletionProvider = new TCLCompletionProvider();
exports.tclCompletionProvider = tclCompletionProvider;
//# sourceMappingURL=tcl.js.map