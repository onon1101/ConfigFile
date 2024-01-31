"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolve = exports.toSlash = exports.PrjInfoDefaults = exports.PrjInfo = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
const fs = require("fs");
const fspath = require("path");
const enum_1 = require("./enum");
const assert = require("assert");
const hdlPath = require("../hdlFs/path");
const PrjInfoDefaults = {
    get toolChain() {
        return enum_1.ToolChainType.Xilinx;
    },
    get prjName() {
        return {
            PL: 'template',
            PS: 'template'
        };
    },
    get IP_REPO() {
        return [];
    },
    get soc() {
        return {
            core: '',
            bd: '',
            os: '',
            app: ''
        };
    },
    get enableShowLog() {
        return false;
    },
    get device() {
        return 'none';
    },
    get arch() {
        return {
            prjPath: '',
            hardware: {
                src: '',
                sim: '',
                data: ''
            },
            software: {
                src: '',
                data: ''
            }
        };
    },
    get library() {
        return {
            state: enum_1.LibraryState.Remote,
            hardware: {
                common: [],
                custom: []
            }
        };
    },
    get iverilogCompileOptions() {
        return {
            standard: "2012",
            includes: []
        };
    }
};
exports.PrjInfoDefaults = PrjInfoDefaults;
;
;
;
;
function toSlash(path) {
    return path.replace(/\\/g, "\/");
}
exports.toSlash = toSlash;
function resolve(...paths) {
    const absPath = fspath.resolve(...paths);
    return toSlash(absPath);
}
exports.resolve = resolve;
function join(...paths) {
    const joinedPath = fspath.join(...paths);
    return toSlash(joinedPath);
}
class PrjInfo {
    constructor() {
        this._extensionPath = '';
        this._workspacePath = '';
        // toolChain is the tool chain used in the project
        // which is supposed to support xilinx, intel, custom
        this._toolChain = PrjInfoDefaults.toolChain;
        // project name, include pl and ps
        this._prjName = PrjInfoDefaults.prjName;
        this._IP_REPO = PrjInfoDefaults.IP_REPO;
        this._soc = PrjInfoDefaults.soc;
        this._enableShowLog = PrjInfoDefaults.enableShowLog;
        this._device = PrjInfoDefaults.device;
        // structure of the project, including path of source of hardware design, testBench
        this._arch = PrjInfoDefaults.arch;
        // library to manage
        this._library = PrjInfoDefaults.library;
        // compile for iverilog
        this._iverilogCompileOptions = PrjInfoDefaults.iverilogCompileOptions;
    }
    get toolChain() {
        return this._toolChain;
    }
    get prjName() {
        return this._prjName;
    }
    get arch() {
        return this._arch;
    }
    get library() {
        return this._library;
    }
    get IP_REPO() {
        return this._IP_REPO;
    }
    get soc() {
        return this._soc;
    }
    get enableShowLog() {
        return this._enableShowLog;
    }
    get device() {
        return this._device;
    }
    get INSIDE_BOOT_TYPE() {
        return 'microphase';
    }
    get iverilogCompileOptions() {
        return this._iverilogCompileOptions;
    }
    /**
     * replace token like ${workspace} in path
     * @param path
     */
    replacePathToken(path) {
        const workspacePath = this._workspacePath;
        assert(workspacePath);
        this.setDefaultValue(this.prjName, 'PL', 'template');
        this.setDefaultValue(this.prjName, 'PS', 'template');
        const plname = this.prjName.PL;
        const psname = this.prjName.PS;
        // TODO : packaging the replacer
        return path.replace(/\$\{workspace\}/g, workspacePath)
            .replace(/\$\{plname\}/g, plname)
            .replace(/\$\{psname\}/g, psname);
    }
    /**
     * uniform a absolute path
     * @param path
     */
    uniformisePath(path) {
        const slashPath = toSlash(path);
        const replacedPath = this.replacePathToken(slashPath);
        return replacedPath;
    }
    /**
     * resolve path with workspacePath as root
     * @param path
     * @param check if true, check the existence of path
     * @param root root of path, root and path will be joined
     * @returns
     */
    resolvePath(path, check = false, root) {
        let uniformPath = '';
        if (fspath.isAbsolute(path)) {
            uniformPath = path;
        }
        else {
            const rootPath = root ? root : this._workspacePath;
            uniformPath = fspath.resolve(rootPath, path);
        }
        uniformPath = this.uniformisePath(uniformPath);
        if (check) {
            if (fs.existsSync(uniformPath)) {
                return uniformPath;
            }
            else {
                vscode.window.showErrorMessage('path ' + uniformPath + ' not exist!');
                return undefined;
            }
        }
        else {
            return uniformPath;
        }
    }
    updateToolChain(toolChain) {
        if (toolChain) {
            if (!(0, enum_1.validToolChainType)(toolChain)) {
                vscode.window.showErrorMessage('expect toolChain to be "xilinx", "intel", "custom"');
                return;
            }
            this._toolChain = toolChain;
        }
    }
    updatePathWisely(obj, attr, path, root, defaultPath = '') {
        if (path) {
            if (path instanceof Array) {
                const actualPaths = [];
                for (const p of path) {
                    const actualPath = this.resolvePath(p, true, root);
                    if (actualPath) {
                        actualPaths.push(actualPath);
                    }
                }
                obj[attr] = actualPaths;
            }
            else {
                const actualPath = this.resolvePath(path, true, root);
                if (actualPath) {
                    obj[attr] = actualPath;
                }
            }
        }
        else {
            obj[attr] = defaultPath;
        }
    }
    updatePrjName(prjName) {
        if (prjName) {
            if (prjName.PL) {
                this._prjName.PL = prjName.PL;
            }
            if (prjName.PS) {
                this._prjName.PS = prjName.PS;
            }
        }
    }
    updateIP_REPO(IP_REPO) {
        if (IP_REPO) {
            if (IP_REPO instanceof Array) {
                const invalidIPs = IP_REPO.filter(ip => !(0, enum_1.validXilinxIP)(ip));
                if (invalidIPs.length > 0) {
                    vscode.window.showErrorMessage('detect invalid IPs:' + invalidIPs);
                }
                else {
                    this._IP_REPO = IP_REPO;
                }
            }
            else {
                vscode.window.showErrorMessage('expect IP_REPO to be list');
            }
        }
    }
    updateSoc(soc) {
        if (soc) {
            if (soc.core) {
                this._soc.core = soc.core;
            }
            if (soc.bd) {
                this._soc.bd = soc.bd;
            }
            if (soc.os) {
                this._soc.os = soc.os;
            }
            if (soc.app) {
                this._soc.app = soc.app;
            }
        }
    }
    updateEnableShowLog(enableShowLog) {
        if (enableShowLog) {
            this._enableShowLog = enableShowLog;
        }
    }
    updateDevice(device) {
        if (device) {
            this._device = device;
        }
    }
    /**
     * assign defaultValue to obj[attr] if boolean of obj[attr] is false or 'none'
     * @param obj
     * @param attr
     * @param defaultValue
     */
    setDefaultValue(obj, attr, defaultValue) {
        const value = obj[attr];
        let isNull = !Boolean(value);
        if (typeof value === 'string') {
            isNull || (isNull = value === 'none');
        }
        if (isNull) {
            obj[attr] = defaultValue;
        }
    }
    checkDirExist(dir) {
        if (dir === '') {
            return;
        }
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
    updateArch(arch) {
        const workspacePath = this._workspacePath;
        if (arch) {
            this.updatePathWisely(this.arch, 'prjPath', arch.prjPath);
            if (arch.hardware) {
                this.updatePathWisely(this.arch.hardware, 'src', arch.hardware.src);
                this.updatePathWisely(this.arch.hardware, 'sim', arch.hardware.sim);
                this.updatePathWisely(this.arch.hardware, 'data', arch.hardware.data);
            }
            if (arch.software) {
                this.updatePathWisely(this.arch.software, 'src', arch.software.src);
                this.updatePathWisely(this.arch.software, 'data', arch.software.data);
            }
        }
        else {
            let hardwarePath = join(workspacePath, 'user');
            let softwarePath = join(workspacePath, 'user', 'Software');
            const socCore = this._soc.core;
            if (socCore && socCore !== 'none') {
                hardwarePath = join(hardwarePath, 'Hardware');
                this.arch.software.src = join(softwarePath, 'src');
                this.arch.software.data = join(softwarePath, 'data');
            }
            this.arch.prjPath = join(workspacePath, 'prj');
            this.arch.hardware.src = join(hardwarePath, 'src');
            this.arch.hardware.sim = join(hardwarePath, 'sim');
            this.arch.hardware.data = join(hardwarePath, 'data');
        }
        // if path is '', set as workspace
        this.setDefaultValue(this.arch.hardware, 'src', workspacePath);
        this.setDefaultValue(this.arch.hardware, 'sim', this.arch.hardware.src);
        this.setDefaultValue(this.arch.hardware, 'data', workspacePath);
        this.setDefaultValue(this.arch.software, 'src', workspacePath);
        this.setDefaultValue(this.arch.software, 'data', workspacePath);
        this.setDefaultValue(this.arch, 'prjPath', workspacePath);
    }
    checkArchDirExist() {
        this.checkDirExist(this.arch.hardware.sim);
        this.checkDirExist(this.arch.hardware.src);
        this.checkDirExist(this.arch.hardware.data);
        if (this.soc.core !== 'none') {
            this.checkDirExist(this.arch.software.src);
            this.checkDirExist(this.arch.software.data);
        }
        this.checkDirExist(this.arch.prjPath);
    }
    updateLibrary(library) {
        if (library) {
            if (library.state) {
                if (!(0, enum_1.validLibraryState)(library.state)) {
                    vscode.window.showErrorMessage('expect library.state to be "local", "remote"');
                    this._library.state = enum_1.LibraryState.Unknown;
                }
                else {
                    this._library.state = library.state;
                }
            }
            else {
                this._library.state = library.state;
            }
            if (library.hardware) {
                const commonPath = this.libCommonPath;
                const customPath = this.libCustomPath;
                this.library.hardware.common = library.hardware.common ? library.hardware.common : [];
                // this.updatePathWisely(this.library.hardware, 'common', library.hardware.common, commonPath, []);
                this.updatePathWisely(this.library.hardware, 'custom', library.hardware.custom, customPath, []);
            }
            else {
                this._library.hardware = library.hardware;
            }
        }
        else {
            this._library.hardware = PrjInfoDefaults.library.hardware;
            this._library.state = PrjInfoDefaults.library.state;
        }
    }
    updateIverilogCompileOptions(iverilogCompileOptions) {
        if (iverilogCompileOptions) {
            if (iverilogCompileOptions.standard) {
                this._iverilogCompileOptions.standard = iverilogCompileOptions.standard;
            }
            if (iverilogCompileOptions.includes && iverilogCompileOptions.includes instanceof Array) {
                this._iverilogCompileOptions.includes = [];
                for (const includePath of iverilogCompileOptions.includes) {
                    const realIncludePath = includePath.replace(/\$\{workspace\}/g, this._workspacePath);
                    this._iverilogCompileOptions.includes.push(realIncludePath);
                }
            }
        }
    }
    appendLibraryCommonPath(relPath) {
        this._library.hardware.common.push(relPath);
    }
    appendLibraryCustomPath(relPath) {
        this._library.hardware.custom.push(relPath);
    }
    getLibraryCommonPaths(absolute = true, state) {
        const targetState = state ? state : this._library.state;
        const localLibPath = hdlPath.join(this.hardwareSrcPath, 'lib');
        const remoteLibPath = this.libCommonPath;
        const targetLibPath = (targetState === enum_1.LibraryState.Local) ? localLibPath : remoteLibPath;
        const commonFolder = hdlPath.join(targetLibPath, 'Empty');
        if (absolute) {
            const absPaths = this._library.hardware.common.map(relPath => hdlPath.rel2abs(commonFolder, relPath));
            return absPaths;
        }
        return this._library.hardware.common;
    }
    getLibraryCustomPaths(absolute = true) {
        const libCustomPath = this.libCustomPath;
        if (libCustomPath === '') {
            return [];
        }
        if (absolute) {
            const configFolder = hdlPath.join(libCustomPath, 'Empty');
            return this._library.hardware.custom.map(relPath => hdlPath.rel2abs(configFolder, relPath));
        }
        return this._library.hardware.custom;
    }
    /**
     * merge the input uncomplete prjInfo into this
     * cover the value that exist in rawPrjInfo recursively
     * reserve the value that not covered in rawPrjInfo
     * @param rawPrjInfo
     */
    merge(rawPrjInfo) {
        this.updateToolChain(rawPrjInfo.toolChain);
        this.updatePrjName(rawPrjInfo.prjName);
        this.updateIP_REPO(rawPrjInfo.IP_REPO);
        this.updateSoc(rawPrjInfo.soc);
        this.updateEnableShowLog(rawPrjInfo.enableShowLog);
        this.updateDevice(rawPrjInfo.device);
        this.updateArch(rawPrjInfo.arch);
        this.updateLibrary(rawPrjInfo.library);
        this.updateIverilogCompileOptions(rawPrjInfo.iverilogCompileOptions);
    }
    /**
     * config init path in prjInfo
     * @param extensionPath
     * @param workspacePath
     */
    initContextPath(extensionPath, workspacePath) {
        this._extensionPath = toSlash(extensionPath);
        this._workspacePath = toSlash(workspacePath);
    }
    get libCommonPath() {
        const libPath = join(this._extensionPath, 'lib', 'common');
        if (!fs.existsSync(libPath)) {
            vscode.window.showErrorMessage('common lib path: "' + libPath + '"  in extension is invalid, maybe extension has been corrupted, reinstall the extension');
        }
        return libPath;
    }
    get libCustomPath() {
        const libPath = vscode.workspace.getConfiguration().get('digital-ide.prj.lib.custom.path', this._workspacePath);
        if (!fs.existsSync(libPath)) {
            return '';
        }
        return libPath;
    }
    get hardwareSimPath() {
        const simPath = this._arch.hardware.sim;
        const workspace = this._workspacePath;
        if (fspath.isAbsolute(simPath)) {
            return simPath;
        }
        else if (simPath === '') {
            return workspace;
        }
        return hdlPath.join(workspace, simPath);
    }
    get hardwareSrcPath() {
        const srcPath = this._arch.hardware.src;
        const workspace = this._workspacePath;
        if (fspath.isAbsolute(srcPath)) {
            return srcPath;
        }
        else if (srcPath === '') {
            return workspace;
        }
        console.log(hdlPath.join(workspace, srcPath));
        return hdlPath.join(workspace, srcPath);
    }
    json() {
        return {
            toolChain: this._toolChain,
            prjName: this._prjName,
            IP_REPO: this._IP_REPO,
            soc: this._soc,
            enableShowLog: this._enableShowLog,
            device: this._device,
            arch: this._arch,
            library: this._library,
        };
    }
}
exports.PrjInfo = PrjInfo;
;
//# sourceMappingURL=prjInfo.js.map