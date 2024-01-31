"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XilinxBd = exports.tools = exports.XilinxOperation = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const child_process_1 = require("child_process");
const fspath = require("path");
const fs = require("fs");
const global_1 = require("../../global");
const core_1 = require("../../hdlParser/core");
const hdlFs_1 = require("../../hdlFs");
const outputChannel_1 = require("../../global/outputChannel");
;
;
;
;
;
/**
 * xilinx operation under PL
 */
class XilinxOperation {
    constructor() {
        this.guiLaunched = false;
    }
    get xipRepo() {
        return global_1.opeParam.prjInfo.IP_REPO;
    }
    get xipPath() {
        return hdlFs_1.hdlPath.join(global_1.opeParam.extensionPath, 'IP_repo');
    }
    get xbdPath() {
        return hdlFs_1.hdlPath.join(global_1.opeParam.extensionPath, 'lib', 'xilinx', 'bd');
    }
    get xilinxPath() {
        return hdlFs_1.hdlPath.join(global_1.opeParam.extensionPath, 'resources', 'script', 'xilinx');
    }
    get prjPath() {
        return global_1.opeParam.prjInfo.arch.prjPath;
    }
    get srcPath() {
        return global_1.opeParam.prjInfo.arch.hardware.src;
    }
    get simPath() {
        return global_1.opeParam.prjInfo.arch.hardware.sim;
    }
    get datPath() {
        return global_1.opeParam.prjInfo.arch.hardware.data;
    }
    get softSrc() {
        return global_1.opeParam.prjInfo.arch.software.src;
    }
    get HWPath() {
        return fspath.dirname(this.srcPath);
    }
    get extensionPath() {
        return global_1.opeParam.extensionPath;
    }
    get prjConfig() {
        return global_1.opeParam.prjInfo;
    }
    get custom() {
        return {
            ipRepo: vscode.workspace.getConfiguration().get('digital-ide.prj.xilinx.IP.repo.path', ''),
            bdRepo: vscode.workspace.getConfiguration().get('digital-ide.prj.xilinx.BD.repo.path', '')
        };
    }
    get topMod() {
        return {
            src: global_1.opeParam.firstSrcTopModule.name,
            sim: global_1.opeParam.firstSimTopModule.name,
        };
    }
    get prjInfo() {
        return {
            path: hdlFs_1.hdlPath.join(this.prjPath, 'xilinx'),
            name: global_1.opeParam.prjInfo.prjName.PL,
            device: global_1.opeParam.prjInfo.device
        };
    }
    /**
     * xilinx下的launch运行，打开存在的工程或者再没有工程时进行新建
     * @param config
     */
    async launch(config) {
        this.guiLaunched = false;
        const vivadoTerminal = config.terminal;
        if (!vivadoTerminal) {
            return undefined;
        }
        let scripts = [];
        let prjFilePath = this.prjPath;
        const prjFiles = hdlFs_1.hdlFile.pickFileRecursive(prjFilePath, [], filePath => filePath.endsWith('.xpr'));
        if (prjFiles.length) {
            if (prjFiles.length > 1) {
                const selection = await vscode.window.showQuickPick(prjFiles, { placeHolder: "Which project you want to open?" });
                if (selection) {
                    this.open(selection, scripts);
                }
            }
            else {
                prjFilePath = prjFiles[0];
                this.open(prjFilePath, scripts);
            }
        }
        else {
            if (!hdlFs_1.hdlDir.mkdir(this.prjInfo.path)) {
                vscode.window.showErrorMessage(`mkdir ${this.prjInfo.path} failed`);
                return undefined;
            }
            this.create(scripts);
        }
        const tclPath = hdlFs_1.hdlPath.join(this.xilinxPath, 'launch.tcl');
        scripts.push(this.getRefreshCmd());
        scripts.push(`file delete ${tclPath} -force`);
        const tclCommands = scripts.join('\n') + '\n';
        hdlFs_1.hdlFile.writeFile(tclPath, tclCommands);
        const argu = `-notrace -nolog -nojournal`;
        const cmd = `${config.path} -mode tcl -s ${tclPath} ${argu}`;
        vivadoTerminal.show(true);
        vivadoTerminal.sendText(cmd);
    }
    create(scripts) {
        scripts.push(`set_param general.maxThreads 8`);
        scripts.push(`create_project ${this.prjInfo.name} ${this.prjInfo.path} -part ${this.prjInfo.device} -force`);
        scripts.push(`set_property SOURCE_SET source_1   [get_filesets sim_1]`);
        scripts.push(`set_property top_lib xil_defaultlib [get_filesets sim_1]`);
        scripts.push(`update_compile_order -fileset sim_1 -quiet`);
    }
    open(path, scripts) {
        scripts.push(`set_param general.maxThreads 8`);
        scripts.push(`open_project ${path} -quiet`);
    }
    getRefreshCmd() {
        const scripts = [];
        // 清除所有源文件
        scripts.push(`remove_files -quiet [get_files]`);
        // 导入 IP_repo_paths
        scripts.push(`set xip_repo_paths {}`);
        if (fs.existsSync(this.custom.ipRepo)) {
            scripts.push(`lappend xip_repo_paths ${this.custom.ipRepo}`);
        }
        this.xipRepo.forEach(ip => scripts.push(`lappend xip_repo_paths ${this.xipPath}/${ip}`));
        scripts.push(`set_property ip_repo_paths $xip_repo_paths [current_project] -quiet`);
        scripts.push(`update_ip_catalog -quiet`);
        // 导入bd设计源文件
        if (hdlFs_1.hdlFile.isHasAttr(this.prjConfig, "SOC.bd")) {
            const bd = this.prjConfig.soc.bd;
            const bdFile = bd + '.bd';
            let bdSrcPath = hdlFs_1.hdlPath.join(this.xbdPath, bdFile);
            if (!hdlFs_1.hdlFile.isFile(bdSrcPath)) {
                bdSrcPath = hdlFs_1.hdlPath.join(this.custom.bdRepo, bdFile);
            }
            if (!hdlFs_1.hdlFile.isFile(bdSrcPath)) {
                vscode.window.showErrorMessage(`can not find ${bd}.bd in ${this.xbdPath} and ${this.custom.bdRepo}`);
            }
            else {
                if (hdlFs_1.hdlFile.copyFile(bdSrcPath, hdlFs_1.hdlPath.join(this.HWPath, 'bd', bd, bdFile))) {
                    vscode.window.showErrorMessage(`cp ${bd} failed, can not find ${bdSrcPath}`);
                }
            }
            const bdPaths = [
                hdlFs_1.hdlPath.join(this.HWPath, 'bd'),
                hdlFs_1.hdlPath.join(this.prjInfo.path, this.prjInfo.name + '.src', 'source_1', 'bd')
            ];
            hdlFs_1.hdlFile.pickFileRecursive(bdPaths, [], (filePath) => {
                if (filePath.endsWith('.bd')) {
                    scripts.push(`add_files ${filePath} -quiet`);
                    scripts.push(`add_files ${fspath.dirname(filePath)}/hdl -quiet`);
                }
            });
            if (bd) {
                const loadBdPath = hdlFs_1.hdlPath.join(this.HWPath, 'bd', bd, bdFile);
                scripts.push(`generate_target all [get_files ${loadBdPath}] -quiet`);
                scripts.push(`make_wrapper -files [get_files ${loadBdPath}] -top -quiet`);
                scripts.push(`open_bd_design ${loadBdPath} -quiet`);
            }
        }
        const mrefPath = hdlFs_1.hdlPath.join(this.HWPath, 'bd', 'mref');
        hdlFs_1.hdlFile.pickFileRecursive(mrefPath, [], filePath => {
            if (filePath.endsWith('.tcl')) {
                scripts.push(`source ${filePath}`);
            }
        });
        // 导入ip设计源文件
        const ipPaths = [
            hdlFs_1.hdlPath.join(this.HWPath, 'ip'),
            hdlFs_1.hdlPath.join(this.prjInfo.path, this.prjInfo.name + '.src', 'source_1', 'ip')
        ];
        hdlFs_1.hdlFile.pickFileRecursive(ipPaths, [], filePath => {
            if (filePath.endsWith('.xci')) {
                scripts.push(`add_files ${filePath} -quiet`);
            }
        });
        // 导入非本地的设计源文件
        const HDLFiles = core_1.hdlParam.getAllHdlFiles();
        for (const file of HDLFiles) {
            if (file.type === "src") {
                scripts.push(`add_files ${file.path} -quiet`);
            }
            scripts.push(`add_files -fileset sim_1 ${file.path} -quiet`);
        }
        scripts.push(`add_files -fileset constrs_1 ${this.datPath} -quiet`);
        if (this.topMod.src !== '') {
            scripts.push(`set_property top ${this.topMod.src} [current_fileset]`);
        }
        if (this.topMod.sim !== '') {
            scripts.push(`set_property top ${this.topMod.sim} [get_filesets sim_1]`);
        }
        let script = '';
        for (let i = 0; i < scripts.length; i++) {
            const content = scripts[i];
            script += content + '\n';
        }
        const scriptPath = `${this.xilinxPath}/refresh.tcl`;
        script += `file delete ${scriptPath} -force\n`;
        hdlFs_1.hdlFile.writeFile(scriptPath, script);
        const cmd = `source ${scriptPath} -quiet`;
        return cmd;
    }
    refresh(terminal) {
        const cmd = this.getRefreshCmd();
        terminal.sendText(cmd);
    }
    simulate(config) {
        this.simulateCli(config);
    }
    simulateGui(config) {
        const scriptPath = `${this.xilinxPath}/simulate.tcl`;
        const script = `
        if {[current_sim] != ""} {
            relaunch_sim -quiet
        } else {
            launch_simulation -quiet
        }

        set curr_wave [current_wave_config]
        if { [string length $curr_wave] == 0 } {
            if { [llength [get_objects]] > 0} {
                add_wave /
                set_property needs_save false [current_wave_config]
            } else {
                send_msg_id Add_Wave-1 WARNING "No top level signals found. Simulator will start without a wave window. If you want to open a wave window go to 'File->New Waveform Configuration' or type 'create_wave_config' in the TCL console."
            }
        }
        run 1us

        start_gui -quiet
        file delete ${scriptPath} -force\n`;
        hdlFs_1.hdlFile.writeFile(scriptPath, script);
        const cmd = `source ${scriptPath} -quiet`;
        config.terminal?.sendText(cmd);
    }
    simulateCli(config) {
        const scriptPath = hdlFs_1.hdlPath.join(this.xilinxPath, 'simulate.tcl');
        const script = `
        if {[current_sim] != ""} {
            relaunch_sim -quiet
        } else {
            launch_simulation -quiet
        }

        set curr_wave [current_wave_config]
        if { [string length $curr_wave] == 0 } {
            if { [llength [get_objects]] > 0} {
                add_wave /
                set_property needs_save false [current_wave_config]
            } else {
                send_msg_id Add_Wave-1 WARNING "No top level signals found. Simulator will start without a wave window. If you want to open a wave window go to 'File->New Waveform Configuration' or type 'create_wave_config' in the TCL console."
            }
        }
        run 1us
        file delete ${scriptPath} -force\n`;
        hdlFs_1.hdlFile.writeFile(scriptPath, script);
        const cmd = `source ${scriptPath} -quiet`;
        config.terminal?.sendText(cmd);
    }
    synth(config) {
        let quietArg = '';
        if (global_1.opeParam.prjInfo.enableShowLog) {
            quietArg = '-quiet';
        }
        let script = '';
        script += `reset_run synth_1 ${quietArg};`;
        script += `launch_runs synth_1 ${quietArg} -jobs 4;`;
        script += `wait_on_run synth_1 ${quietArg}`;
        config.terminal?.sendText(script);
    }
    impl(config) {
        let quietArg = '';
        if (global_1.opeParam.prjInfo.enableShowLog) {
            quietArg = '-quiet';
        }
        let script = '';
        script += `reset_run impl_1 ${quietArg};`;
        script += `launch_runs impl_1 ${quietArg} -jobs 4;`;
        script += `wait_on_run impl_1 ${quietArg};`;
        script += `open_run impl_1 ${quietArg};`;
        script += `report_timing_summary ${quietArg}`;
        config.terminal?.sendText(script);
    }
    build(config) {
        let quietArg = '';
        if (this.prjConfig.enableShowLog) {
            quietArg = '-quiet';
        }
        let script = '';
        script += `reset_run synth_1 ${quietArg}\n`;
        script += `launch_runs synth_1 ${quietArg} -jobs 4\n`;
        script += `wait_on_run synth_1 ${quietArg}\n`;
        script += `reset_run impl_1 ${quietArg}\n`;
        script += `launch_runs impl_1 ${quietArg} -jobs 4\n`;
        script += `wait_on_run impl_1 ${quietArg}\n`;
        script += `open_run impl_1 ${quietArg}\n`;
        script += `report_timing_summary ${quietArg}\n`;
        this.generateBit(config);
        const scriptPath = `${this.xilinxPath}/build.tcl`;
        script += `source ${scriptPath} -notrace\n`;
        script += `file delete ${scriptPath} -force\n`;
        hdlFs_1.hdlFile.writeFile(scriptPath, script);
        const cmd = `source ${scriptPath} -quiet`;
        config.terminal?.sendText(cmd);
    }
    generateBit(config) {
        let scripts = [];
        let core = this.prjConfig.soc.core;
        let sysdefPath = `${this.prjInfo.path}/${this.prjInfo.name}.runs` +
            `/impl_1/${this.prjInfo.name}.sysdef`;
        if (core && (core !== "none")) {
            if (fs.existsSync(sysdefPath)) {
                scripts.push(`file copy -force ${sysdefPath} ${this.softSrc}/[current_project].hdf`);
            }
            else {
                scripts.push(`write_hwdef -force -file ${this.softSrc}/[current_project].hdf`);
            }
            // TODO: 是否专门设置输出文件路径的参数
            scripts.push(`write_bitstream ./[current_project].bit -force -quiet`);
        }
        else {
            scripts.push(`write_bitstream ./[current_project].bit -force -quiet -bin_file`);
        }
        let script = '';
        for (let i = 0; i < scripts.length; i++) {
            const content = scripts[i];
            script += content + '\n';
        }
        let scriptPath = `${this.xilinxPath}/bit.tcl`;
        script += `file delete ${scriptPath} -force\n`;
        hdlFs_1.hdlFile.writeFile(scriptPath, script);
        const cmd = `source ${scriptPath} -quiet`;
        config.terminal?.sendText(cmd);
    }
    program(config) {
        let scriptPath = `${this.xilinxPath}/program.tcl`;
        let script = `
        open_hw -quiet
        connect_hw_server -quiet
        set found 0
        foreach hw_target [get_hw_targets] {
            current_hw_target $hw_target
            open_hw_target -quiet
            foreach hw_device [get_hw_devices] {
                if { [string equal -length 6 [get_property PART $hw_device] ${this.prjInfo.device}] == 1 } {
                    puts "------Successfully Found Hardware Target with a ${this.prjInfo.device} device------ "
                    current_hw_device $hw_device
                    set found 1
                }
            }
            if {$found == 1} {break}
            close_hw_target
        }   

        #download the hw_targets
        if {$found == 0 } {
            puts "******ERROR : Did not find any Hardware Target with a ${this.prjInfo.device} device****** "
        } else {
            set_property PROGRAM.FILE ./[current_project].bit [current_hw_device]
            program_hw_devices [current_hw_device] -quiet
            disconnect_hw_server -quiet
        }
        file delete ${scriptPath} -force\n`;
        hdlFs_1.hdlFile.writeFile(scriptPath, script);
        const cmd = `source ${scriptPath} -quiet`;
        config.terminal?.sendText(cmd);
    }
    gui(config) {
        if (config.terminal) {
            config.terminal.sendText("start_gui -quiet");
            this.guiLaunched = true;
        }
        else {
            const prjFiles = hdlFs_1.hdlFile.pickFileRecursive(this.prjPath, [], filePath => filePath.endsWith('.xpr'));
            const arg = '-notrace -nolog -nojournal';
            const cmd = `${config.path} -mode gui -s ${prjFiles[0]} ${arg}`;
            (0, child_process_1.exec)(cmd, (error, stdout, stderr) => {
                if (error !== null) {
                    vscode.window.showErrorMessage(stderr);
                }
                else {
                    vscode.window.showInformationMessage("GUI open successfully");
                    this.guiLaunched = true;
                }
            });
        }
    }
    addFiles(files, config) {
        if (!this.guiLaunched) {
            this.processFileInPrj(files, config, "add_file");
        }
    }
    delFiles(files, config) {
        if (!this.guiLaunched) {
            this.processFileInPrj(files, config, "remove_files");
        }
    }
    setSrcTop(name, config) {
        const cmd = `set_property top ${name} [current_fileset]`;
        config.terminal?.sendText(cmd);
    }
    setSimTop(name, config) {
        const cmd = `set_property top ${name} [get_filesets sim_1]`;
        config.terminal?.sendText(cmd);
    }
    processFileInPrj(files, config, command) {
        const terminal = config.terminal;
        if (terminal) {
            for (const file of files) {
                terminal.sendText(command + ' ' + file);
            }
        }
    }
    xExecShowLog(logPath) {
        let logPathList = ["runme", "xvlog", "elaborate"];
        let fileName = fspath.basename(logPath, ".log");
        if (!logPathList.includes(fileName)) {
            return null;
        }
        let content = hdlFs_1.hdlFile.readFile(logPath);
        if (!content) {
            return null;
        }
        if (content.indexOf("INFO: [Common 17-206] Exiting Vivado") === -1) {
            return null;
        }
        let log = '';
        var regExp = /(?<head>CRITICAL WARNING:|ERROR:)(?<content>[\w\W]*?)(INFO:|WARNING:)/g;
        while (true) {
            let match = regExp.exec(content);
            if (match === null) {
                break;
            }
            if (match.groups) {
                log += match.groups.head.replace("ERROR:", "[error] :");
                log += match.groups.content;
            }
        }
        outputChannel_1.MainOutput.report(log);
    }
}
exports.XilinxOperation = XilinxOperation;
class XilinxBd {
    constructor() {
        this.setting = vscode.workspace.getConfiguration();
        this.extensionPath = global_1.opeParam.extensionPath;
        this.xbdPath = hdlFs_1.hdlPath.join(this.extensionPath, 'lib', 'bd', 'xilinx');
        this.schemaPath = global_1.opeParam.propertySchemaPath;
        this.schemaCont = hdlFs_1.hdlFile.readJSON(this.schemaPath);
        this.bdEnum = this.schemaCont.properties.soc.properties.bd.enum;
        this.bdRepo = this.setting.get('digital-ide.prj.xilinx.BD.repo.path', '');
    }
    getConfig() {
        this.extensionPath = global_1.opeParam.extensionPath;
        this.xbdPath = hdlFs_1.hdlPath.join(this.extensionPath, 'lib', 'bd', 'xilinx');
        this.schemaPath = global_1.opeParam.propertySchemaPath;
        this.schemaCont = hdlFs_1.hdlFile.readJSON(this.schemaPath);
        this.bdEnum = this.schemaCont.properties?.soc.properties.bd.enum;
        this.bdRepo = this.setting.get('digital-ide.prj.xilinx.BD.repo.path', '');
    }
    async overwrite(uri) {
        this.getConfig();
        // 获取当前bd file的路径
        const select = await vscode.window.showQuickPick(this.bdEnum);
        // the user canceled the select
        if (!select) {
            return;
        }
        let bdSrcPath = `${this.xbdPath}/${select}.bd`;
        if (!hdlFs_1.hdlFile.isFile(bdSrcPath)) {
            bdSrcPath = `${this.bdRepo}/${select}.bd`;
        }
        if (!hdlFs_1.hdlFile.isFile(bdSrcPath)) {
            vscode.window.showErrorMessage(`can not find ${select}.bd in ${this.xbdPath} and ${this.bdRepo}, please load again.`);
        }
        else {
            const docPath = hdlFs_1.hdlPath.toSlash(uri.fsPath);
            const doc = hdlFs_1.hdlFile.readFile(docPath);
            if (doc) {
                hdlFs_1.hdlFile.writeFile(bdSrcPath, doc);
            }
        }
    }
    add(uri) {
        this.getConfig();
        // 获取当前bd file的路径
        let docPath = hdlFs_1.hdlPath.toSlash(uri.fsPath);
        let bd_name = hdlFs_1.hdlPath.basename(docPath);
        // 检查是否重复
        if (this.bdEnum.includes(bd_name)) {
            vscode.window.showWarningMessage(`The file already exists.`);
            return null;
        }
        // 获取存放路径
        let storePath = this.setting.get('digital-ide.prj.xilinx.BD.repo.path', '');
        if (!fs.existsSync(storePath)) {
            vscode.window.showWarningMessage(`This bd file will be added into extension folder.We don't recommend doing this because it will be cleared in the next update.`);
            storePath = this.xbdPath;
        }
        // 写入
        const bd_path = `${storePath}/${bd_name}.bd`;
        const doc = hdlFs_1.hdlFile.readFile(docPath);
        if (doc) {
            hdlFs_1.hdlFile.writeFile(bd_path, doc);
        }
        this.schemaCont.properties.soc.properties.bd.enum.push(bd_name);
        hdlFs_1.hdlFile.writeJSON(this.schemaPath, this.schemaCont);
    }
    delete() {
        this.getConfig();
        vscode.window.showQuickPick(this.bdEnum).then(select => {
            // the user canceled the select
            if (!select) {
                return;
            }
            let bdSrcPath = `${this.xbdPath}/${select}.bd`;
            if (!hdlFs_1.hdlFile.isFile(bdSrcPath)) {
                bdSrcPath = `${this.bdRepo}/${select}.bd`;
            }
            if (!hdlFs_1.hdlFile.isFile(bdSrcPath)) {
                vscode.window.showErrorMessage(`can not find ${select}.bd in ${this.xbdPath} and ${this.bdRepo}, please load again.`);
            }
            else {
                hdlFs_1.hdlFile.removeFile(bdSrcPath);
            }
        });
    }
    load() {
        this.getConfig();
        if (hdlFs_1.hdlFile.isDir(this.bdRepo)) {
            for (const file of fs.readdirSync(this.bdRepo)) {
                if (file.endsWith('.bd')) {
                    let basename = hdlFs_1.hdlPath.basename(file);
                    if (this.bdEnum.includes(basename)) {
                        return;
                    }
                    this.schemaCont.properties.soc.properties.bd.enum.push(basename);
                }
            }
        }
        hdlFs_1.hdlFile.writeJSON(this.schemaPath, this.schemaCont);
    }
}
exports.XilinxBd = XilinxBd;
;
const tools = {
    async boot() {
        // 声明变量
        const bootInfo = {
            outsidePath: hdlFs_1.hdlPath.join(fspath.dirname(global_1.opeParam.prjStructure.prjPath), 'boot'),
            insidePath: hdlFs_1.hdlPath.join(global_1.opeParam.extensionPath, 'resources', 'boot', 'xilinx'),
            outputPath: hdlFs_1.hdlPath.join(global_1.opeParam.extensionPath, 'resources', 'boot', 'xilinx', 'output.bif'),
            elfPath: '',
            bitPath: '',
            fsblPath: ''
        };
        if (global_1.opeParam.prjInfo.INSIDE_BOOT_TYPE) {
            bootInfo.insidePath = hdlFs_1.hdlPath.join(bootInfo.insidePath, global_1.opeParam.prjInfo.INSIDE_BOOT_TYPE);
        }
        else {
            bootInfo.insidePath = hdlFs_1.hdlPath.join(bootInfo.insidePath, 'microphase');
        }
        let output_context = "//arch = zynq; split = false; format = BIN\n";
        output_context += "the_ROM_image:\n";
        output_context += "{\n";
        bootInfo.fsblPath = await this.getfsblPath(bootInfo.outsidePath, bootInfo.insidePath);
        if (!bootInfo.fsblPath) {
            return null;
        }
        output_context += bootInfo.fsblPath;
        bootInfo.bitPath = await this.getBitPath(global_1.opeParam.workspacePath);
        if (bootInfo.bitPath) {
            output_context += bootInfo.bitPath;
        }
        bootInfo.elfPath = await this.getElfPath(bootInfo);
        if (!bootInfo.elfPath) {
            return null;
        }
        output_context += bootInfo.elfPath;
        output_context += "}";
        let result = hdlFs_1.hdlFile.writeFile(bootInfo.outputPath, output_context);
        if (!result) {
            return null;
        }
        let command = `bootgen -arch zynq -image ${bootInfo.outputPath} -o ${global_1.opeParam.workspacePath}/BOOT.bin -w on`;
        (0, child_process_1.exec)(command, function (error, stdout, stderr) {
            if (error) {
                vscode.window.showErrorMessage(`${error}`);
                vscode.window.showErrorMessage(`stderr: ${stderr}`);
                return;
            }
            else {
                vscode.window.showInformationMessage("write boot file successfully!!");
            }
        });
    },
    async getfsblPath(outsidePath, insidePath) {
        const paths = hdlFs_1.hdlFile.pickFileRecursive(outsidePath, [], filePath => filePath.endsWith('fsbl.elf'));
        if (paths.length) {
            if (paths.length === 1) {
                return `\t[bootloader]${outsidePath}/${paths[0]}\n`;
            }
            let selection = await vscode.window.showQuickPick(paths);
            if (!selection) {
                return '';
            }
            return `\t[bootloader]${outsidePath}/${selection}\n`;
        }
        return `\t[bootloader]${insidePath}/fsbl.elf\n`;
    },
    async getBitPath(bitPath) {
        let bitList = hdlFs_1.hdlFile.pickFileRecursive(bitPath, [], filePath => filePath.endsWith('.bit'));
        if (bitList.length === 0) {
            vscode.window.showInformationMessage("Generated only from elf file");
        }
        else if (bitList.length === 1) {
            return "\t" + bitPath + bitList[0] + "\n";
        }
        else {
            let selection = await vscode.window.showQuickPick(bitList);
            if (!selection) {
                return '';
            }
            return "\t" + bitPath + selection + "\n";
        }
        return '';
    },
    async getElfPath(bootInfo) {
        // 优先在外层寻找elf文件
        let elfs = this.pickElfFile(bootInfo.outsidePath);
        if (elfs.length) {
            if (elfs.length === 1) {
                return `\t${bootInfo.outsidePath}/${elfs[0]}\n`;
            }
            let selection = await vscode.window.showQuickPick(elfs);
            if (!selection) {
                return '';
            }
            return `\t${bootInfo.outsidePath}/${selection}\n`;
        }
        // 如果外层找不到文件则从内部调用
        elfs = this.pickElfFile(bootInfo.insidePath);
        if (elfs.length) {
            if (elfs.length === 1) {
                return `\t${bootInfo.insidePath}/${elfs[0]}\n`;
            }
            let selection = await vscode.window.showQuickPick(elfs);
            if (!selection) {
                return '';
            }
            return `\t${bootInfo.insidePath}/${selection}\n`;
        }
        // 如果内层也没有则直接退出
        vscode.window.showErrorMessage("The elf file was not found\n");
        return '';
    },
    pickElfFile(path) {
        return hdlFs_1.hdlFile.pickFileRecursive(path, [], filePath => filePath.endsWith('.elf') && !filePath.endsWith('fsbl.elf'));
    }
};
exports.tools = tools;
//# sourceMappingURL=xilinx.js.map