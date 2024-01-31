"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pickLibrary = exports.LibPick = void 0;
const vscode = require("vscode");
const fspath = require("path");
const fs = require("fs");
const global_1 = require("../global");
const enum_1 = require("../global/enum");
const hdlFs_1 = require("../hdlFs");
const icons_1 = require("../hdlFs/icons");
class LibPick {
    constructor() {
        this.commonPath = global_1.opeParam.prjInfo.libCommonPath;
        this.customPath = global_1.opeParam.prjInfo.libCustomPath;
        if (!this.customPath) {
            this.customPath = 'no custom path is defined, see Prj->Lib->Custom->Path';
        }
        this.commonQuickPickItem = {
            label: "$(libpick-common) common",
            description: 'common library provided by us',
            detail: 'current path: ' + this.commonPath,
            path: this.commonPath,
            buttons: [{ iconPath: (0, icons_1.getIconConfig)('import'), tooltip: 'import everything in common' }]
        };
        this.customQuickPickItem = {
            label: "$(libpick-custom) custom",
            description: 'custom library by yourself',
            detail: 'current path: ' + this.customPath,
            path: this.customPath,
            buttons: [{ iconPath: (0, icons_1.getIconConfig)('import'), tooltip: 'import everything in custom' }]
        };
        this.rootItems = [
            this.commonQuickPickItem,
            this.customQuickPickItem
        ];
        this.backQuickPickItem = {
            label: '...',
            description: 'return'
        };
        this.curPath = '';
    }
    getPathIcon(path) {
        let prompt;
        if (hdlFs_1.hdlFile.isFile(path)) {
            const langID = hdlFs_1.hdlFile.getLanguageId(path);
            if (langID === enum_1.HdlLangID.Vhdl) {
                prompt = 'vhdl';
            }
            else if (langID === enum_1.HdlLangID.Verilog ||
                langID === enum_1.HdlLangID.SystemVerilog) {
                prompt = 'verilog';
            }
            else {
                prompt = 'unknown';
            }
        }
        else {
            prompt = 'folder';
        }
        return `$(libpick-${prompt})`;
    }
    getReadmeText(path, fileName) {
        const mdPath1 = hdlFs_1.hdlPath.join(path, fileName, 'readme.md');
        if (fs.existsSync(mdPath1)) {
            return hdlFs_1.hdlFile.readFile(mdPath1);
        }
        const mdPath2 = hdlFs_1.hdlPath.join(path, fileName, 'README.md');
        if (fs.existsSync(mdPath2)) {
            return hdlFs_1.hdlFile.readFile(mdPath2);
        }
        return undefined;
    }
    makeQuickPickItemsByPath(path, back = true) {
        const items = [];
        if (!hdlFs_1.hdlPath.exist(path)) {
            return items;
        }
        if (back) {
            items.push(this.backQuickPickItem);
        }
        for (const fileName of fs.readdirSync(path)) {
            const filePath = hdlFs_1.hdlPath.join(path, fileName);
            const themeIcon = this.getPathIcon(filePath);
            const label = themeIcon + " " + fileName;
            const mdText = this.getReadmeText(path, fileName);
            const description = mdText ? mdText : '';
            const buttons = [{ iconPath: (0, icons_1.getIconConfig)('import'), tooltip: 'import everything in ' + fileName }];
            items.push({ label, description, path: filePath, buttons });
        }
        return items;
    }
    provideQuickPickItem(item) {
        if (!item) {
            return this.rootItems;
        }
        else if (item === this.backQuickPickItem) {
            if ((this.curPath === this.commonPath) ||
                (this.curPath === this.customPath)) {
                return this.rootItems;
            }
            else {
                // rollback the current path
                this.curPath = fspath.dirname(this.curPath);
            }
        }
        else if (item === this.commonQuickPickItem) {
            this.curPath = this.commonPath;
        }
        else if (item === this.customQuickPickItem) {
            this.curPath = this.customPath;
        }
        else {
            const label = item.label;
            const fileName = label.replace(/\$\([\s\S]*\)/, '').trim();
            this.curPath = hdlFs_1.hdlPath.join(this.curPath, fileName);
        }
        return this.makeQuickPickItemsByPath(this.curPath);
    }
    async pickItems() {
        const pickWidget = vscode.window.createQuickPick();
        pickWidget.placeholder = 'pick the library';
        pickWidget.items = this.provideQuickPickItem();
        pickWidget.onDidChangeSelection(items => {
            if (items[0]) {
                this.selectedQuickPickItem = items[0];
            }
        });
        pickWidget.onDidAccept(() => {
            if (this.selectedQuickPickItem) {
                const childernItems = this.provideQuickPickItem(this.selectedQuickPickItem);
                if (childernItems && childernItems.length > 0) {
                    pickWidget.items = childernItems;
                }
            }
        });
        pickWidget.onDidTriggerItemButton(event => {
            const selectedPath = event.item.path;
            if (selectedPath && hdlFs_1.hdlPath.exist(selectedPath)) {
                const userPrjInfo = global_1.opeParam.getUserPrjInfo();
                if (selectedPath.includes(this.commonQuickPickItem.path)) {
                    // this is a module import from common, use relative path
                    const relPath = selectedPath.replace(this.commonQuickPickItem.path + '/', '');
                    userPrjInfo.appendLibraryCommonPath(relPath);
                }
                else {
                    // this is a module import from custom, use absolute path
                    const relPath = selectedPath.replace(this.customQuickPickItem.path + '/', '');
                    userPrjInfo.appendLibraryCustomPath(relPath);
                }
                // acquire raw and replace it
                const rawUserPrjInfo = global_1.opeParam.getRawUserPrjInfo();
                rawUserPrjInfo.library = userPrjInfo.library;
                hdlFs_1.hdlFile.writeJSON(global_1.opeParam.propertyJsonPath, rawUserPrjInfo);
            }
        });
        pickWidget.show();
    }
}
exports.LibPick = LibPick;
async function pickLibrary() {
    const picker = new LibPick();
    await picker.pickItems();
}
exports.pickLibrary = pickLibrary;
//# sourceMappingURL=libPick.js.map