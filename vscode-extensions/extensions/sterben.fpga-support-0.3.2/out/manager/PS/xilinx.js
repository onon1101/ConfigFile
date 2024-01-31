"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XilinxOperation = void 0;
const vscode = require("vscode");
const global_1 = require("../../global");
const hdlFs_1 = require("../../hdlFs");
/**
 * @state finish-untest
 * @description xilinx工具链下PS端的操作类
 */
class XilinxOperation {
    get config() {
        return {
            path: hdlFs_1.hdlPath.join(global_1.opeParam.extensionPath, 'resources', 'script', 'xilinx', 'soft'),
            hw: "SDK_Platform",
            bsp: "BSP_package",
            dat: global_1.opeParam.prjInfo.arch.software.data,
            src: global_1.opeParam.prjInfo.arch.software.src,
            soc: {
                core: "ps7_cortexa9_0",
                bd: "template",
                app: "Hello World",
                os: "standalone"
            }
        };
    }
    launch(config) {
        const hdfs = hdlFs_1.hdlFile.pickFileRecursive(this.config.dat, [], p => p.endsWith('.hdf'));
        if (hdfs.length) {
            vscode.window.showErrorMessage(`There is no hdf file in ${this.config.dat}.`);
            return null;
        }
        const scriptPath = `${this.config.path}/launch.tcl`;
        const script = `
setws ${this.config.src}
if { [getprojects -type hw] == "" } {
    createhw -name ${this.config.hw} -hwspec ${this.config.dat}/
} else {
    openhw ${this.config.src}/[getprojects -type hw]/system.hdf 
}

if { [getprojects -type bsp] == "" } {
    createbsp -name ${this.config.bsp} \\
                -hwproject ${this.config.hw} \\
                -proc ${this.config.soc.core} \\
                -os ${this.config.soc.os}
}

if { [getprojects -type app] == "" } {
    createapp -name ${this.config.soc.bd} \\
                -hwproject ${this.config.hw} \\
                -bsp ${this.config.bsp} \\
                -proc ${this.config.soc.core} \\
                -os ${this.config.soc.os} \\
                -lang C \\
                -app {${this.config.soc.app}}
}
file delete ${scriptPath} -force\n`;
        hdlFs_1.hdlFile.writeFile(scriptPath, script);
        config.terminal?.show(true);
        config.terminal?.sendText(`${config.path} ${scriptPath}`);
    }
    build(config) {
        const scriptPath = `${this.config.path}/build.tcl`;
        const script = `
setws ${this.config.src}
openhw ${this.config.src}/[getprojects -type hw]/system.hdf
projects -build
file delete ${scriptPath} -force\n`;
        hdlFs_1.hdlFile.writeFile(scriptPath, script);
        config.terminal?.show(true);
        config.terminal?.sendText(`${config.path} ${scriptPath}`);
    }
    program(config) {
        const len = this.config.soc.core.length;
        const index = this.config.soc.core.slice(len - 1, len);
        const scriptPath = `${this.config.path}/program.tcl`;
        const script = `
setws ${this.config.src}
openhw ${this.config.src}/[getprojects -type hw]/system.hdf
connect
targets -set -filter {name =~ "ARM*#${index}"}
rst -system
namespace eval xsdb { 
    source ${this.config.src}/${this.config.hw}/ps7_init.tcl
    ps7_init
}
fpga ./${this.config.soc.bd}.bit
dow  ${this.config.src}/${this.config.soc.bd}/Debug/${this.config.soc.bd}.elf
con
file delete ${scriptPath} -force\n`;
        hdlFs_1.hdlFile.writeFile(scriptPath, script);
        config.terminal?.show(true);
        config.terminal?.sendText(`${config.path} ${scriptPath}`);
    }
}
exports.XilinxOperation = XilinxOperation;
//# sourceMappingURL=xilinx.js.map