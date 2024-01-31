"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportProjectDocAsMarkdown = exports.exportCurrentFileDocAsMarkdown = exports.getCurrentRenderList = exports.getRenderList = exports.getDocsFromFile = void 0;
const vscode = require("vscode");
const fs = require("fs");
const global_1 = require("../../global");
const core_1 = require("../../hdlParser/core");
const common_1 = require("./common");
const hdlFs_1 = require("../../hdlFs");
const feature_1 = require("../lsp/util/feature");
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
function makeTableFromObjArray(md, array, name, fieldNames, displayNames) {
    const ws = hdlFs_1.hdlPath.toSlash(global_1.opeParam.workspacePath) + '/';
    if (array.length === 0) {
        md.addText(`no ${name} info`);
    }
    else {
        const rows = [];
        for (const obj of array) {
            const data = [];
            for (const subName of fieldNames) {
                let value = obj[subName];
                if (subName === 'instModPath' && value) {
                    value = value.replace(ws, '');
                }
                if (value && value.trim().length === 0) {
                    value = ' ';
                }
                // TODO : 1 not known
                if (name === 'ports' && value === 'Unknown') {
                    value = '1';
                }
                data.push(value);
            }
            rows.push(data);
        }
        if (displayNames) {
            md.addTable(displayNames, rows);
        }
        else {
            md.addTable(fieldNames, rows);
        }
    }
}
/**
 * @description add attribute description to each port/param
 * @param {string} path
 * @param {Array<ModPort|ModParam>} ports
 */
async function patchComment(path, ports) {
    if (!ports || !ports.length) {
        return;
    }
    const ranges = ports.map(port => port.range);
    const comments = await (0, feature_1.getSymbolComments)(path, ranges);
    for (let i = 0; i < ports.length; ++i) {
        let inlineComment = comments[i].replace(/\n/, ' ');
        if (inlineComment.startsWith('//')) {
            inlineComment = inlineComment.substring(2);
        }
        ports[i].desc = inlineComment;
    }
}
/**
 * @description get basedoc obj from a module
 * @param module
 */
async function getDocsFromModule(module) {
    const moduleName = module.name;
    const portNum = module.ports.length;
    const paramNum = module.params.length;
    // add desc can optimizer in the future version
    const paramPP = patchComment(module.path, module.params);
    const portPP = patchComment(module.path, module.ports);
    let topModuleDesc = '';
    if (core_1.hdlParam.isTopModule(module.path, module.name)) {
        topModuleDesc = '√';
    }
    else {
        topModuleDesc = '×';
    }
    const md = new common_1.MarkdownString(module.range.start.line);
    // add module name
    md.addTitle(moduleName, 1);
    md.addTitle('Basic Info', 2);
    const infos = [
        `${portNum} params, ${paramNum} ports`,
        'top module ' + topModuleDesc
    ];
    md.addUnorderedList(infos);
    md.addEnter();
    // wait param and port patch
    await paramPP;
    await portPP;
    // param section
    md.addTitle('params', 2);
    makeTableFromObjArray(md, module.params, 'params', ['name', 'init', 'desc'], ['name', 'init', 'description']);
    md.addEnter();
    // port section
    md.addTitle('ports', 2);
    makeTableFromObjArray(md, module.ports, 'ports', ['name', 'type', 'width', 'desc'], ['name', 'type', 'width', 'description']);
    md.addEnter();
    // dependency section
    md.addTitle('Dependency', 2);
    const insts = [];
    for (const inst of module.getAllInstances()) {
        insts.push(inst);
    }
    makeTableFromObjArray(md, insts, 'Dependencies', ['name', 'type', 'instModPath'], ['name', 'module', 'path']);
    md.addEnter();
    return md;
}
/**
 * @description get basedoc obj according to a file
 * @param path absolute path of the file
 */
async function getDocsFromFile(path) {
    const moduleFile = core_1.hdlParam.getHdlFile(path);
    if (!moduleFile) {
        global_1.MainOutput.report('Fail to export documentation of ' + path, global_1.ReportType.Error);
        const errorMsg = `${path} is not a valid hdl file in our parse list, check your property.json to see if arch.hardware.src is set correctly!
        \ncurrent parse list: \n${global_1.opeParam.prjInfo.hardwareSrcPath}\n${global_1.opeParam.prjInfo.hardwareSimPath}`;
        vscode.window.showErrorMessage(errorMsg);
        return undefined;
    }
    const markdownStringPromises = [];
    for (const module of moduleFile.getAllHdlModules()) {
        const markdownStringPromise = getDocsFromModule(module);
        markdownStringPromises.push(markdownStringPromise);
    }
    const fileDocs = [];
    for (const p of markdownStringPromises) {
        const markdownString = await p;
        fileDocs.push(markdownString);
    }
    return fileDocs;
}
exports.getDocsFromFile = getDocsFromFile;
/**
 * @description get render list of path
 * @param path
 */
async function getRenderList(path) {
    if (!hdlFs_1.hdlFile.isHDLFile(path)) {
        vscode.window.showErrorMessage('Please use the command in a HDL file!');
        return [];
    }
    const docs = await getDocsFromFile(path);
    const svgs = await (0, common_1.getWavedromsFromFile)(path);
    if (docs && svgs) {
        const renderList = (0, common_1.mergeSortByLine)(docs, svgs);
        return renderList;
    }
    return undefined;
}
exports.getRenderList = getRenderList;
/**
 * @description return render list of current file
 */
async function getCurrentRenderList() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const currentFilePath = hdlFs_1.hdlPath.toSlash(editor.document.fileName);
        return await getRenderList(currentFilePath);
    }
    return;
}
exports.getCurrentRenderList = getCurrentRenderList;
async function exportCurrentFileDocAsMarkdown() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    const currentFilePath = hdlFs_1.hdlPath.toSlash(editor.document.fileName);
    const hdlFileName = hdlFs_1.hdlPath.basename(currentFilePath);
    const renderList = await getRenderList(currentFilePath);
    if (!renderList || renderList.length === 0) {
        return;
    }
    const wsPath = global_1.opeParam.workspacePath;
    const markdownFolderPath = hdlFs_1.hdlPath.join(wsPath, 'markdown');
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
    let markdown = '';
    for (const r of renderList) {
        if (r instanceof common_1.MarkdownString) {
            markdown += r.renderMarkdown() + '\n';
        }
        else if (r instanceof common_1.WavedromString) {
            const svgString = r.render();
            const svgName = 'wavedrom-' + common_1.Count.svgMakeTimes + '.svg';
            const svgPath = hdlFs_1.hdlPath.join(figureFolder, svgName);
            fs.writeFileSync(svgPath, svgString);
            const relatePath = hdlFs_1.hdlPath.join('./figure', svgName);
            const svgHtml = makeSVGElementByLink(relatePath);
            markdown += '\n\n' + svgHtml + '\n\n';
        }
    }
    const markdownName = 'index.md';
    const markdownPath = hdlFs_1.hdlPath.join(currentRoot, markdownName);
    common_1.Count.svgMakeTimes = 0;
    fs.writeFileSync(markdownPath, markdown);
}
exports.exportCurrentFileDocAsMarkdown = exportCurrentFileDocAsMarkdown;
async function exportProjectDocAsMarkdown() {
    vscode.window.showInformationMessage('this is exportProjectDocAsMarkdown');
}
exports.exportProjectDocAsMarkdown = exportProjectDocAsMarkdown;
//# sourceMappingURL=markdown.js.map