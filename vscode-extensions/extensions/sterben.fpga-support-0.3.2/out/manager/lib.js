"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LibManage = exports.libManage = void 0;
const vscode = require("vscode");
const fs = require("fs");
const global_1 = require("../global");
const hdlFs_1 = require("../hdlFs");
const enum_1 = require("../global/enum");
const util_1 = require("../global/util");
const ignore_1 = require("./ignore");
const hdlParser_1 = require("../hdlParser");
const treeView_1 = require("../function/treeView");
/**
 * a与b的差集
 * @param a
 * @param b
 * @returns
 */
function diffElement(a, b) {
    const bSet = new Set(b);
    return a.filter(el => !bSet.has(el));
}
function removeDuplicates(a) {
    const aSet = new Set(a);
    return [...aSet];
}
class LibManage {
    constructor() {
        this.curr = { list: [] };
        this.next = { list: [] };
    }
    get customerPath() {
        return global_1.opeParam.prjInfo.libCustomPath;
    }
    get srcPath() {
        return global_1.opeParam.prjInfo.hardwareSrcPath;
    }
    get simPath() {
        return global_1.opeParam.prjInfo.hardwareSimPath;
    }
    get prjPath() {
        return global_1.opeParam.prjInfo.arch.prjPath;
    }
    get localLibPath() {
        return hdlFs_1.hdlPath.join(this.srcPath, 'lib');
    }
    get sourceLibPath() {
        return hdlFs_1.hdlPath.join(global_1.opeParam.extensionPath, 'lib');
    }
    async processLibFiles(library) {
        this.next.list = this.getLibFiles();
        if (library.state === enum_1.LibraryState.Local) {
            this.next.state = enum_1.LibraryState.Local;
        }
        else {
            this.next.state = enum_1.LibraryState.Remote;
        }
        // current disk situation
        if (hdlFs_1.hdlFile.isDir(this.localLibPath)) {
            this.curr.state = enum_1.LibraryState.Local;
        }
        else {
            this.curr.state = enum_1.LibraryState.Remote;
        }
        const add = [];
        const del = [];
        const statePair = this.curr.state + '-' + this.next.state;
        switch (statePair) {
            case 'remote-remote':
                add.push(...diffElement(this.next.list, this.curr.list));
                del.push(...diffElement(this.curr.list, this.next.list));
                break;
            case 'remote-local':
                del.push(...this.curr.list);
                // copy file from remote to local
                const remotePathList = this.getLibFiles(enum_1.LibraryState.Remote);
                this.remote2Local(remotePathList, (src, dist) => {
                    hdlParser_1.hdlParam.deleteHdlFile(src);
                    hdlFs_1.hdlFile.copyFile(src, dist);
                });
                break;
            case 'local-remote':
                add.push(...this.next.list);
                // delete local files & data structure in hdlParam (async)
                await this.deleteLocalFiles();
                break;
            case 'local-local':
                add.push(...diffElement(this.next.list, this.curr.list));
                del.push(...diffElement(this.curr.list, this.next.list));
                this.remote2Local(add, (src, dist) => {
                    hdlFs_1.hdlFile.copyFile(src, dist);
                });
                this.remote2Local(del, (src, dist) => {
                    hdlFs_1.hdlFile.removeFile(dist);
                });
                break;
            default: break;
        }
        return { add, del };
    }
    getLibFiles(state) {
        const libPathSet = new util_1.PathSet();
        for (const path of global_1.opeParam.prjInfo.getLibraryCommonPaths(true, state)) {
            libPathSet.checkAdd(path);
        }
        for (const path of global_1.opeParam.prjInfo.getLibraryCustomPaths()) {
            libPathSet.checkAdd(path);
        }
        const ignores = ignore_1.hdlIgnore.getIgnoreFiles();
        const libPathList = hdlFs_1.hdlFile.getHDLFiles(libPathSet.files, ignores);
        return libPathList;
    }
    async deleteLocalFiles() {
        if (fs.existsSync(this.localLibPath)) {
            const needNotice = vscode.workspace.getConfiguration('digital-ide.prj.file.structure.notice');
            if (needNotice) {
                const res = await vscode.window.showWarningMessage(`Local Lib (${this.localLibPath}) will be removed.`, { modal: true }, { title: 'Yes', value: true }, { title: 'No', value: false });
                if (res?.value) {
                    this.deleteLocalLib();
                }
            }
            else {
                this.deleteLocalLib();
            }
        }
    }
    deleteLocalLib() {
        const ignores = ignore_1.hdlIgnore.getIgnoreFiles();
        const hdlFileList = hdlFs_1.hdlFile.getHDLFiles([this.localLibPath], ignores);
        for (const path of hdlFileList) {
            hdlParser_1.hdlParam.deleteHdlFile(path);
        }
        (0, treeView_1.refreshArchTree)();
        hdlFs_1.hdlDir.rmdir(this.localLibPath);
    }
    remote2Local(remotes, callback) {
        const localLibPath = this.localLibPath;
        const sourceLibPath = this.sourceLibPath;
        const customerPath = this.customerPath;
        const customerPathValid = hdlFs_1.hdlFile.isDir(customerPath);
        for (const srcPath of remotes) {
            const replacePath = (customerPathValid && srcPath.includes(customerPath)) ? customerPath : sourceLibPath;
            const distPath = srcPath.replace(replacePath, localLibPath);
            callback(srcPath, distPath);
        }
    }
}
exports.LibManage = LibManage;
;
const libManage = new LibManage();
exports.libManage = libManage;
//# sourceMappingURL=lib.js.map