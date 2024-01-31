"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hdlFile = exports.HdlInstance = exports.HdlModule = exports.hdlParam = void 0;
const vscode = require("vscode");
const global_1 = require("../global");
const enum_1 = require("../global/enum");
const outputChannel_1 = require("../global/outputChannel");
const common = require("./common");
const hdlFs_1 = require("../hdlFs");
Object.defineProperty(exports, "hdlFile", { enumerable: true, get: function () { return hdlFs_1.hdlFile; } });
const util_1 = require("./util");
class HdlParam {
    constructor() {
        this.topModules = new Set();
        this.srcTopModules = new Set();
        this.simTopModules = new Set();
        this.pathToHdlFiles = new Map();
        this.modules = new Set();
        this.unhandleInstances = new Set();
    }
    hasHdlFile(path) {
        const moduleFile = this.getHdlFile(path);
        if (!moduleFile) {
            return false;
        }
        return true;
    }
    getHdlFile(path) {
        return this.pathToHdlFiles.get(path);
    }
    getAllHdlFiles() {
        const hdlFiles = [];
        for (const [_, hdlFile] of this.pathToHdlFiles) {
            hdlFiles.push(hdlFile);
        }
        return hdlFiles;
    }
    /**
     * used only in initialization stage
     * @param hdlFile
     */
    setHdlFile(hdlFile) {
        const path = hdlFile.path;
        this.pathToHdlFiles.set(path, hdlFile);
    }
    /**
     * add a file by path and create context
     * @param path absolute path of the file to be added
     */
    async addHdlPath(path) {
        path = hdlFs_1.hdlPath.toSlash(path);
        await this.initHdlFiles([path]);
        const hdlFile = this.getHdlFile(path);
        if (!hdlFile) {
            outputChannel_1.MainOutput.report('error happen when we attempt to add file by path: ' + path, outputChannel_1.ReportType.Error);
        }
        else {
            hdlFile.makeInstance();
            // when a new file is added, retry the solution of dependency
            for (const hdlModule of hdlFile.getAllHdlModules()) {
                hdlModule.solveUnhandleInstance();
            }
        }
    }
    hasHdlModule(path, name) {
        if (!path) {
            return false;
        }
        const hdlFile = this.getHdlFile(path);
        if (!hdlFile) {
            return false;
        }
        const hdlModule = hdlFile.getHdlModule(name);
        if (!hdlModule) {
            return false;
        }
        return true;
    }
    getHdlModule(path, name) {
        const hdlFile = this.getHdlFile(path);
        if (!hdlFile) {
            return undefined;
        }
        return hdlFile.getHdlModule(name);
    }
    getAllHdlModules() {
        const hdlModules = [];
        this.modules.forEach(m => hdlModules.push(m));
        return hdlModules;
    }
    addHdlModule(hdlModule) {
        this.modules.add(hdlModule);
    }
    addTopModule(hdlModule) {
        this.topModules.add(hdlModule);
    }
    deleteTopModule(hdlModule) {
        this.topModules.delete(hdlModule);
    }
    getAllTopModules(global = false) {
        const topModules = [];
        if (global) {
            this.topModules.forEach(m => topModules.push(m));
        }
        else {
            this.srcTopModules.forEach(m => topModules.push(m));
            this.simTopModules.forEach(m => topModules.push(m));
        }
        return topModules;
    }
    isTopModule(path, name, global = false) {
        const module = this.getHdlModule(path, name);
        if (!module) {
            return false;
        }
        if (global) {
            return this.topModules.has(module);
        }
        else {
            const sourceTopModule = this.selectTopModuleSourceByFileType(module);
            return sourceTopModule.has(module);
        }
    }
    selectTopModuleSourceByFileType(hdlModule) {
        switch (hdlModule.file.type) {
            case common.HdlFileType.Src: return this.srcTopModules;
            case common.HdlFileType.Sim: return this.simTopModules;
            case common.HdlFileType.LocalLib: return this.srcTopModules;
            case common.HdlFileType.RemoteLib: return this.srcTopModules;
            default: return this.srcTopModules;
        }
    }
    /**
     * add module to top modules of a certain source (sim or src)
     * @param hdlModule
     */
    addTopModuleToSource(hdlModule) {
        const topModuleSource = this.selectTopModuleSourceByFileType(hdlModule);
        topModuleSource.add(hdlModule);
    }
    deleteTopModuleToSource(hdlModule) {
        const topModuleSource = this.selectTopModuleSourceByFileType(hdlModule);
        topModuleSource.delete(hdlModule);
    }
    getAllDependences(path, name) {
        const module = this.getHdlModule(path, name);
        if (!module) {
            return undefined;
        }
        const dependencies = {
            current: [],
            include: [],
            others: []
        };
        for (const inst of module.getAllInstances()) {
            if (!inst.module) {
                continue;
            }
            const status = inst.instModPathStatus;
            if (status === common.InstModPathStatus.Current && inst.instModPath) {
                dependencies.current.push(inst.instModPath);
            }
            else if (status === common.InstModPathStatus.Include && inst.instModPath) {
                dependencies.include.push(inst.instModPath);
            }
            else if (status === common.InstModPathStatus.Others && inst.instModPath) {
                dependencies.others.push(inst.instModPath);
            }
            const instDependencies = this.getAllDependences(inst.module.path, inst.module.name);
            if (instDependencies) {
                dependencies.current.push(...instDependencies.current);
                dependencies.include.push(...instDependencies.include);
                dependencies.others.push(...instDependencies.others);
            }
        }
        return dependencies;
    }
    getUnhandleInstanceNumber() {
        return this.unhandleInstances.size;
    }
    getUnhandleInstanceByType(typeName) {
        for (const inst of this.unhandleInstances) {
            if (inst.type === typeName) {
                return inst;
            }
        }
        return undefined;
    }
    addUnhandleInstance(inst) {
        this.unhandleInstances.add(inst);
    }
    deleteUnhandleInstance(inst) {
        this.unhandleInstances.delete(inst);
    }
    /**
     * vlog -> HdlLangID.Verilog
     * svlog -> HdlLangID.SystemVerilog
     * vhdl -> HdlLangID.Vhdl
     * @param langID
     */
    alignLanguageId(langID) {
        switch (langID) {
            case 'vhdl': return enum_1.HdlLangID.Vhdl;
            case 'vlog': return enum_1.HdlLangID.Verilog;
            case 'svlog': return enum_1.HdlLangID.SystemVerilog;
            default: return enum_1.HdlLangID.Unknown;
        }
    }
    async doHdlFast(path) {
        try {
            const fast = await util_1.HdlSymbol.fast(path);
            if (fast) {
                const languageId = this.alignLanguageId(fast.languageId);
                new HdlFile(path, languageId, fast.macro, fast.content);
            }
        }
        catch (error) {
            outputChannel_1.MainOutput.report('Error happen when parse ' + path, outputChannel_1.ReportType.Error);
            outputChannel_1.MainOutput.report('Reason: ' + error, outputChannel_1.ReportType.Error);
        }
    }
    async initHdlFiles(hdlFiles) {
        for (const path of hdlFiles) {
            await this.doHdlFast(path);
        }
    }
    async initialize(hdlFiles) {
        await this.initHdlFiles(hdlFiles);
        for (const hdlFile of this.getAllHdlFiles()) {
            hdlFile.makeInstance();
        }
    }
    getTopModulesByType(type) {
        const hardware = global_1.opeParam.prjInfo.arch.hardware;
        if (hardware.sim === hardware.src) {
            return this.getAllTopModules();
        }
        switch (type) {
            case common.HdlFileType.Src: return this.getSrcTopModules();
            case common.HdlFileType.Sim: return this.getSimTopModules();
            default: return [];
        }
    }
    getSrcTopModules() {
        const srcTopModules = this.srcTopModules;
        if (!srcTopModules) {
            return [];
        }
        const moduleFiles = [];
        for (const module of srcTopModules) {
            moduleFiles.push(module);
        }
        return moduleFiles;
    }
    getSimTopModules() {
        const simTopModules = this.simTopModules;
        if (!simTopModules) {
            return [];
        }
        const moduleFiles = [];
        for (const module of simTopModules) {
            moduleFiles.push(module);
        }
        return moduleFiles;
    }
    deleteHdlFile(path) {
        path = hdlFs_1.hdlPath.toSlash(path);
        const moduleFile = this.getHdlFile(path);
        if (moduleFile) {
            for (const name of moduleFile.getAllModuleNames()) {
                moduleFile.deleteHdlModule(name);
            }
            this.pathToHdlFiles.delete(path);
        }
    }
    async addHdlFile(path) {
        path = hdlFs_1.hdlPath.toSlash(path);
        await this.initHdlFiles([path]);
        const moduleFile = this.getHdlFile(path);
        if (!moduleFile) {
            outputChannel_1.MainOutput.report('error happen when create moduleFile ' + path, outputChannel_1.ReportType.Warn);
        }
        else {
            moduleFile.makeInstance();
            for (const module of moduleFile.getAllHdlModules()) {
                module.solveUnhandleInstance();
            }
        }
    }
}
;
const hdlParam = new HdlParam();
exports.hdlParam = hdlParam;
class HdlInstance {
    constructor(name, type, instModPath, instModPathStatus, instparams, instports, range, parentMod) {
        this.name = name;
        this.type = type;
        this.parentMod = parentMod;
        this.instparams = instparams;
        this.instports = instports;
        this.instModPath = instModPath;
        this.instModPathStatus = instModPathStatus;
        this.range = range;
        this.module = undefined;
        // solve dependency
        this.locateHdlModule();
    }
    locateHdlModule() {
        const instModPath = this.instModPath;
        const instModName = this.type;
        if (instModPath) {
            this.module = hdlParam.getHdlModule(instModPath, instModName);
            // add refer for module 
            this.module?.addGlobalReferedInstance(this);
            // if module and parent module share the same source (e.g both in src folder)
            if (this.isSameSource()) {
                this.module?.addLocalReferedInstance(this);
            }
        }
    }
    /**
     * judge if the instance is a cross source reference
     * e.g. this.module is from src, this.parentMod is from sim, then
     * isSameSource will return false, meaning that the instance is a cross source reference
     *
     * a cross source reference won't affect the top module reference of this.module,
     * meaning that a top module in one source can have its instance in other source
     */
    isSameSource() {
        const parentMod = this.parentMod;
        const instMod = this.module;
        if (instMod) {
            return parentMod.file.type === instMod.file.type;
        }
        return false;
    }
    /**
     * @description update Instance of each time
     * @param newInstance
     */
    update(newInstance) {
        this.type = newInstance.type;
        this.range = newInstance.range;
        this.instparams = newInstance.instparams;
        this.instports = newInstance.instports;
        this.instModPath = this.parentMod.path;
        this.instModPathStatus = this.parentMod.solveInstModPathStatus();
    }
}
exports.HdlInstance = HdlInstance;
;
class HdlModule {
    constructor(file, name, range, params, ports, instances) {
        this.file = file;
        this.name = name;
        this.range = range;
        this.params = params ? params : [];
        this.ports = ports ? ports : [];
        this.rawInstances = instances;
        this.nameToInstances = new Map();
        // add in hdlParam data structure
        // default both top module in top module and local top module (sim/src)
        hdlParam.addTopModule(this);
        hdlParam.addTopModuleToSource(this);
        hdlParam.addHdlModule(this);
        // log reference (its instance)
        // represents all the instance from this
        this.globalRefers = new Set();
        // represents all the instance from this created in the same scope
        // scope: src or sim (lib belongs to src)
        // localRefers subset to refers
        this.localRefers = new Set();
        // make unhandleInstances
        this.unhandleInstances = new Set();
    }
    get path() {
        return this.file.path;
    }
    get languageId() {
        return this.file.languageId;
    }
    getInstance(name) {
        return this.nameToInstances.get(name);
    }
    getAllInstances() {
        const hdlInstances = [];
        for (const inst of this.nameToInstances.values()) {
            hdlInstances.push(inst);
        }
        return hdlInstances;
    }
    getInstanceNum() {
        return this.nameToInstances.size;
    }
    createHdlInstance(rawHdlInstance) {
        const instModName = rawHdlInstance.type;
        if (this.languageId === enum_1.HdlLangID.Verilog || this.languageId === enum_1.HdlLangID.SystemVerilog) {
            const searchResult = this.searchInstModPath(instModName);
            const hdlInstance = new HdlInstance(rawHdlInstance.name, rawHdlInstance.type, searchResult.path, searchResult.status, rawHdlInstance.instparams, rawHdlInstance.instports, rawHdlInstance.range, this);
            if (!searchResult.path) {
                hdlParam.addUnhandleInstance(hdlInstance);
                this.addUnhandleInstance(hdlInstance);
            }
            if (this.nameToInstances) {
                this.nameToInstances.set(rawHdlInstance.name, hdlInstance);
            }
            return hdlInstance;
        }
        else if (this.languageId === enum_1.HdlLangID.Vhdl) {
            const hdlInstance = new HdlInstance(rawHdlInstance.name, rawHdlInstance.type, this.path, common.InstModPathStatus.Current, rawHdlInstance.instparams, this.ports[0].range, rawHdlInstance.range, this);
            hdlInstance.module = this;
            if (this.nameToInstances) {
                this.nameToInstances.set(rawHdlInstance.name, hdlInstance);
            }
            return hdlInstance;
        }
        else {
            vscode.window.showErrorMessage(`Unknown Language :${this.languageId} exist in our core program`);
            const hdlInstance = new HdlInstance(rawHdlInstance.name, rawHdlInstance.type, this.path, common.InstModPathStatus.Unknown, rawHdlInstance.instparams, this.ports[0].range, rawHdlInstance.range, this);
            return hdlInstance;
        }
    }
    makeNameToInstances() {
        if (this.rawInstances !== undefined) {
            this.nameToInstances.clear();
            for (const inst of this.rawInstances) {
                this.createHdlInstance(inst);
            }
            // this.rawInstances = undefined;
        }
        else {
            outputChannel_1.MainOutput.report('call makeNameToInstances but this.rawInstances is undefined', outputChannel_1.ReportType.Warn);
        }
    }
    deleteInstanceByName(name) {
        const inst = this.getInstance(name);
        this.deleteInstance(inst);
    }
    deleteInstance(inst) {
        if (inst) {
            this.deleteUnhandleInstance(inst);
            hdlParam.deleteUnhandleInstance(inst);
            if (this.nameToInstances) {
                this.nameToInstances.delete(inst.name);
            }
            // delete reference from instance's instMod
            const instMod = inst.module;
            if (instMod) {
                instMod.deleteGlobalReferedInstance(inst);
                if (inst.isSameSource()) {
                    instMod.deleteLocalReferedInstance(inst);
                }
            }
        }
    }
    searchInstModPath(instModName) {
        // search path of instance
        // priority:  "current file" -> "included files" -> "other hdls in the project"
        // prepare for "other hdls in the project"
        const excludeFile = new Set([this.file]);
        // search all the modules in the current file
        for (const name of this.file.getAllModuleNames()) {
            if (instModName === name) {
                return { path: this.path, status: common.InstModPathStatus.Current };
            }
        }
        // search included file
        for (const include of this.file.macro.includes) {
            const absIncludePath = hdlFs_1.hdlPath.rel2abs(this.path, include.path);
            const includeFile = hdlParam.getHdlFile(absIncludePath);
            if (includeFile) {
                excludeFile.add(includeFile);
                if (includeFile.hasHdlModule(instModName)) {
                    return { path: includeFile.path, status: common.InstModPathStatus.Include };
                }
            }
        }
        // search other files in the project
        for (const hdlFile of hdlParam.getAllHdlFiles()) {
            if (!excludeFile.has(hdlFile) && hdlFile.hasHdlModule(instModName)) {
                return { path: hdlFile.path, status: common.InstModPathStatus.Others };
            }
        }
        return { path: '', status: common.InstModPathStatus.Unknown };
    }
    addUnhandleInstance(inst) {
        this.unhandleInstances.add(inst);
    }
    deleteUnhandleInstance(inst) {
        this.unhandleInstances.delete(inst);
    }
    getAllGlobalRefers() {
        return this.globalRefers;
    }
    getAllLocalRefers() {
        return this.localRefers;
    }
    addGlobalReferedInstance(inst) {
        const globalRefers = this.globalRefers;
        globalRefers.add(inst);
        // it is refered in global scope, so delete this from top module
        if (globalRefers.size > 0) {
            hdlParam.deleteTopModule(this);
        }
    }
    deleteGlobalReferedInstance(inst) {
        const globalRefers = this.globalRefers;
        globalRefers.delete(inst);
        if (globalRefers.size === 0) {
            hdlParam.addTopModule(this);
        }
    }
    addLocalReferedInstance(inst) {
        const localRefers = this.localRefers;
        localRefers.add(inst);
        // it is refered in local scope, so delete this from top module
        if (localRefers.size > 0) {
            hdlParam.deleteTopModuleToSource(this);
        }
    }
    deleteLocalReferedInstance(inst) {
        const localRefers = this.localRefers;
        localRefers.delete(inst);
        if (localRefers.size === 0) {
            hdlParam.addTopModuleToSource(this);
        }
    }
    solveInstModPathStatus() {
        const inst = hdlParam.getUnhandleInstanceByType(this.name);
        if (!inst) {
            return common.InstModPathStatus.Unknown;
        }
        const userModule = inst.parentMod;
        if (userModule.path === this.path) {
            return common.InstModPathStatus.Current;
        }
        else {
            const userIncludePaths = userModule.file.macro.includes.map(include => hdlFs_1.hdlPath.rel2abs(userModule.path, include.path));
            if (userIncludePaths.includes(this.path)) {
                return common.InstModPathStatus.Include;
            }
            else {
                return common.InstModPathStatus.Others;
            }
        }
    }
    solveUnhandleInstance() {
        const inst = hdlParam.getUnhandleInstanceByType(this.name);
        if (inst) {
            const userModule = inst.parentMod;
            // match a inst with the same type name of the module
            // remove from unhandle list
            hdlParam.deleteUnhandleInstance(inst);
            userModule.deleteUnhandleInstance(inst);
            // assign instModPath
            inst.instModPath = this.path;
            // judge the type of instModPathStatus
            inst.instModPathStatus = this.solveInstModPathStatus();
            // assign module in the instance
            inst.locateHdlModule();
        }
    }
    update(newModule) {
        this.ports = newModule.ports;
        this.params = newModule.params;
        this.range = newModule.range;
        // compare and make change to instance
        const uncheckedInstanceNames = new Set();
        for (const inst of this.getAllInstances()) {
            uncheckedInstanceNames.add(inst.name);
        }
        for (const newInst of newModule.instances) {
            if (uncheckedInstanceNames.has(newInst.name)) {
                // match exist instance, compare and update
                const originalInstance = this.getInstance(newInst.name);
                originalInstance?.update(newInst);
                uncheckedInstanceNames.delete(newInst.name);
            }
            else {
                // unknown instance, create it
                this.createHdlInstance(newInst);
            }
        }
        // delete Instance that not visited
        for (const instName of uncheckedInstanceNames) {
            this.deleteInstanceByName(instName);
        }
    }
}
exports.HdlModule = HdlModule;
;
class HdlFile {
    constructor(path, languageId, macro, modules) {
        this.path = path;
        this.languageId = languageId;
        this.macro = macro;
        this.type = hdlFs_1.hdlFile.getHdlFileType(path);
        // add to global hdlParam
        hdlParam.setHdlFile(this);
        // make nameToModule
        this.nameToModule = new Map();
        for (const rawHdlModule of modules) {
            this.createHdlModule(rawHdlModule);
        }
    }
    createHdlModule(rawHdlModule) {
        const module = new HdlModule(this, rawHdlModule.name, rawHdlModule.range, rawHdlModule.params, rawHdlModule.ports, rawHdlModule.instances);
        this.nameToModule.set(rawHdlModule.name, module);
        return module;
    }
    hasHdlModule(name) {
        return this.nameToModule.has(name);
    }
    getHdlModule(name) {
        return this.nameToModule.get(name);
    }
    getAllModuleNames() {
        const names = [];
        for (const [name, _] of this.nameToModule) {
            names.push(name);
        }
        return names;
    }
    getAllHdlModules() {
        const hdlModules = [];
        for (const hdlModule of this.nameToModule.values()) {
            hdlModules.push(hdlModule);
        }
        return hdlModules;
    }
    deleteHdlModule(name) {
        const hdlModule = this.getHdlModule(name);
        if (hdlModule) {
            // delete child reference in the module which use this
            for (const childInst of hdlModule.getAllGlobalRefers()) {
                const userModule = childInst.parentMod;
                childInst.module = undefined;
                childInst.instModPath = undefined;
                childInst.instModPathStatus = common.InstModPathStatus.Unknown;
                hdlParam.addUnhandleInstance(childInst);
                userModule.addUnhandleInstance(childInst);
            }
            // delete all the instance in the module
            for (const inst of hdlModule.getAllInstances()) {
                hdlModule.deleteInstance(inst);
            }
            // delete any variables containing module
            hdlParam.deleteTopModule(hdlModule);
            hdlParam.deleteTopModuleToSource(hdlModule);
            hdlParam.modules.delete(hdlModule);
            this.nameToModule.delete(hdlModule.name);
        }
    }
    makeInstance() {
        for (const module of this.getAllHdlModules()) {
            module.makeNameToInstances();
        }
    }
    updateMacro(macro) {
        this.macro = macro;
    }
}
//# sourceMappingURL=core.js.map