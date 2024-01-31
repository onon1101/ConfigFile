"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ppyAction = exports.hdlAction = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const assert = require("assert");
const vscode = require("vscode");
const treeView_1 = require("../function/treeView");
const global_1 = require("../global");
const util_1 = require("../global/util");
const hdlFs_1 = require("../hdlFs");
const hdlParser_1 = require("../hdlParser");
const manager_1 = require("../manager");
const lib_1 = require("../manager/lib");
const enum_1 = require("../global/enum");
const core_1 = require("../function/lsp/core");
const linter_1 = require("../function/lsp/linter");
var Event;
(function (Event) {
    Event["Add"] = "add";
    Event["AddDir"] = "addDir";
    Event["Unlink"] = "unlink";
    Event["UnlinkDir"] = "unlinkDir";
    Event["Change"] = "change";
    Event["All"] = "all";
    Event["Ready"] = "ready";
    Event["Raw"] = "raw";
    Event["Error"] = "error";
})(Event || (Event = {}));
;
class BaseAction {
    listenChange(m) {
        const fSWatcher = this.selectFSWatcher(m);
        if (!fSWatcher) {
            global_1.MainOutput.report("FSWatcher hasn't been made!", global_1.ReportType.Error);
            return;
        }
        fSWatcher.on(Event.Change, path => this.change(path, m));
    }
    listenAdd(m) {
        const fSWatcher = this.selectFSWatcher(m);
        if (!fSWatcher) {
            global_1.MainOutput.report("FSWatcher hasn't been made!", global_1.ReportType.Error);
            return;
        }
        fSWatcher.on(Event.Add, path => this.add(path, m));
    }
    listenUnlink(m) {
        const fSWatcher = this.selectFSWatcher(m);
        if (!fSWatcher) {
            global_1.MainOutput.report("FSWatcher hasn't been made!", global_1.ReportType.Error);
            return;
        }
        fSWatcher.on(Event.Unlink, path => this.unlink(path, m));
    }
}
class HdlAction extends BaseAction {
    selectFSWatcher(m) {
        return m.hdlMonitor;
    }
    async add(path, m) {
        console.log('HdlAction add', path);
        path = hdlFs_1.hdlPath.toSlash(path);
        this.updateLinter(path);
        // check if it has been created
        if (hdlParser_1.hdlParam.hasHdlFile(path)) {
            global_1.MainOutput.report('<HdlAction Add Event> HdlFile ' + path + ' has been created', global_1.ReportType.Warn);
            return;
        }
        // create corresponding moduleFile
        await hdlParser_1.hdlParam.addHdlFile(path);
        (0, treeView_1.refreshArchTree)();
    }
    async unlink(path, m) {
        console.log('HdlAction unlink', path);
        // operation to process unlink of hdl files can be deleted in <processLibFiles>
        path = hdlFs_1.hdlPath.toSlash(path);
        hdlParser_1.hdlParam.deleteHdlFile(path);
        console.log(hdlParser_1.hdlParam);
        (0, treeView_1.refreshArchTree)();
        const uri = vscode.Uri.file(path);
        const langID = hdlFs_1.hdlFile.getLanguageId(path);
        if (langID === enum_1.HdlLangID.Verilog) {
            linter_1.vlogLinterManager.remove(uri);
        }
        else if (langID === enum_1.HdlLangID.Vhdl) {
            linter_1.vhdlLinterManager.remove(uri);
        }
        else if (langID === enum_1.HdlLangID.SystemVerilog) {
            linter_1.svlogLinterManager.remove(uri);
        }
    }
    async unlinkDir(path, m) {
        console.log('HdlAction unlinkDir', path);
    }
    async addDir(path, m) {
        console.log('HdlAction addDir', path);
    }
    async change(path, m) {
        console.log('HdlAction change');
        path = hdlFs_1.hdlPath.toSlash(path);
        // TODO : check performance
        await this.updateSymbolStorage(path);
        await this.updateLinter(path);
        await this.updateHdlParam(path);
        (0, treeView_1.refreshArchTree)();
    }
    async updateSymbolStorage(path) {
        core_1.hdlSymbolStorage.updateSymbol(path);
    }
    async updateLinter(path) {
        const uri = vscode.Uri.file(path);
        const document = await vscode.workspace.openTextDocument(uri);
        const langID = hdlFs_1.hdlFile.getLanguageId(path);
        if (langID === enum_1.HdlLangID.Verilog) {
            linter_1.vlogLinterManager.lint(document);
        }
        else if (langID === enum_1.HdlLangID.Vhdl) {
            linter_1.vhdlLinterManager.lint(document);
        }
        else if (langID === enum_1.HdlLangID.SystemVerilog) {
            linter_1.svlogLinterManager.lint(document);
        }
    }
    async updateHdlParam(path) {
        const moduleFile = hdlParser_1.hdlParam.getHdlFile(path);
        if (!moduleFile) {
            return;
        }
        const fast = await hdlParser_1.HdlSymbol.fast(path);
        if (!fast) {
            // vscode.window.showErrorMessage('error happen when parse ' + path + '\nFail to update');
            return;
        }
        // 1. update marco directly
        moduleFile.updateMacro(fast.macro);
        // 2. update modules one by one
        const uncheckedModuleNames = new Set();
        for (const name of moduleFile.getAllModuleNames()) {
            uncheckedModuleNames.add(name);
        }
        for (const rawHdlModule of fast.content) {
            const moduleName = rawHdlModule.name;
            if (uncheckedModuleNames.has(moduleName)) {
                // match the same module, check then
                const originalModule = moduleFile.getHdlModule(moduleName);
                uncheckedModuleNames.delete(moduleName);
                originalModule?.update(rawHdlModule);
            }
            else {
                // no matched, create it
                const newModule = moduleFile.createHdlModule(rawHdlModule);
                newModule.makeNameToInstances();
                newModule.solveUnhandleInstance();
            }
        }
        // 3. delete module not visited yet
        for (const moduleName of uncheckedModuleNames) {
            moduleFile.deleteHdlModule(moduleName);
        }
    }
}
class PpyAction extends BaseAction {
    selectFSWatcher(m) {
        return m.ppyMonitor;
    }
    async add(path, m) {
        console.log('PpyAction add');
        assert.equal(hdlFs_1.hdlPath.toSlash(path), global_1.opeParam.propertyJsonPath);
        await this.updateProperty(Event.Add, m);
    }
    async unlink(path, m) {
        console.log('PpyAction unlink');
        assert.equal(hdlFs_1.hdlPath.toSlash(path), global_1.opeParam.propertyJsonPath);
        await this.updateProperty(Event.Unlink, m);
    }
    async change(path, m) {
        console.log('PpyAction change');
        assert.equal(hdlFs_1.hdlPath.toSlash(path), global_1.opeParam.propertyJsonPath);
        await this.updateProperty(Event.Change, m);
        console.log(hdlParser_1.hdlParam);
    }
    // get path set from opeParam that used to tell if need to remake HdlMonitor
    getImportantPathSet() {
        const pathSet = new Set();
        pathSet.add(global_1.opeParam.prjInfo.hardwareSimPath);
        pathSet.add(global_1.opeParam.prjInfo.hardwareSrcPath);
        for (const path of global_1.opeParam.prjInfo.getLibraryCommonPaths()) {
            pathSet.add(path);
        }
        for (const path of global_1.opeParam.prjInfo.getLibraryCustomPaths()) {
            pathSet.add(path);
        }
        return pathSet;
    }
    async updateProperty(e, m) {
        const originalPathSet = this.getImportantPathSet();
        const originalHdlFiles = await manager_1.prjManage.getPrjHardwareFiles();
        const originalLibState = global_1.opeParam.prjInfo.library.state;
        const rawPrjInfo = global_1.opeParam.getRawUserPrjInfo();
        // when delete, make ws path to be main parse path
        if (e === Event.Unlink) {
            console.log('unlink ppy, PrjInfoDefaults.arch:', global_1.PrjInfoDefaults.arch);
            rawPrjInfo.arch = global_1.PrjInfoDefaults.arch;
        }
        global_1.opeParam.mergePrjInfo(rawPrjInfo);
        await manager_1.prjManage.refreshPrjFolder();
        const currentPathSet = this.getImportantPathSet();
        const currentLibState = global_1.opeParam.prjInfo.library.state;
        if ((0, util_1.isSameSet)(originalPathSet, currentPathSet)) {
            // skip hdl remake
            if (originalLibState !== currentLibState) {
                const fileChange = await lib_1.libManage.processLibFiles(global_1.opeParam.prjInfo.library);
                global_1.MainOutput.report(`libManage finish process, add ${fileChange.add.length} files, del ${fileChange.del.length} files`, global_1.ReportType.Info);
            }
        }
        else {
            // update hdl monitor
            await this.refreshHdlMonitor(m, originalHdlFiles);
        }
        (0, treeView_1.refreshArchTree)();
    }
    diffNewOld(newFiles, oldFiles) {
        const uncheckHdlFileSet = new Set(oldFiles);
        const addFiles = [];
        const delFiles = [];
        for (const path of newFiles) {
            if (!uncheckHdlFileSet.has(path)) {
                addFiles.push(path);
            }
            else {
                uncheckHdlFileSet.delete(path);
            }
        }
        for (const path of uncheckHdlFileSet) {
            hdlParser_1.hdlParam.deleteHdlFile(path);
            delFiles.push(path);
        }
        return {
            addFiles, delFiles
        };
    }
    async refreshHdlMonitor(m, originalHdlFiles) {
        m.remakeHdlMonitor();
        const newFiles = await manager_1.prjManage.getPrjHardwareFiles();
        const { addFiles, delFiles } = this.diffNewOld(newFiles, originalHdlFiles);
        const options = { location: vscode.ProgressLocation.Notification };
        options.title = 'update HdlParam';
        await vscode.window.withProgress(options, async () => await this.updateHdlParam(addFiles, delFiles));
        if (global_1.opeParam.prjInfo.toolChain === enum_1.ToolChainType.Xilinx) {
            options.title = 'update PL';
            await vscode.window.withProgress(options, async () => await this.updatePL(addFiles, delFiles));
        }
    }
    async updateHdlParam(addFiles, delFiles) {
        for (const path of addFiles) {
            await hdlParser_1.hdlParam.addHdlFile(path);
        }
        for (const path of delFiles) {
            hdlParser_1.hdlParam.deleteHdlFile(path);
        }
    }
    async updatePL(addFiles, delFiles) {
        // current only support xilinx
        if (manager_1.prjManage.pl) {
            await manager_1.prjManage.pl.addFiles(addFiles);
            await manager_1.prjManage.pl.delFiles(delFiles);
        }
        else {
            global_1.MainOutput.report('PL is not registered', global_1.ReportType.Warn);
        }
    }
}
const hdlAction = new HdlAction();
exports.hdlAction = hdlAction;
const ppyAction = new PpyAction();
exports.ppyAction = ppyAction;
//# sourceMappingURL=event.js.map