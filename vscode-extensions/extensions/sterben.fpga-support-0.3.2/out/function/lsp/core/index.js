"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hdlSymbolStorage = void 0;
const vscode = require("vscode");
const hdlFs_1 = require("../../../hdlFs");
const file_1 = require("../../../hdlFs/file");
const hdlParser_1 = require("../../../hdlParser");
class SymbolStorage {
    constructor(isHdlFile) {
        this.symbolMap = new Map();
        this.isHdlFile = isHdlFile;
    }
    async getSymbol(path) {
        path = hdlFs_1.hdlPath.toSlash(path);
        const allP = this.symbolMap.get(path);
        if (allP) {
            return await allP;
        }
        this.updateSymbol(path);
        const all = await this.symbolMap.get(path);
        return all;
    }
    async updateSymbol(path) {
        path = hdlFs_1.hdlPath.toSlash(path);
        const allPromise = hdlParser_1.HdlSymbol.all(path);
        this.symbolMap.set(path, allPromise);
    }
    async deleteSymbol(path) {
        path = hdlFs_1.hdlPath.toSlash(path);
        this.symbolMap.delete(path);
    }
    async initialise() {
        for (const doc of vscode.workspace.textDocuments) {
            // TODO : check support for sv
            // TODO : check performance
            if ((0, file_1.isHDLFile)(doc.fileName)) {
                await this.updateSymbol(doc.fileName);
            }
        }
    }
}
const hdlSymbolStorage = new SymbolStorage(file_1.isVerilogFile);
exports.hdlSymbolStorage = hdlSymbolStorage;
//# sourceMappingURL=index.js.map