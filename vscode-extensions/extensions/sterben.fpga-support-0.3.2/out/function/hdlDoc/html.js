"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeSVGElementByLink = exports.makeShowHTML = exports.exportProjectDocAsHTML = exports.exportCurrentFileDocAsHTML = exports.showDocWebview = void 0;
const vscode = require("vscode");
const fs = require("fs");
const global_1 = require("../../global");
const common_1 = require("./common");
const markdown_1 = require("./markdown");
const hdlFs_1 = require("../../hdlFs");
const _cache = {
    css: ''
};
function makeFinalHTML(body, style) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <div id="wrapper">
        <div id="write">
            ${body}
        </div>
    </div>
</body>
<style>
    ${style}
</style>
</html>`;
}
function makeExportHTML(cssHref, body) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <link rel="stylesheet" type="text/css" href="${cssHref}"></link>
</head>
<body>
    <div id="wrapper">
        <div id="write">
            ${body}
        </div>
    </div>
</body>
</html>`;
}
function makeCommonElement(renderResult) {
    return renderResult + '<br>\n';
}
function makeSVGElement(renderResult, caption) {
    let mainHtml;
    if (caption) {
        mainHtml = '<div align=center>' + renderResult + `<p class="ImgCaption">${caption}</p>` + '</div>';
    }
    else {
        mainHtml = '<div align=center>' + renderResult + '</div>';
    }
    return '<br>' + mainHtml + '<br><br>\n';
}
function makeSVGElementByLink(link, caption) {
    let mainHtml;
    if (caption) {
        mainHtml = `<div align=center><img src="${link}"></img><p class="ImgCaption">${caption}</p></div>`;
    }
    else {
        mainHtml = `<div align=center><img src="${link}"></img></div>`;
    }
    return '<br>' + mainHtml + '<br><br>\n';
}
exports.makeSVGElementByLink = makeSVGElementByLink;
function getDocCssString() {
    if (_cache.css) {
        return _cache.css;
    }
    else {
        const cssPath = hdlFs_1.hdlPath.join(global_1.opeParam.extensionPath, 'css/documentation.css');
        const cssString = fs.readFileSync(cssPath, 'utf-8');
        _cache.css = cssString;
        return cssString;
    }
}
function makeWavedromRenderErrorHTML() {
    return `<div class="error-out">
    <p class="error">Error Render</p>
</div><br>`;
}
/**
 * @description make the html string of a finial display style
 * @param usage in whick module is used
 */
async function makeShowHTML(usage) {
    const renderList = await (0, markdown_1.getCurrentRenderList)();
    if (!renderList || renderList.length === 0) {
        return '';
    }
    // start to render the real html
    let body = '';
    for (const r of renderList) {
        const renderResult = r.render();
        if (renderResult) {
            if (r instanceof common_1.MarkdownString) {
                body += makeCommonElement(renderResult);
            }
            else if (r instanceof common_1.WavedromString) {
                body += makeSVGElement(renderResult, r.desc);
            }
        }
        else {
            body += makeWavedromRenderErrorHTML();
        }
    }
    // add css
    let cssString = getDocCssString();
    if (usage === 'webview') { // if invoked by webview, change background image
        const webviewConfig = vscode.workspace.getConfiguration("digital-ide.function.doc.webview");
        const imageUrl = webviewConfig.get('backgroundImage', '');
        cssString = cssString.replace("--backgroundImage", imageUrl);
    }
    else if (usage === 'pdf') { // if invoked by pdf, transform .vscode-light to #write
        cssString = cssString.replace(/\.vscode-light/g, '#write');
    }
    const html = makeFinalHTML(body, cssString);
    return html;
}
exports.makeShowHTML = makeShowHTML;
async function showDocWebview() {
    const htmlPromise = makeShowHTML("webview");
    const webview = vscode.window.createWebviewPanel('TOOL.doc.webview.show', 'document', vscode.ViewColumn.Two, {
        enableScripts: true,
        retainContextWhenHidden: true, // unchange webview when hidden, prevent extra refresh
    });
    webview.iconPath = hdlFs_1.hdlIcon.getIconConfig('documentation');
    webview.webview.html = await htmlPromise;
}
exports.showDocWebview = showDocWebview;
async function exportCurrentFileDocAsHTML() {
    if (vscode.window.activeColorTheme.kind !== vscode.ColorThemeKind.Light) {
        vscode.window.showErrorMessage('Please export html in a light theme!');
        return;
    }
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    const currentFilePath = hdlFs_1.hdlPath.toSlash(editor.document.fileName);
    const hdlFileName = hdlFs_1.hdlPath.basename(currentFilePath);
    const renderList = await (0, markdown_1.getRenderList)(currentFilePath);
    if (!renderList || renderList.length === 0) {
        return;
    }
    const wsPath = global_1.opeParam.workspacePath;
    const markdownFolderPath = hdlFs_1.hdlPath.join(wsPath, 'html');
    if (!fs.existsSync(markdownFolderPath)) {
        fs.mkdirSync(markdownFolderPath);
    }
    const currentRoot = hdlFs_1.hdlPath.join(markdownFolderPath, hdlFileName);
    if (fs.existsSync(currentRoot)) {
        hdlFs_1.hdlFile.rmSync(currentRoot);
    }
    fs.mkdirSync(currentRoot);
    const figureFolder = hdlFs_1.hdlPath.join(currentRoot, 'figure');
    fs.mkdirSync(figureFolder);
    const cssFolder = hdlFs_1.hdlPath.join(currentRoot, 'css');
    fs.mkdirSync(cssFolder);
    const relateCssPath = './css/index.css';
    const cssPath = hdlFs_1.hdlPath.join(cssFolder, 'index.css');
    let cssString = getDocCssString();
    // only support export in the ligth theme
    cssString = cssString.replace(/\.vscode-light/g, '#write');
    fs.writeFileSync(cssPath, cssString);
    let body = '';
    for (const r of renderList) {
        const renderResult = r.render();
        if (r instanceof common_1.MarkdownString) {
            body += makeCommonElement(renderResult);
        }
        else if (r instanceof common_1.WavedromString) {
            const svgName = 'wavedrom-' + common_1.Count.svgMakeTimes + '.svg';
            const svgPath = hdlFs_1.hdlPath.join(figureFolder, svgName);
            fs.writeFileSync(svgPath, renderResult);
            const relatePath = hdlFs_1.hdlPath.join('./figure', svgName);
            body += makeSVGElementByLink(relatePath, r.desc);
        }
    }
    const html = makeExportHTML(relateCssPath, body);
    const htmlName = 'index.html';
    const htmlPath = hdlFs_1.hdlPath.join(currentRoot, htmlName);
    common_1.Count.svgMakeTimes = 0;
    fs.writeFileSync(htmlPath, html);
}
exports.exportCurrentFileDocAsHTML = exportCurrentFileDocAsHTML;
async function exportProjectDocAsHTML() {
    vscode.window.showInformationMessage('this is exportProjectDocAsHTML');
}
exports.exportProjectDocAsHTML = exportProjectDocAsHTML;
//# sourceMappingURL=html.js.map