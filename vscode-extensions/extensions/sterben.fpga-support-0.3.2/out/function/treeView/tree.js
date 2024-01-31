"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moduleTreeProvider = void 0;
const vscode = require("vscode");
const global_1 = require("../../global");
const core_1 = require("../../hdlParser/core");
const common_1 = require("../../hdlParser/common");
const hdlFs_1 = require("../../hdlFs");
const common_2 = require("./common");
const icons_1 = require("../../hdlFs/icons");
let needExpand = true;
function canExpandable(element) {
    if (element.icon === 'src' || element.icon === 'sim') { // src and sim can expand anytime
        return true;
    }
    else {
        const modulePath = element.path;
        if (!modulePath) { // unsolved module cannot expand
            return false;
        }
        const moduleName = element.name;
        if (!core_1.hdlParam.hasHdlModule(modulePath, moduleName)) { // test or bug
            return false;
        }
        const module = core_1.hdlParam.getHdlModule(modulePath, moduleName);
        if (module) {
            return module.getInstanceNum() > 0;
        }
        else {
            return false;
        }
    }
}
class ModuleTreeProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.firstTop = {
            src: null,
            sim: null,
        };
        this.srcRootItem = { icon: 'src', type: common_1.HdlFileType.Src, name: 'src', range: null, path: '', parent: null };
        this.simRootItem = { icon: 'sim', type: common_1.HdlFileType.Sim, name: 'sim', range: null, path: '', parent: null };
    }
    refresh(element) {
        if (element) {
            this._onDidChangeTreeData.fire(element);
        }
        else {
            // refresh all the root in default
            this.refreshSim();
            this.refreshSrc();
        }
    }
    refreshSrc() {
        this._onDidChangeTreeData.fire(this.srcRootItem);
    }
    refreshSim() {
        this._onDidChangeTreeData.fire(this.simRootItem);
    }
    getTreeItem(element) {
        let itemName = element.name;
        if (common_2.itemModes.has(element.icon)) {
            itemName = `${element.type}(${itemName})`;
        }
        const expandable = canExpandable(element);
        let collapsibleState;
        if (!expandable) {
            collapsibleState = vscode.TreeItemCollapsibleState.None;
        }
        else if (needExpand) {
            collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        }
        else {
            collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        }
        const treeItem = new vscode.TreeItem(itemName, collapsibleState);
        // set contextValue file -> simulate / netlist
        if (common_2.otherModes.has(element.icon)) {
            treeItem.contextValue = 'other';
        }
        else {
            treeItem.contextValue = 'file';
        }
        // set tooltip
        treeItem.tooltip = element.path;
        if (!treeItem.tooltip) {
            treeItem.tooltip = "can't find the module of this instance";
        }
        // set iconPath
        treeItem.iconPath = (0, icons_1.getIconConfig)(element.icon);
        // set command
        treeItem.command = {
            title: "Open this HDL File",
            command: 'digital-ide.treeView.arch.openFile',
            arguments: [element.path, element.range],
        };
        return treeItem;
    }
    getChildren(element) {
        if (element) {
            const name = element.name;
            if (name === 'sim' || name === 'src') {
                element.parent = null;
                return this.getTopModuleItemList(element);
            }
            else {
                return this.getInstanceItemList(element);
            }
        }
        else {
            // use roots in default
            return [
                this.srcRootItem,
                this.simRootItem,
            ];
        }
    }
    getParent(element) {
        return element.parent;
    }
    getTopModuleItemList(element) {
        // src or sim
        const hardwarePath = global_1.opeParam.prjInfo.arch.hardware;
        const moduleType = element.name;
        const topModules = core_1.hdlParam.getTopModulesByType(moduleType);
        const topModuleItemList = topModules.map(module => ({
            icon: 'top',
            type: moduleType,
            name: module.name,
            range: module.range,
            path: module.path,
            parent: element,
        }));
        if (topModuleItemList.length > 0) {
            const type = moduleType;
            const firstTop = topModuleItemList[0];
            if (!this.firstTop[type]) {
                this.setFirstTop(type, firstTop.name, firstTop.path);
            }
            const name = this.firstTop[type].name;
            const path = this.firstTop[type].path;
            const icon = this.makeFirstTopIconName(type);
            const range = firstTop.range;
            const parent = element;
            const tops = topModuleItemList.filter(item => item.path === path && item.name === name);
            const adjustItemList = [];
            if (tops.length > 0 || !core_1.hdlParam.hasHdlModule(path, name)) {
                // mean that the seleted top is an original top module
                // push it to the top of the *topModuleItemList*
                const headItem = tops[0] ? tops[0] : topModuleItemList[0];
                headItem.icon = icon;
                adjustItemList.push(headItem);
                for (const item of topModuleItemList) {
                    if (item !== headItem) {
                        adjustItemList.push(item);
                    }
                }
            }
            else {
                // mean the selected top is not an original top module
                // create it and add it to the head of *topModuleItemList*
                const selectedTopItem = { icon, type, name, range, path, parent };
                adjustItemList.push(selectedTopItem);
                adjustItemList.push(...topModuleItemList);
            }
            return adjustItemList;
        }
        return topModuleItemList;
    }
    // 获取当前模块下的子模块
    getInstanceItemList(element) {
        if (!element.path) {
            return [];
        }
        const moduleDataItemList = [];
        const targetModule = core_1.hdlParam.getHdlModule(element.path, element.name);
        if (targetModule) {
            for (const instance of targetModule.getAllInstances()) {
                const item = {
                    icon: 'file',
                    type: instance.name,
                    name: instance.type,
                    range: instance.range,
                    path: instance.parentMod.path,
                    parent: element
                };
                if (item.type === element.type && // 防止递归
                    item.name === element.name &&
                    item.path === element.path) {
                    continue;
                }
                item.icon = this.judgeIcon(item, instance);
                moduleDataItemList.push(item);
            }
        }
        else {
            global_1.MainOutput.report(`cannot find ${element} in hdlParam when constructing treeView`, global_1.ReportType.Error);
        }
        return moduleDataItemList;
    }
    setFirstTop(type, name, path) {
        this.firstTop[type] = { name, path };
    }
    makeFirstTopIconName(type) {
        return 'current-' + type + '-top';
    }
    judgeIcon(item, instance) {
        const workspacePath = global_1.opeParam.workspacePath;
        if (instance.module === undefined) {
            return 'File Error';
        }
        if (hdlFs_1.hdlPath.exist(item.path)) {
            if (!item.path?.includes(workspacePath)) {
                return 'remote';
            }
            else {
                const langID = hdlFs_1.hdlFile.getLanguageId(item.path);
                return langID;
            }
        }
        else {
            if (common_2.xilinx.has(instance.type)) {
                return 'cells';
            }
            else {
                return 'File Error';
            }
        }
    }
    getItemType(item) {
        if (!item) {
            return null;
        }
        let currentLevel = item;
        while (currentLevel.parent) {
            currentLevel = currentLevel.parent;
        }
        return currentLevel.type;
    }
}
const moduleTreeProvider = new ModuleTreeProvider();
exports.moduleTreeProvider = moduleTreeProvider;
//# sourceMappingURL=tree.js.map