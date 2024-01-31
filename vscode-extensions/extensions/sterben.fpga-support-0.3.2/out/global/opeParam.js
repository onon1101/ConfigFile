"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpeParamDefaults = exports.opeParam = void 0;
const assert = require("assert");
const fs = require("fs");
const prjInfo_1 = require("./prjInfo");
// eslint-disable-next-line @typescript-eslint/naming-convention
const OpeParamDefaults = {
    os: '',
    extensionPath: '',
    workspacePath: '',
    prjInfo: new prjInfo_1.PrjInfo(),
    propertyJsonPath: '',
    propertySchemaPath: '',
    propertyInitPath: '',
    topModule: { name: '', path: '' }
};
exports.OpeParamDefaults = OpeParamDefaults;
;
function readJSON(path) {
    try {
        const context = fs.readFileSync(path, 'utf-8');
        return JSON.parse(context);
    }
    catch (err) {
        console.log('fail to read JSON: ', err);
    }
    return {};
}
class OpeParam {
    constructor() {
        this._os = OpeParamDefaults.os;
        this._extensionPath = OpeParamDefaults.extensionPath;
        this._workspacePath = OpeParamDefaults.workspacePath;
        // information of the whole project
        this._prjInfo = OpeParamDefaults.prjInfo;
        // path of property.json
        this._propertyJsonPath = OpeParamDefaults.propertyJsonPath;
        // path of property-schema.json
        this._propertySchemaPath = OpeParamDefaults.propertySchemaPath;
        // path of property-init.json
        this._propertyInitPath = OpeParamDefaults.propertyInitPath;
        this._firstSrcTopModule = OpeParamDefaults.topModule;
        this._firstSimTopModule = OpeParamDefaults.topModule;
    }
    get os() {
        return this._os;
    }
    get extensionPath() {
        return this._extensionPath;
    }
    get workspacePath() {
        return this._workspacePath;
    }
    get prjInfo() {
        return this._prjInfo;
    }
    /**
     * path of property.json
     */
    get propertyJsonPath() {
        return this._propertyJsonPath;
    }
    /**
     * path of property-schema.json
     */
    get propertySchemaPath() {
        return this._propertySchemaPath;
    }
    /**
     * path of property-init.json
     */
    get propertyInitPath() {
        return this._propertyInitPath;
    }
    get firstSrcTopModule() {
        return this._firstSrcTopModule;
    }
    get firstSimTopModule() {
        return this._firstSimTopModule;
    }
    get prjStructure() {
        return this._prjInfo.arch;
    }
    setBasicInfo(os, extensionPath, workspacePath, propertyJsonPath, propertySchemaPath, propertyInitPath) {
        this._os = os;
        assert(fs.existsSync(extensionPath), 'extensionPath ' + extensionPath + ' not exist!');
        assert(fs.existsSync(workspacePath), 'workspacePath ' + workspacePath + ' not exist!');
        assert(fs.existsSync(propertySchemaPath), 'propertySchemaPath ' + propertySchemaPath + ' not exist!');
        assert(fs.existsSync(propertyInitPath), 'propertyInitPath ' + propertyInitPath + ' not exist!');
        this._extensionPath = extensionPath;
        this._workspacePath = workspacePath;
        this._propertyJsonPath = propertyJsonPath;
        this._propertySchemaPath = propertySchemaPath;
        this._propertyInitPath = propertyInitPath;
    }
    setFirstSrcTopModule(name, path) {
        if (name) {
            this._firstSrcTopModule.name = name;
        }
        if (path) {
            this._firstSrcTopModule.path = path;
        }
    }
    setFirstSimTopModule(name, path) {
        if (name) {
            this._firstSimTopModule.name = name;
        }
        if (path) {
            this._firstSimTopModule.path = path;
        }
    }
    mergePrjInfo(rawPrjInfo) {
        this.prjInfo.merge(rawPrjInfo);
    }
    /**
     * return the absolute path based on workspacePath
     * @param relPath
     */
    resolvePathWorkspace(relPath) {
        return (0, prjInfo_1.resolve)(this._workspacePath, relPath);
    }
    /**
     * return the absolute path based on extensionPath
     * @param relPath
     */
    resolvePathExtension(relPath) {
        return (0, prjInfo_1.resolve)(this._extensionPath, relPath);
    }
    /**
     * get User's property.json
     */
    getUserPrjInfo() {
        const userPrjInfo = new prjInfo_1.PrjInfo();
        userPrjInfo.initContextPath(this.extensionPath, this.workspacePath);
        const rawPrjInfo = this.getRawUserPrjInfo();
        userPrjInfo.merge(rawPrjInfo);
        return userPrjInfo;
    }
    /**
     * get content from property.json (disk IO)
     * @returns
     */
    getRawUserPrjInfo() {
        const propertyJsonPath = this.propertyJsonPath;
        if (fs.existsSync(propertyJsonPath)) {
            const rawPrjInfo = readJSON(propertyJsonPath);
            return rawPrjInfo;
        }
        else {
            // use default config instead
            const rawPrjInfo = readJSON(this.propertyInitPath);
            return rawPrjInfo;
        }
    }
}
;
const opeParam = new OpeParam();
exports.opeParam = opeParam;
//# sourceMappingURL=opeParam.js.map