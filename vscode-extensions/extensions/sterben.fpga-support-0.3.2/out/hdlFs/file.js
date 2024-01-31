"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walk = exports.moveFile = exports.removeFile = exports.copyFile = exports.isHasValue = exports.isHasAttr = exports.pickFileRecursive = exports.getHdlFileType = exports.rmSync = exports.writeJSON = exports.readJSON = exports.writeFile = exports.readFile = exports.getLanguageId = exports.getHDLFiles = exports.isHDLFile = exports.isSystemVerilogFile = exports.isVhdlFile = exports.isVerilogFile = exports.isDir = exports.isFile = void 0;
const fs = require("fs");
const fspath = require("path");
const enum_1 = require("../global/enum");
const lang_1 = require("../global/lang");
const hdlPath = require("./path");
const common_1 = require("../hdlParser/common");
const global_1 = require("../global");
/**
 * judge if the path represent a file
 * @param path
 * @returns
 */
function isFile(path) {
    if (!fs.existsSync(path)) {
        return false;
    }
    const state = fs.statSync(path);
    if (state.isDirectory()) {
        return false;
    }
    return true;
}
exports.isFile = isFile;
/**
 * judge if the path represent a Dir
 * @param path
 * @returns
 */
function isDir(path) {
    if (!fs.existsSync(path)) {
        return false;
    }
    const state = fs.statSync(path);
    if (state.isDirectory()) {
        return true;
    }
    return false;
}
exports.isDir = isDir;
function isVerilogFile(path) {
    if (!isFile(path)) {
        return false;
    }
    const ext = hdlPath.extname(path, false);
    return lang_1.verilogExts.includes(ext);
}
exports.isVerilogFile = isVerilogFile;
function isVhdlFile(path) {
    if (!isFile(path)) {
        return false;
    }
    const ext = hdlPath.extname(path, false);
    return lang_1.vhdlExts.includes(ext);
}
exports.isVhdlFile = isVhdlFile;
function isSystemVerilogFile(path) {
    if (!isFile(path)) {
        return false;
    }
    const ext = hdlPath.extname(path, false);
    return lang_1.systemVerilogExts.includes(ext);
}
exports.isSystemVerilogFile = isSystemVerilogFile;
function isHDLFile(path) {
    if (!isFile(path)) {
        return false;
    }
    const ext = hdlPath.extname(path, false);
    return lang_1.hdlExts.includes(ext);
}
exports.isHDLFile = isHDLFile;
function getHDLFiles(path, ignores) {
    return pickFileRecursive(path, ignores, filePath => isHDLFile(filePath));
}
exports.getHDLFiles = getHDLFiles;
function pickFileRecursive(path, ignores, condition) {
    if ((path instanceof Array) ||
        (path instanceof Set)) {
        const hdlFiles = [];
        path.forEach(p => hdlFiles.push(...pickFileRecursive(p, ignores, condition)));
        return hdlFiles;
    }
    if (isDir(path)) {
        // return if ignore have path
        if (ignores?.includes(path)) {
            return [];
        }
        const hdlFiles = [];
        for (const file of fs.readdirSync(path)) {
            const filePath = hdlPath.join(path, file);
            if (isDir(filePath)) {
                const subHdlFiles = pickFileRecursive(filePath, ignores, condition);
                if (subHdlFiles.length > 0) {
                    hdlFiles.push(...subHdlFiles);
                }
            }
            else if (!condition || condition(filePath)) {
                hdlFiles.push(filePath);
            }
        }
        return hdlFiles;
    }
    else if (!condition || condition(path)) {
        return [path];
    }
    else {
        return [];
    }
}
exports.pickFileRecursive = pickFileRecursive;
/**
 * get language id of a file
 * @param path
 * @returns
 */
function getLanguageId(path) {
    if (!isFile(path)) {
        return enum_1.HdlLangID.Unknown;
    }
    const ext = hdlPath.extname(path, false);
    if (lang_1.verilogExts.includes(ext)) {
        return enum_1.HdlLangID.Verilog;
    }
    else if (lang_1.vhdlExts.includes(ext)) {
        return enum_1.HdlLangID.Vhdl;
    }
    else if (lang_1.systemVerilogExts.includes(ext)) {
        return enum_1.HdlLangID.SystemVerilog;
    }
    else {
        return enum_1.HdlLangID.Unknown;
    }
}
exports.getLanguageId = getLanguageId;
function getHdlFileType(path) {
    const uniformPath = hdlPath.toSlash(path);
    const arch = global_1.opeParam.prjInfo.arch;
    const srcPath = arch.hardware.src;
    const simPath = arch.hardware.sim;
    const wsPath = global_1.opeParam.workspacePath;
    if (uniformPath.includes(srcPath)) {
        return common_1.HdlFileType.Src;
    }
    else if (uniformPath.includes(simPath)) {
        return common_1.HdlFileType.Sim;
    }
    else if (uniformPath.includes(wsPath)) {
        return common_1.HdlFileType.LocalLib;
    }
    else {
        return common_1.HdlFileType.RemoteLib;
    }
}
exports.getHdlFileType = getHdlFileType;
function readFile(path) {
    try {
        const content = fs.readFileSync(path, 'utf-8');
        return content;
    }
    catch (error) {
        console.log(error);
        return undefined;
    }
}
exports.readFile = readFile;
function writeFile(path, content) {
    try {
        const parent = fspath.dirname(path);
        fs.mkdirSync(parent, { recursive: true });
        fs.writeFileSync(path, content);
        return true;
    }
    catch (error) {
        console.log(error);
        return false;
    }
}
exports.writeFile = writeFile;
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
exports.readJSON = readJSON;
function writeJSON(path, obj) {
    try {
        const jsonString = JSON.stringify(obj, null, '\t');
        return writeFile(path, jsonString);
    }
    catch (err) {
        console.log('fail to write to ' + path + ': ', err);
    }
    return false;
}
exports.writeJSON = writeJSON;
function removeFile(path) {
    if (!isFile(path)) {
        return false;
    }
    try {
        fs.unlinkSync(path);
        return true;
    }
    catch (error) {
        console.log(error);
    }
    return false;
}
exports.removeFile = removeFile;
function moveFile(src, dest, cover = true) {
    if (src === dest) {
        return false;
    }
    if (!isFile(src)) {
        return false;
    }
    if (!cover) {
        cover = true;
    }
    copyFile(src, dest, cover);
    try {
        fs.unlinkSync(src);
        return true;
    }
    catch (error) {
        console.log(error);
    }
    return false;
}
exports.moveFile = moveFile;
function copyFile(src, dest, cover = true) {
    if (src === dest) {
        return false;
    }
    if (!isFile(src)) {
        return false;
    }
    if (!cover) {
        cover = true;
    }
    try {
        const parent = fspath.dirname(dest);
        fs.mkdirSync(parent, { recursive: true });
        if (!fs.existsSync(dest) || cover) {
            fs.copyFileSync(src, dest);
        }
        return true;
    }
    catch (error) {
        console.log(error);
        return false;
    }
}
exports.copyFile = copyFile;
/**
 * remove folder or file by path
 * @param path
*/
function rmSync(path) {
    if (fs.existsSync(path)) {
        if (fs.statSync(path).isDirectory()) {
            const files = fs.readdirSync(path);
            for (const file of files) {
                const curPath = hdlPath.join(path, file);
                if (fs.statSync(curPath).isDirectory()) { // recurse
                    rmSync(curPath);
                }
                else { // delete file
                    fs.unlinkSync(curPath);
                }
            }
            fs.rmdirSync(path);
        }
        else {
            fs.unlinkSync(path);
        }
    }
}
exports.rmSync = rmSync;
/**
 * check if obj have attr
 * @param obj
 * @param attr attribution or attributions, split by '.'
 * @returns
 */
function isHasAttr(obj, attr) {
    if (!obj) {
        return false;
    }
    let tempObj = obj;
    attr = attr.replace(/\[(\w+)\]/g, '.$1');
    attr = attr.replace(/^\./, '');
    const keyArr = attr.split('.');
    for (let i = 0; i < keyArr.length; ++i) {
        const element = keyArr[i];
        if (!tempObj) {
            return false;
        }
        if (element in tempObj) {
            tempObj = tempObj[element];
        }
        else {
            return false;
        }
    }
    return true;
}
exports.isHasAttr = isHasAttr;
function isHasValue(obj, attr, value) {
    if (!obj) {
        return false;
    }
    let tempObj = obj;
    attr = attr.replace(/\[(\w+)\]/g, '.$1');
    attr = attr.replace(/^\./, '');
    const keyArr = attr.split('.');
    for (let i = 0; i < keyArr.length; ++i) {
        const element = keyArr[i];
        if (!tempObj) {
            return false;
        }
        if (element in tempObj) {
            tempObj = tempObj[element];
            if (i === keyArr.length - 1 && tempObj !== value) {
                return false;
            }
        }
        else {
            return false;
        }
    }
    return true;
}
exports.isHasValue = isHasValue;
function* walk(path, condition) {
    if (isFile(path)) {
        if (!condition || condition(path)) {
            yield path;
        }
    }
    else {
        for (const file of fs.readdirSync(path)) {
            const filePath = hdlPath.join(path, file);
            if (isDir(filePath)) {
                for (const targetPath of walk(filePath, condition)) {
                    yield targetPath;
                }
            }
            else if (isFile(filePath)) {
                if (!condition || condition(filePath)) {
                    yield filePath;
                }
            }
        }
    }
}
exports.walk = walk;
//# sourceMappingURL=file.js.map