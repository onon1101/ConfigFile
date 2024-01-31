"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showDocWebview = exports.registerProjectDocExport = exports.registerFileDocExport = void 0;
const vscode = require("vscode");
const markdown_1 = require("./markdown");
const html_1 = require("./html");
Object.defineProperty(exports, "showDocWebview", { enumerable: true, get: function () { return html_1.showDocWebview; } });
const pdf_1 = require("./pdf");
const availableFormat = [
    'markdown', 'pdf', 'html'
];
class ExportFunctionItem {
    constructor(format, title, detail, exportFunc) {
        // TODO : 等到sv的解析做好后，写入对于不同hdl的图标
        let iconID = '$(export-' + format + ') ';
        this.label = iconID + title;
        this.format = format;
        this.exportFunc = exportFunc;
        this.detail = detail;
    }
}
;
function registerFileDocExport(context) {
    vscode.commands.registerCommand('digital-ide.hdlDoc.exportFile', async () => {
        const option = {
            placeHolder: 'Select an Export Format'
        };
        const items = [
            new ExportFunctionItem('markdown', ' markdown', 'export markdown folder', markdown_1.exportCurrentFileDocAsMarkdown),
            new ExportFunctionItem('pdf', ' pdf', 'only support light theme', pdf_1.exportCurrentFileDocAsPDF),
            new ExportFunctionItem('html', ' html', 'only support light theme', html_1.exportCurrentFileDocAsHTML)
        ];
        const item = await vscode.window.showQuickPick(items, option);
        if (item) {
            item.exportFunc();
        }
    });
}
exports.registerFileDocExport = registerFileDocExport;
function registerProjectDocExport(context) {
    vscode.commands.registerCommand('digital-ide.hdlDoc.exportProject', async () => {
        const option = {
            placeHolder: 'Select an Export Format'
        };
        const items = [
            new ExportFunctionItem('markdown', ' markdown', 'export markdown folder', markdown_1.exportProjectDocAsMarkdown),
            new ExportFunctionItem('pdf', ' pdf', 'only support light theme', pdf_1.exportProjectDocAsPDF),
            new ExportFunctionItem('html', ' html', 'only support light theme', html_1.exportProjectDocAsHTML)
        ];
        const item = await vscode.window.showQuickPick(items, option);
        if (item) {
            item.exportFunc();
        }
    });
}
exports.registerProjectDocExport = registerProjectDocExport;
//# sourceMappingURL=index.js.map