"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toolTreeProvider = exports.softwareTreeProvider = exports.hardwareTreeProvider = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const fspath = require("path");
const global_1 = require("../../global");
const hdlFs_1 = require("../../hdlFs");
const icons_1 = require("../../hdlFs/icons");
const ignore_1 = require("../../manager/ignore");
class BaseCommandTreeProvider {
    constructor(config, contextValue) {
        this.config = config;
        this.contextValue = contextValue;
    }
    // 根据对象遍历属性，返回CommandDataItem数组
    makeCommandDataItem(object) {
        const childDataItemList = [];
        for (const key of Object.keys(object)) {
            const el = object[key];
            const dataItem = { name: key, cmd: el.cmd, icon: el.icon, tip: el.tip, children: el.children };
            childDataItemList.push(dataItem);
        }
        return childDataItemList;
    }
    getChildren(element) {
        if (element) {
            if (element.children) {
                return this.makeCommandDataItem(element.children);
            }
            else {
                return [];
            }
        }
        else { // 第一层
            return this.makeCommandDataItem(this.config);
        }
    }
    getElementChildrenNum(element) {
        if (element.children) {
            return Object.keys(element.children).length;
        }
        return 0;
    }
    // 根据输入的CommandDataItem转化为vscode.TreeItem
    getTreeItem(element) {
        const childNum = this.getElementChildrenNum(element);
        const treeItem = new vscode.TreeItem(element.name, childNum === 0 ?
            vscode.TreeItemCollapsibleState.None :
            vscode.TreeItemCollapsibleState.Collapsed);
        treeItem.contextValue = this.contextValue;
        treeItem.command = {
            title: element.cmd,
            command: element.cmd,
        };
        treeItem.tooltip = element.tip;
        treeItem.iconPath = (0, icons_1.getIconConfig)(element.icon);
        return treeItem;
    }
}
;
class HardwareTreeProvider extends BaseCommandTreeProvider {
    constructor() {
        const config = {
            Launch: {
                cmd: 'digital-ide.hard.launch',
                icon: 'cmd',
                tip: 'Launch FPGA development assist function'
            },
            Simulate: {
                cmd: 'digital-ide.hard.simulate',
                icon: 'toolBox',
                tip: 'Launch the manufacturer Simulation',
                children: {
                    CLI: {
                        cmd: 'digital-ide.hard.simulate.cli',
                        icon: 'branch',
                        tip: 'Launch the manufacturer Simulation in CLI'
                    },
                    GUI: {
                        cmd: 'digital-ide.hard.simulate.gui',
                        icon: 'branch',
                        tip: 'Launch the manufacturer Simulation in GUI'
                    },
                }
            },
            Refresh: {
                cmd: 'digital-ide.hard.refresh',
                icon: 'cmd',
                tip: 'Refresh the current project file'
            },
            Build: {
                cmd: 'digital-ide.hard.build',
                icon: 'toolBox',
                tip: 'Build the current fpga project',
                children: {
                    Synth: {
                        cmd: 'digital-ide.hard.build.synth',
                        icon: 'branch',
                        tip: 'Synth the current project'
                    },
                    Impl: {
                        cmd: 'digital-ide.hard.build.impl',
                        icon: 'branch',
                        tip: 'Impl the current project'
                    },
                    BitStream: {
                        cmd: 'digital-ide.hard.build.bitstream',
                        icon: 'branch',
                        tip: 'Generate the BIT File'
                    },
                }
            },
            Program: {
                cmd: 'digital-ide.hard.program',
                icon: 'cmd',
                tip: 'Download the bit file into the device'
            },
            GUI: {
                cmd: 'digital-ide.hard.gui',
                icon: 'cmd',
                tip: 'Open the GUI'
            },
            Exit: {
                cmd: 'digital-ide.hard.exit',
                icon: 'cmd',
                tip: 'Exit the current project'
            }
        };
        super(config, 'HARD');
    }
}
;
class SoftwareTreeProvider extends BaseCommandTreeProvider {
    constructor() {
        const config = {
            Launch: {
                cmd: 'digital-ide.soft.launch',
                icon: 'cmd',
                tip: 'Launch SDK development assist function'
            },
            Build: {
                cmd: 'digital-ide.soft.build',
                icon: 'cmd',
                tip: 'Build the current SDK project'
            },
            Download: {
                cmd: 'digital-ide.soft.download',
                icon: 'cmd',
                tip: 'Download the boot file into the device'
            },
        };
        super(config, 'SOFT');
    }
}
class ToolTreeProvider extends BaseCommandTreeProvider {
    constructor() {
        const config = {
            Clean: {
                cmd: 'digital-ide.tool.clean',
                icon: 'clean',
                tip: 'Clean the current project'
            }
        };
        super(config, 'TOOL');
        vscode.commands.registerCommand('digital-ide.tool.clean', this.clean);
    }
    async clean() {
        const workspacePath = global_1.opeParam.workspacePath;
        // remove prjPath & .xil
        const prjPath = global_1.opeParam.prjInfo.arch.prjPath;
        const xilFolder = hdlFs_1.hdlPath.join(workspacePath, '.Xil');
        hdlFs_1.hdlDir.rmdir(prjPath);
        hdlFs_1.hdlDir.rmdir(xilFolder);
        // move bd * ip
        const plName = global_1.opeParam.prjInfo.prjName.PL;
        const targetPath = fspath.dirname(global_1.opeParam.prjInfo.arch.hardware.src);
        const sourceIpPath = `${workspacePath}/prj/xilinx/${plName}.srcs/sources_1/ip`;
        const sourceBdPath = `${workspacePath}/prj/xilinx/${plName}.srcs/sources_1/bd`;
        hdlFs_1.hdlDir.mvdir(sourceIpPath, targetPath, true);
        hdlFs_1.hdlDir.mvdir(sourceBdPath, targetPath, true);
        const ignores = ignore_1.hdlIgnore.getIgnoreFiles();
        const strFiles = hdlFs_1.hdlFile.pickFileRecursive(workspacePath, ignores, p => p.endsWith('.str'));
        for (const path of strFiles) {
            hdlFs_1.hdlFile.removeFile(path);
        }
        const logFiles = hdlFs_1.hdlFile.pickFileRecursive(workspacePath, ignores, p => p.endsWith('.log'));
        for (const path of logFiles) {
            hdlFs_1.hdlFile.readFile(path);
        }
        global_1.MainOutput.report('finish digital-ide.tool.clean');
    }
}
const hardwareTreeProvider = new HardwareTreeProvider();
exports.hardwareTreeProvider = hardwareTreeProvider;
const softwareTreeProvider = new SoftwareTreeProvider();
exports.softwareTreeProvider = softwareTreeProvider;
const toolTreeProvider = new ToolTreeProvider();
exports.toolTreeProvider = toolTreeProvider;
//# sourceMappingURL=command.js.map