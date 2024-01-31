"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openNetlistViewer = void 0;
const vscode = require("vscode");
const fspath = require("path");
const netlist_1 = require("../../../resources/netlist");
const global_1 = require("../../global");
const hdlParser_1 = require("../../hdlParser");
const hdlFs_1 = require("../../hdlFs");
class Netlist {
    constructor(context) {
        this.context = context;
    }
    async open(uri) {
        // get dependence of the current uri
        const prjFiles = [];
        const path = hdlFs_1.hdlPath.toSlash(uri.fsPath);
        const hdlFile = hdlParser_1.hdlParam.getHdlFile(path);
        if (!hdlFile) {
            const errorMsg = `${path} is not a valid hdl file in our parse list, check your property.json to see if arch.hardware.src is set correctly!
            \ncurrent parse list: \n${global_1.opeParam.prjInfo.hardwareSrcPath}\n${global_1.opeParam.prjInfo.hardwareSimPath}`;
            vscode.window.showErrorMessage(errorMsg);
            return;
        }
        for (const hdlModule of hdlFile.getAllHdlModules()) {
            const hdlDependence = hdlParser_1.hdlParam.getAllDependences(path, hdlModule.name);
            if (hdlDependence) {
                // kernel supports `include, so only others are needed
                prjFiles.push(...hdlDependence.others);
            }
        }
        prjFiles.push(path);
        // launch kernel
        this.kernel = new netlist_1.NetlistKernel();
        await this.kernel.launch();
        // set info output in kernel to console
        this.kernel.setMessageCallback((message, type) => {
            if (message !== '') {
                global_1.YosysOutput.report('type: ' + type + ', ' + message);
            }
            if (type === "error") {
                vscode.window.showErrorMessage('type: ' + type + ', ' + message);
                global_1.YosysOutput.report('type: ' + type + ', ' + message, global_1.ReportType.Error);
            }
        });
        prjFiles.forEach(file => global_1.YosysOutput.report('feed file: ' + file, global_1.ReportType.Debug));
        this.kernel.load(prjFiles);
        this.create();
    }
    create() {
        // Create panel
        this.panel = vscode.window.createWebviewPanel('netlist', 'Schematic viewer', vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        this.panel.onDidDispose(() => {
            // When the panel is closed, cancel any future updates to the webview content
            this.kernel?.exit();
            this.panel?.dispose();
            this.kernel = undefined;
            this.panel = undefined;
        }, null, this.context.subscriptions);
        // Handle messages from the webview
        this.panel.webview.onDidReceiveMessage(message => {
            console.log(message);
            switch (message.command) {
                case 'export':
                    this.export(message.type, message.svg);
                    break;
                case 'exec':
                    this.send();
                    break;
            }
        }, undefined, this.context.subscriptions);
        const previewHtml = this.getWebviewContent();
        if (this.panel && previewHtml) {
            this.panel.webview.html = previewHtml;
        }
        else {
            global_1.YosysOutput.report('preview html in <Netlist.create> is empty', global_1.ReportType.Warn);
        }
    }
    send() {
        this.kernel?.exec('proc');
        const netlist = this.kernel?.export({ type: 'json' });
        const command = 'netlist';
        this.panel?.webview.postMessage({ command, netlist });
    }
    getWebviewContent() {
        const netlistPath = hdlFs_1.hdlPath.join(global_1.opeParam.extensionPath, 'resources', 'netlist', 'view');
        const htmlIndexPath = hdlFs_1.hdlPath.join(netlistPath, 'netlist_viewer.html');
        const html = hdlFs_1.hdlFile.readFile(htmlIndexPath)?.replace(/(<link.+?href="|<script.+?src="|<img.+?src=")(.+?)"/g, (m, $1, $2) => {
            const absLocalPath = fspath.resolve(netlistPath, $2);
            const webviewUri = this.panel?.webview.asWebviewUri(vscode.Uri.file(absLocalPath));
            const replaceHref = $1 + webviewUri?.toString() + '"';
            return replaceHref;
        });
        return html;
    }
    async export(type, svg) {
        switch (type) {
            case "svg":
                await this.exportSvg(svg);
                break;
            default: break;
        }
    }
    async exportSvg(svg) {
        const filter = { 'svg': ['svg'] };
        const fileInfos = await vscode.window.showSaveDialog({ filters: filter });
        if (fileInfos && fileInfos.path) {
            let savePath = fileInfos.path;
            if (savePath[0] === '/' && require('os').platform() === 'win32') {
                savePath = savePath.substring(1);
            }
            hdlFs_1.hdlFile.writeFile(savePath, svg);
            vscode.window.showInformationMessage('Schematic saved in ' + savePath);
            global_1.YosysOutput.report('Schematic saved in ' + savePath);
        }
    }
}
async function openNetlistViewer(context, uri) {
    const viewer = new Netlist(context);
    viewer.open(uri);
}
exports.openNetlistViewer = openNetlistViewer;
//# sourceMappingURL=index.js.map