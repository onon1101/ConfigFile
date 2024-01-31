"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PsManage = void 0;
/**
 * PS: processing system
 * software of cpu
 */
const vscode = require("vscode");
const global_1 = require("../../global");
const enum_1 = require("../../global/enum");
const hdlFs_1 = require("../../hdlFs");
const common_1 = require("../common");
const xilinx_1 = require("./xilinx");
class PsManage extends common_1.BaseManage {
    constructor() {
        super();
        this.config = {
            tool: 'default',
            path: '',
            ope: new xilinx_1.XilinxOperation(),
            terminal: this.createTerminal('PS')
        };
        // get tool chain
        if (global_1.opeParam.prjInfo.toolChain) {
            this.config.tool = global_1.opeParam.prjInfo.toolChain;
        }
        // get install path & operation object
        if (this.config.tool === enum_1.ToolChainType.Xilinx) {
            const xsdkPath = vscode.workspace.getConfiguration('digital-ide.prj.xsdk.install').get('path', '');
            if (hdlFs_1.hdlFile.isDir(xsdkPath)) {
                this.config.path = hdlFs_1.hdlPath.join(hdlFs_1.hdlPath.toSlash(xsdkPath), 'xsct');
                if (global_1.opeParam.os === "win32") {
                    this.config.path += '.bat';
                }
            }
            else {
                this.config.path = 'xsct';
            }
        }
    }
    launch() {
        this.config.terminal = this.createTerminal('Software');
        this.config.ope.launch(this.config);
    }
    build() {
        this.config.terminal = this.createTerminal('Software');
        this.config.ope.build(this.config);
    }
    program() {
        this.config.terminal = this.createTerminal('Software');
        this.config.ope.program(this.config);
    }
}
exports.PsManage = PsManage;
//# sourceMappingURL=index.js.map