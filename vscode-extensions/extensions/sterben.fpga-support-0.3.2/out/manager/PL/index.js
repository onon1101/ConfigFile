"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlManage = void 0;
/**
 * PL: program logic
 * Hardware Programming
 */
const vscode = require("vscode");
const xilinx_1 = require("./xilinx");
const common_1 = require("../common");
const global_1 = require("../../global");
const enum_1 = require("../../global/enum");
const hdlFs_1 = require("../../hdlFs");
const tree_1 = require("../../function/treeView/tree");
const common_2 = require("../../hdlParser/common");
class PlManage extends common_1.BaseManage {
    constructor() {
        super();
        this.config = {
            tool: 'default',
            path: '',
            ope: new xilinx_1.XilinxOperation(),
            terminal: null
        };
        if (global_1.opeParam.prjInfo.toolChain) {
            this.config.tool = global_1.opeParam.prjInfo.toolChain;
        }
        const curToolChain = this.config.tool;
        if (curToolChain === enum_1.ToolChainType.Xilinx) {
            const vivadoPath = vscode.workspace.getConfiguration('digital-ide.prj.vivado.install').get('path', '');
            if (hdlFs_1.hdlFile.isDir(vivadoPath)) {
                this.config.path = hdlFs_1.hdlPath.join(hdlFs_1.hdlPath.toSlash(vivadoPath), 'vivado');
                if (global_1.opeParam.os === 'win32') {
                    this.config.path += '.bat';
                }
            }
            else {
                this.config.path = 'vivado';
            }
        }
    }
    launch() {
        this.config.terminal = this.createTerminal('Hardware');
        this.config.terminal.show(true);
        this.config.ope.launch(this.config);
    }
    simulate() {
        if (!this.config.terminal) {
            return;
        }
        this.config.ope.simulate(this.config);
    }
    simulateCli() {
        this.config.ope.simulateCli(this.config);
    }
    simulateGui() {
        this.config.ope.simulateGui(this.config);
    }
    refresh() {
        if (!this.config.terminal) {
            return;
        }
        this.config.ope.refresh(this.config.terminal);
    }
    build() {
        this.config.ope.build(this.config);
    }
    synth() {
        this.config.ope.synth(this.config);
    }
    impl() {
        if (!this.config.terminal) {
            return null;
        }
        this.config.ope.impl(this.config);
    }
    bitstream() {
        this.config.ope.generateBit(this.config);
    }
    program() {
        this.config.ope.program(this.config);
    }
    gui() {
        this.config.ope.gui(this.config);
    }
    exit() {
        if (!this.config.terminal) {
            return null;
        }
        this.config.terminal.show(true);
        this.config.terminal.sendText(`exit`);
        this.config.terminal.sendText(`exit`);
        this.config.terminal = null;
    }
    setSrcTop(item) {
        this.config.ope.setSrcTop(item.name, this.config);
        const type = tree_1.moduleTreeProvider.getItemType(item);
        if (type === common_2.HdlFileType.Src) {
            tree_1.moduleTreeProvider.setFirstTop(common_2.HdlFileType.Src, item.name, item.path);
            tree_1.moduleTreeProvider.refreshSrc();
        }
    }
    setSimTop(item) {
        this.config.ope.setSimTop(item.name, this.config);
        const type = tree_1.moduleTreeProvider.getItemType(item);
        if (type === common_2.HdlFileType.Sim) {
            tree_1.moduleTreeProvider.setFirstTop(common_2.HdlFileType.Sim, item.name, item.path);
            tree_1.moduleTreeProvider.refreshSim();
        }
    }
    async addFiles(files) {
        this.config.ope.addFiles(files, this.config);
    }
    async delFiles(files) {
        this.config.ope.delFiles(files, this.config);
    }
    async addDevice() {
        const propertySchema = global_1.opeParam.propertySchemaPath;
        let propertyParam = hdlFs_1.hdlFile.readJSON(propertySchema);
        const device = await vscode.window.showInputBox({
            password: false,
            ignoreFocusOut: true,
            placeHolder: 'Please input the name of device'
        });
        if (!device) {
            return;
        }
        if (!propertyParam.properties.device.enum.includes(device)) {
            propertyParam.properties.device.enum.push(device);
            hdlFs_1.hdlFile.writeJSON(propertySchema, propertyParam);
            vscode.window.showInformationMessage(`Add the ${device} successfully!!!`);
        }
        else {
            vscode.window.showWarningMessage("The device already exists.");
        }
    }
    async delDevice() {
        const propertySchema = global_1.opeParam.propertySchemaPath;
        let propertyParam = hdlFs_1.hdlFile.readJSON(propertySchema);
        const device = await vscode.window.showQuickPick(propertyParam.properties.device.enum);
        if (!device) {
            return;
        }
        const index = propertyParam.properties.device.enum.indexOf(device);
        propertyParam.properties.device.enum.splice(index, 1);
        hdlFs_1.hdlFile.writeJSON(propertySchema, propertyParam);
        vscode.window.showInformationMessage(`Delete the ${device} successfully!!!`);
    }
}
exports.PlManage = PlManage;
//# sourceMappingURL=index.js.map