"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportProjectDocAsPDF = exports.exportCurrentFileDocAsPDF = void 0;
const vscode = require("vscode");
const fs = require("fs");
const puppeteer = require("puppeteer-core");
const html_1 = require("./html");
const hdlFs_1 = require("../../hdlFs");
const global_1 = require("../../global");
// TODO : finish it in each platform
function getDefaultBrowerPath() {
    switch (global_1.opeParam.os) {
        case 'win32': return 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
        case 'linux': return '';
        default: return '';
    }
}
/**
 * @description transform a html file to pdf file
 * @param htmlPath absolute path of input html
 * @param pdfPath output path of pdf
*/
async function htmlFile2PdfFile(htmlPath, pdfPath) {
    const pdfConfig = vscode.workspace.getConfiguration("digital-ide.function.doc.pdf");
    const platformDefaultBrowerPath = getDefaultBrowerPath();
    const browserPath = pdfConfig.get('browserPath', platformDefaultBrowerPath);
    if (!fs.existsSync(browserPath)) {
        vscode.window.showErrorMessage("Path " + browserPath + " is not a valid browser path!");
        return;
    }
    const browser = await puppeteer.launch({
        executablePath: browserPath,
        args: ['--lang=' + vscode.env.language, '--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    const uriFilePath = vscode.Uri.file(htmlPath).toString();
    await page.goto(uriFilePath, { waitUntil: 'networkidle0' });
    const options = {
        path: pdfPath,
        scale: pdfConfig.scale,
        displayHeaderFooter: pdfConfig.displayHeaderFooter,
        headerTemplate: pdfConfig.headerTemplate,
        footerTemplate: pdfConfig.footerTemplate,
        printBackground: pdfConfig.printBackground,
        landscape: pdfConfig.landscape,
        format: pdfConfig.format,
        margin: {
            top: pdfConfig.margin.top + 'cm',
            right: pdfConfig.margin.right + 'cm',
            bottom: pdfConfig.margin.bottom + 'cm',
            left: pdfConfig.margin.left + 'cm'
        }
    };
    await page.pdf(options);
    await browser.close();
}
async function exportCurrentFileDocAsPDF() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    const currentFilePath = hdlFs_1.hdlPath.toSlash(editor.document.fileName);
    const hdlFileName = hdlFs_1.hdlPath.basename(currentFilePath);
    const wsPath = global_1.opeParam.workspacePath;
    return vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: '[Digital-IDE]: Export ' + currentFilePath + '...'
    }, async (progress) => {
        try {
            const html = await (0, html_1.makeShowHTML)("pdf");
            if (!html) {
                return;
            }
            const pdfFolderPath = hdlFs_1.hdlPath.join(wsPath, 'pdf');
            if (!fs.existsSync(pdfFolderPath)) {
                fs.mkdirSync(pdfFolderPath);
            }
            const pdfName = hdlFileName + '.pdf';
            const pdfPath = hdlFs_1.hdlPath.join(pdfFolderPath, pdfName);
            if (fs.existsSync(pdfPath)) {
                hdlFs_1.hdlFile.rmSync(pdfPath);
            }
            const tempHtmlName = hdlFileName + '.tmp.html';
            const tempHtmlPath = hdlFs_1.hdlPath.join(pdfFolderPath, tempHtmlName);
            if (fs.existsSync(tempHtmlPath)) {
                hdlFs_1.hdlFile.rmSync(tempHtmlPath);
            }
            fs.writeFileSync(tempHtmlPath, html);
            await htmlFile2PdfFile(tempHtmlPath, pdfPath);
            hdlFs_1.hdlFile.rmSync(tempHtmlPath);
        }
        catch (error) {
            global_1.MainOutput.report("error happen in export pdf: " + error, global_1.ReportType.Error);
        }
    });
}
exports.exportCurrentFileDocAsPDF = exportCurrentFileDocAsPDF;
function exportProjectDocAsPDF() {
    vscode.window.showInformationMessage('this is exportProjectDocAsPDF');
}
exports.exportProjectDocAsPDF = exportProjectDocAsPDF;
//# sourceMappingURL=pdf.js.map