"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrjManage = exports.prjManage = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const fs = require("fs");
const global_1 = require("../global");
const util_1 = require("../global/util");
const hdlFs_1 = require("../hdlFs");
const lib_1 = require("./lib");
const hdlParser_1 = require("../hdlParser");
const PL_1 = require("./PL");
const ignore_1 = require("./ignore");
const event_1 = require("../monitor/event");
const monitor_1 = require("../monitor");
class PrjManage {
    // generate property template and write it to .vscode/property.json
    async generatePropertyJson() {
        if (fs.existsSync(global_1.opeParam.propertyJsonPath)) {
            vscode.window.showWarningMessage('property file already exists !!!');
            return;
        }
        const template = hdlFs_1.hdlFile.readJSON(global_1.opeParam.propertyInitPath);
        hdlFs_1.hdlFile.writeJSON(global_1.opeParam.propertyJsonPath, template);
        // TODO : this is a bug, that monitor cannot sense the add event of ppy
        // so we need to do <add event> manually here
        await event_1.ppyAction.add(global_1.opeParam.propertyJsonPath, monitor_1.hdlMonitor);
    }
    // overwrite content in current property.json to property-init.json
    async overwritePropertyJson() {
        const options = {
            preview: false,
            viewColumn: vscode.ViewColumn.Active
        };
        const uri = vscode.Uri.file(global_1.opeParam.propertyInitPath);
        await vscode.window.showTextDocument(uri, options);
    }
    getWorkspacePath() {
        if (vscode.workspace.workspaceFolders !== undefined &&
            vscode.workspace.workspaceFolders.length !== 0) {
            const wsPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
            return hdlFs_1.hdlPath.toSlash(wsPath);
        }
        return '';
    }
    /**
     * init opeParam
     * @param context
     */
    async initOpeParam(context) {
        const os = process.platform;
        const extensionPath = hdlFs_1.hdlPath.toSlash(context.extensionPath);
        const workspacePath = this.getWorkspacePath();
        const propertyJsonPath = hdlFs_1.hdlPath.join(workspacePath, '.vscode', 'property.json');
        const propertySchemaPath = hdlFs_1.hdlPath.join(extensionPath, 'project', 'property-schema.json');
        const propertyInitPath = hdlFs_1.hdlPath.join(extensionPath, 'project', 'property-init.json');
        global_1.opeParam.setBasicInfo(os, extensionPath, workspacePath, propertyJsonPath, propertySchemaPath, propertyInitPath);
        // set path for merge in prjInfo        
        global_1.opeParam.prjInfo.initContextPath(extensionPath, workspacePath);
        const refreshPrjConfig = { mkdir: true };
        // merge prjInfo from propertyJsonPath if exist
        if (fs.existsSync(propertyJsonPath)) {
            const rawPrjInfo = hdlFs_1.hdlFile.readJSON(propertyJsonPath);
            global_1.opeParam.mergePrjInfo(rawPrjInfo);
        }
        else {
            const res = await vscode.window.showInformationMessage("property.json is not detected, do you want to create one ?", { title: 'Yes', value: true }, { title: 'No', value: false });
            if (res?.value) {
                await this.generatePropertyJson();
                const rawPrjInfo = hdlFs_1.hdlFile.readJSON(propertyJsonPath);
                global_1.opeParam.mergePrjInfo(rawPrjInfo);
            }
            else {
                refreshPrjConfig.mkdir = false;
            }
        }
        return refreshPrjConfig;
    }
    /**
     * get all the hdl files that to be parsed in the project
     * @returns
     */
    async getPrjHardwareFiles() {
        const searchPathSet = new util_1.PathSet();
        const prjInfo = global_1.opeParam.prjInfo;
        const hardwareInfo = prjInfo.arch.hardware;
        // handle library first
        const fileChange = await lib_1.libManage.processLibFiles(prjInfo.library);
        global_1.MainOutput.report(`libManage finish process, add ${fileChange.add.length} files, del ${fileChange.del.length} files`, global_1.ReportType.Info);
        // add possible folder to search
        searchPathSet.checkAdd(prjInfo.hardwareSrcPath);
        searchPathSet.checkAdd(prjInfo.hardwareSimPath);
        searchPathSet.checkAdd(hardwareInfo.sim);
        searchPathSet.checkAdd(prjInfo.getLibraryCommonPaths());
        searchPathSet.checkAdd(prjInfo.getLibraryCustomPaths());
        global_1.MainOutput.report('<getPrjHardwareFiles> search folders: ', global_1.ReportType.Debug);
        searchPathSet.files.forEach(p => global_1.MainOutput.report(p, global_1.ReportType.Debug));
        // TODO : make something like .gitignore
        const ignores = ignore_1.hdlIgnore.getIgnoreFiles();
        // do search
        const searchPaths = searchPathSet.files;
        const hdlFiles = hdlFs_1.hdlFile.getHDLFiles(searchPaths, ignores);
        return hdlFiles;
    }
    async initialise(context, countTimeCost = true) {
        if (countTimeCost) {
            console.time('launch');
        }
        const refreshPrjConfig = await this.initOpeParam(context);
        global_1.MainOutput.report('finish initialise opeParam', global_1.ReportType.Info);
        prjManage.refreshPrjFolder(refreshPrjConfig);
        const hdlFiles = await this.getPrjHardwareFiles();
        global_1.MainOutput.report(`finish collect ${hdlFiles.length} hdl files`, global_1.ReportType.Info);
        await hdlParser_1.hdlParam.initialize(hdlFiles);
        const unhandleNum = hdlParser_1.hdlParam.getUnhandleInstanceNumber();
        global_1.MainOutput.report(`finish analyse ${hdlFiles.length} hdl files, find ${unhandleNum} unsolved instances`, global_1.ReportType.Info);
        this.pl = new PL_1.PlManage();
        // TODO : finish it later
        // this.ps = new PsManage();
        global_1.MainOutput.report('create pl', global_1.ReportType.Info);
        if (countTimeCost) {
            console.timeLog('launch');
        }
    }
    async refreshPrjFolder(config) {
        if (config && config.mkdir === false) {
            return;
        }
        // read new prj from ppy
        const rawPrjInfo = global_1.opeParam.getRawUserPrjInfo();
        if (rawPrjInfo.arch) {
            // configure user's info
            await this.createFolderByRawPrjInfo(rawPrjInfo);
        }
        else {
            // configure by default            
            await this.createFolderByDefault(rawPrjInfo);
        }
        global_1.opeParam.prjInfo.checkArchDirExist();
    }
    async createFolderByRawPrjInfo(rawPrjInfo) {
        if (rawPrjInfo.arch) {
            hdlFs_1.hdlDir.mkdir(rawPrjInfo.arch.prjPath);
            const hardware = rawPrjInfo.arch.hardware;
            const software = rawPrjInfo.arch.software;
            if (hardware) {
                hdlFs_1.hdlDir.mkdir(hardware.src);
                hdlFs_1.hdlDir.mkdir(hardware.sim);
                hdlFs_1.hdlDir.mkdir(hardware.data);
            }
            if (software) {
                hdlFs_1.hdlDir.mkdir(software.src);
                hdlFs_1.hdlDir.mkdir(software.data);
            }
        }
    }
    async createFolderByDefault(rawPrjInfo) {
        // create prj first
        const defaultPrjPath = hdlFs_1.hdlPath.join(global_1.opeParam.workspacePath, 'prj');
        hdlFs_1.hdlDir.mkdir(defaultPrjPath);
        // basic path
        const userPath = hdlFs_1.hdlPath.join(global_1.opeParam.workspacePath, 'user');
        const softwarePath = hdlFs_1.hdlPath.join(userPath, 'Software');
        const hardwarePath = hdlFs_1.hdlPath.join(userPath, 'Hardware');
        const nextmode = this.getNextMode(rawPrjInfo);
        const currmode = this.getCurrentMode(softwarePath, hardwarePath);
        if (currmode === nextmode) {
            const hardware = global_1.opeParam.prjInfo.arch.hardware;
            const software = global_1.opeParam.prjInfo.arch.software;
            hdlFs_1.hdlDir.mkdir(hardware.src);
            hdlFs_1.hdlDir.mkdir(hardware.sim);
            hdlFs_1.hdlDir.mkdir(hardware.data);
            if (currmode === 'LS') {
                hdlFs_1.hdlDir.mkdir(software.src);
                hdlFs_1.hdlDir.mkdir(software.data);
            }
        }
        else if (currmode === "PL" && nextmode === "LS") {
            hdlFs_1.hdlDir.mkdir(hardwarePath);
            for (const path of fs.readdirSync(userPath)) {
                const filePath = hdlFs_1.hdlPath.join(userPath, path);
                if (filePath !== 'Hardware') {
                    hdlFs_1.hdlDir.mvdir(filePath, hardwarePath, true);
                }
            }
            const softwareDataPath = hdlFs_1.hdlPath.join(softwarePath, 'data');
            const softwareSrcPath = hdlFs_1.hdlPath.join(softwarePath, 'src');
            hdlFs_1.hdlDir.mkdir(softwareDataPath);
            hdlFs_1.hdlDir.mkdir(softwareSrcPath);
        }
        else if (currmode === "LS" && nextmode === "PL") {
            const needNotice = vscode.workspace.getConfiguration().get('digital-ide.prj.file.structure.notice', true);
            if (needNotice) {
                const res = await vscode.window.showWarningMessage("Software will be deleted.", { modal: true }, { title: 'Yes', value: true }, { title: 'No', value: false });
                if (res?.value) {
                    hdlFs_1.hdlDir.rmdir(softwarePath);
                }
            }
            else {
                hdlFs_1.hdlDir.rmdir(softwarePath);
            }
            if (fs.existsSync(hardwarePath)) {
                for (const path of fs.readdirSync(hardwarePath)) {
                    const filePath = hdlFs_1.hdlPath.join(hardwarePath, path);
                    hdlFs_1.hdlDir.mvdir(filePath, userPath, true);
                }
                hdlFs_1.hdlDir.rmdir(hardwarePath);
            }
            const userSrcPath = hdlFs_1.hdlPath.join(userPath, 'src');
            const userSimPath = hdlFs_1.hdlPath.join(userPath, 'sim');
            const userDataPath = hdlFs_1.hdlPath.join(userPath, 'data');
            hdlFs_1.hdlDir.mkdir(userSrcPath);
            hdlFs_1.hdlDir.mkdir(userSimPath);
            hdlFs_1.hdlDir.mkdir(userDataPath);
        }
    }
    getNextMode(rawPrjInfo) {
        if (rawPrjInfo.soc && rawPrjInfo.soc.core !== 'none') {
            return 'LS';
        }
        return 'PL';
    }
    getCurrentMode(softwarePath, hardwarePath) {
        if (fs.existsSync(softwarePath) || fs.existsSync(hardwarePath)) {
            return 'LS';
        }
        return 'PL';
    }
}
exports.PrjManage = PrjManage;
const prjManage = new PrjManage();
exports.prjManage = prjManage;
//# sourceMappingURL=prj.js.map