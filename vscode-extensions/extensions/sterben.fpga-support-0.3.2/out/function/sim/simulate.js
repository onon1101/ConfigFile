"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Icarus = void 0;
const vscode = require("vscode");
const fs = require("fs");
const child_process = require("child_process");
const hdlParser_1 = require("../../hdlParser");
const global_1 = require("../../global");
const hdlFs_1 = require("../../hdlFs");
const instance_1 = require("./instance");
const enum_1 = require("../../global/enum");
function makeSafeArgPath(path) {
    const haveHeadQuote = path.startsWith('"');
    const haveTailQuote = path.startsWith('"');
    if (haveHeadQuote && haveHeadQuote) {
        return path;
    }
    else if (!haveHeadQuote && !haveTailQuote) {
        return '"' + path + '"';
    }
    else if (!haveHeadQuote && haveTailQuote) {
        return '"' + path;
    }
    else {
        return path + '"';
    }
}
class Simulate {
    constructor() {
        this.regExp = {
            mod: /\/\/ @ sim.module : (?<mod>\w+)/,
            clk: /\/\/ @ sim.clk : (?<clk>\w+)/,
            rst: /\/\/ @ sim.rst : (?<rst>\w+)/,
            end: /#(?<end>[0-9+])\s+\$(finish|stop)/,
            wave: /\$dumpfile\s*\(\s*\"(?<wave>.+)\"\s*\);/,
        };
        this.xilinxLib = [
            "xeclib", "unisims", "unimacro", "unifast", "retarget"
        ];
    }
    /**
     * @description 获取仿真的配置
     * @param path 代码路径
     * @param tool 仿真工具名
     */
    getConfig(path, tool) {
        let simConfig = {
            mod: '',
            clk: '',
            rst: '',
            end: '',
            wave: '',
            simulationHome: '',
            gtkwavePath: '',
            installPath: '',
            iverilogPath: 'iverilog',
            vvpPath: 'vvp' // vvp解释器所在路径
        };
        let code = hdlFs_1.hdlFile.readFile(path);
        if (!code) {
            global_1.MainOutput.report('error when read ' + path, global_1.ReportType.Error, true);
            return;
        }
        for (const element in this.regExp) {
            const regGroup = code.match(this.regExp[element])?.groups;
            if (regGroup) {
                simConfig[element] = regGroup[element];
            }
        }
        const setting = vscode.workspace.getConfiguration();
        // make simulation dir
        const defaultSimulationDir = hdlFs_1.hdlPath.join(global_1.opeParam.prjInfo.arch.prjPath, 'simulation', 'icarus');
        simConfig.simulationHome = setting.get('digital-ide.function.simulate.simulationHome', '');
        if (!fs.existsSync(simConfig.simulationHome)) {
            simConfig.simulationHome = defaultSimulationDir;
        }
        if (!hdlFs_1.hdlFile.isDir(simConfig.simulationHome)) {
            global_1.MainOutput.report('create dir ' + simConfig.simulationHome, global_1.ReportType.Info);
            hdlFs_1.hdlDir.mkdir(simConfig.simulationHome);
        }
        simConfig.gtkwavePath = setting.get('digital-ide.function.simulate.gtkwavePath', 'gtkwave');
        if (simConfig.gtkwavePath !== '' && !hdlFs_1.hdlFile.isDir(simConfig.gtkwavePath)) {
            simConfig.gtkwavePath = 'gtkwave'; // 如果不存在则认为是加入了环境变量
        }
        else {
            if (global_1.opeParam.os === 'win32') {
                simConfig.gtkwavePath = hdlFs_1.hdlPath.join(simConfig.gtkwavePath, 'gtkwave.exe');
            }
            else {
                simConfig.gtkwavePath = hdlFs_1.hdlPath.join(simConfig.gtkwavePath, 'gtkwave');
            }
        }
        simConfig.installPath = setting.get('digital-ide.function.simulate.icarus.installPath', '');
        if (simConfig.installPath !== '' && !hdlFs_1.hdlFile.isDir(simConfig.installPath)) {
            global_1.MainOutput.report(`install path ${simConfig.installPath} is illegal`, global_1.ReportType.Error, true);
            return;
        }
        return simConfig;
    }
    /**
     * @description 获取自带仿真库的路径
     * @param toolChain
     */
    getSimLibArr(toolChain) {
        let libPath = [];
        const setting = vscode.workspace.getConfiguration();
        // 获取xilinx的自带仿真库的路径
        if (toolChain === enum_1.ToolChainType.Xilinx) {
            const simLibPath = setting.get('digital-ide.function.simulate.xilinxLibPath', '');
            if (!hdlFs_1.hdlFile.isDir(simLibPath)) {
                return [];
            }
            const glblPath = hdlFs_1.hdlPath.join(simLibPath, 'glbl.v');
            libPath.push(glblPath);
            for (const element of this.xilinxLib) {
                const xilinxPath = hdlFs_1.hdlPath.join(simLibPath, element);
                libPath.push(xilinxPath);
            }
        }
        return libPath;
    }
}
/**
 * @description icarus 仿真类
 *
 */
class IcarusSimulate extends Simulate {
    constructor() {
        super();
        this.os = global_1.opeParam.os;
        this.prjPath = global_1.opeParam.prjInfo.arch.prjPath;
        this.toolChain = global_1.opeParam.prjInfo.toolChain;
    }
    makeMacroIncludeArguments(includes) {
        const args = [];
        for (const includePath of includes) {
            if (!hdlFs_1.hdlFile.isDir(includePath)) {
                args.push(makeSafeArgPath(includePath));
            }
            else {
                args.push('-I ' + makeSafeArgPath(includePath));
            }
        }
        return args.join(' ').trim();
    }
    makeDependenceArguments(dependences) {
        // 去重
        const visitedPath = new Set;
        const args = [];
        for (const dep of dependences) {
            if (visitedPath.has(dep)) {
                continue;
            }
            args.push(makeSafeArgPath(dep));
            visitedPath.add(dep);
        }
        return args.join(' ').trim();
    }
    makeThirdLibraryArguments(simLibPaths) {
        const fileArgs = [];
        const dirArgs = [];
        for (const libPath of simLibPaths) {
            if (!hdlFs_1.hdlFile.isDir(libPath)) {
                fileArgs.push(makeSafeArgPath(libPath));
            }
            else {
                dirArgs.push('-y ' + makeSafeArgPath(libPath));
            }
        }
        const fileArgsString = fileArgs.join(' ');
        const dirArgsString = dirArgs.join(' ');
        return { fileArgsString, dirArgsString };
    }
    /**
     * generate acutal iverlog simulation command
     * @param name name of top module
     * @param path path of the simulated file
     * @param dependences dependence that not specified in `include macro
     * @returns
     */
    getCommand(name, path, dependences) {
        const simConfig = this.getConfig(path, 'iverilog');
        if (!simConfig) {
            return;
        }
        this.simConfig = simConfig;
        const installPath = simConfig.installPath;
        const iverilogCompileOptions = global_1.opeParam.prjInfo.iverilogCompileOptions;
        if (this.os === 'win32') {
            simConfig.iverilogPath += '.exe';
            simConfig.vvpPath += '.exe';
        }
        if (hdlFs_1.hdlFile.isDir(installPath)) {
            simConfig.iverilogPath = hdlFs_1.hdlPath.join(installPath, simConfig.iverilogPath);
            simConfig.vvpPath = hdlFs_1.hdlPath.join(installPath, simConfig.vvpPath);
        }
        const simLibPaths = this.getSimLibArr(this.toolChain);
        const macroIncludeArgs = this.makeMacroIncludeArguments(iverilogCompileOptions.includes);
        const dependenceArgs = this.makeDependenceArguments(dependences);
        const thirdLibraryArgs = this.makeThirdLibraryArguments(simLibPaths);
        const thirdLibraryFileArgs = thirdLibraryArgs.fileArgsString;
        const thirdLibraryDirArgs = thirdLibraryArgs.dirArgsString;
        const iverilogPath = simConfig.iverilogPath;
        // default is -g2012
        const argu = '-g' + iverilogCompileOptions.standard;
        const outVvpPath = makeSafeArgPath(hdlFs_1.hdlPath.join(simConfig.simulationHome, 'out.vvp'));
        const mainPath = makeSafeArgPath(path);
        const cmd = `${iverilogPath} ${argu} -o ${outVvpPath} -s ${name} ${macroIncludeArgs} ${thirdLibraryDirArgs} ${mainPath} ${dependenceArgs} ${thirdLibraryFileArgs}`;
        global_1.MainOutput.report(cmd, global_1.ReportType.Run);
        return cmd;
    }
    execInTerminal(command, cwd) {
        // let vvp: vscode.Terminal;
        // const targetTerminals = vscode.window.terminals.filter(t => t.name === 'vvp');
        // if (targetTerminals.length > 0) {
        //     vvp = targetTerminals[0];
        // } else {
        //     vvp = vscode.window.createTerminal('vvp');
        // }
        // let cmd = `${vvpPath} ${outVvpPath}`;
        // if (simConfig.wave !== '') {
        //     let waveExtname = simConfig.wave.split('.');
        //     cmd += '-' + waveExtname[simConfig.wave.length - 1];
        // }
        // vvp.show(true);
        // vvp.sendText(cmd);
        // if (simConfig.wave !== '') {
        //     vvp.sendText(`${simConfig.gtkwavePath} ${simConfig.wave}`);
        // } else {
        //     MainOutput.report('There is no wave image path in this testbench', ReportType.Error);
        // }
    }
    execInOutput(command, cwd) {
        const simConfig = this.simConfig;
        if (!simConfig) {
            return;
        }
        child_process.exec(command, { cwd }, (error, stdout, stderr) => {
            if (error) {
                global_1.MainOutput.report('Error took place when run ' + command, global_1.ReportType.Error);
                global_1.MainOutput.report('Reason: ' + stderr, global_1.ReportType.Error);
            }
            else {
                global_1.MainOutput.report(stdout, global_1.ReportType.Info);
                const vvpOutFile = hdlFs_1.hdlPath.join(simConfig.simulationHome, 'out.vvp');
                global_1.MainOutput.report("Create vvp to " + vvpOutFile, global_1.ReportType.Run);
                const outVvpPath = hdlFs_1.hdlPath.join(simConfig.simulationHome, 'out.vvp');
                const vvpPath = simConfig.vvpPath;
                // run vvp to interrupt script
                const vvpCommand = `${vvpPath} ${outVvpPath}`;
                global_1.MainOutput.report(vvpCommand, global_1.ReportType.Run);
                child_process.exec(vvpCommand, { cwd }, (error, stdout, stderr) => {
                    if (error) {
                        global_1.MainOutput.report('Error took place when run ' + vvpCommand, global_1.ReportType.Error);
                        global_1.MainOutput.report('Reason: ' + stderr, global_1.ReportType.Error);
                    }
                    else {
                        global_1.MainOutput.report(stdout, global_1.ReportType.Info);
                    }
                });
            }
        });
    }
    exec(command, cwd) {
        const simConfig = this.simConfig;
        if (!simConfig) {
            global_1.MainOutput.report('this.simConfig is empty when exec');
            return;
        }
        const runInTerminal = vscode.workspace.getConfiguration().get('digital-ide.function.simulate.runInTerminal');
        if (runInTerminal) {
            this.execInTerminal(command, cwd);
        }
        else {
            global_1.MainOutput.show();
            this.execInOutput(command, cwd);
        }
    }
    getAllOtherDependences(path, name) {
        const deps = hdlParser_1.hdlParam.getAllDependences(path, name);
        if (deps) {
            return deps.others;
        }
        else {
            global_1.MainOutput.report('Fail to get dependences of path: ' + path + ' name: ' + name, global_1.ReportType.Warn);
            return [];
        }
    }
    simulateByHdlModule(hdlModule) {
        const name = hdlModule.name;
        const path = hdlModule.path;
        if (!hdlParser_1.hdlParam.isTopModule(path, name, false)) {
            const warningMsg = name + ' in ' + path + ' is not top module';
            global_1.MainOutput.report(warningMsg, global_1.ReportType.Warn, true);
            return;
        }
        const dependences = this.getAllOtherDependences(path, name);
        const simulationCommand = this.getCommand(name, path, dependences);
        if (simulationCommand) {
            const cwd = hdlFs_1.hdlPath.resolve(path, '..');
            this.exec(simulationCommand, cwd);
        }
        else {
            const errorMsg = 'Fail to generate command';
            global_1.MainOutput.report(errorMsg, global_1.ReportType.Error, true);
            return;
        }
    }
    async simulateModule(hdlModule) {
        this.simulateByHdlModule(hdlModule);
    }
    async simulateFile() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const uri = editor.document.uri;
        const path = hdlFs_1.hdlPath.toSlash(uri.fsPath);
        const currentFile = hdlParser_1.hdlParam.getHdlFile(path);
        if (!currentFile) {
            global_1.MainOutput.report('path ' + path + ' is not a hdlFile', global_1.ReportType.Error, true);
            return;
        }
        const items = (0, instance_1.getSelectItem)(currentFile.getAllHdlModules());
        if (items.length) {
            let selectModule;
            if (items.length === 1) {
                selectModule = items[0].module;
            }
            else {
                const select = await vscode.window.showQuickPick(items, { placeHolder: 'choose a top module' });
                if (select) {
                    selectModule = select.module;
                }
                else {
                    return;
                }
            }
            this.simulateByHdlModule(selectModule);
        }
    }
}
const icarus = new IcarusSimulate();
var Icarus;
(function (Icarus) {
    async function simulateModule(hdlModule) {
        await icarus.simulateModule(hdlModule);
    }
    Icarus.simulateModule = simulateModule;
    async function simulateFile() {
        await icarus.simulateFile();
    }
    Icarus.simulateFile = simulateFile;
})(Icarus || (Icarus = {}));
exports.Icarus = Icarus;
;
//# sourceMappingURL=simulate.js.map