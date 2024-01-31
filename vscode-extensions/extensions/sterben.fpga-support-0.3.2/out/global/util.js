"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.easyExec = exports.isSameSet = exports.PathSet = void 0;
const fs = require("fs");
const childProcess = require("child_process");
class PathSet {
    constructor() {
        this.files = new Set();
    }
    add(path) {
        this.files.add(path);
    }
    checkAdd(path) {
        if (path instanceof Array) {
            path.forEach(p => this.checkAdd(p));
        }
        else if (fs.existsSync(path)) {
            this.files.add(path);
        }
    }
}
exports.PathSet = PathSet;
/**
 * tell if two set are element-wise equal
 * @param setA
 * @param setB
 */
function isSameSet(setA, setB) {
    if (setA.size !== setB.size) {
        return false;
    }
    for (const el of setB) {
        if (!setA.has(el)) {
            return false;
        }
    }
    return true;
}
exports.isSameSet = isSameSet;
/**
 * more elegant function to execute command
 * @param executor executor
 * @param args argruments
 * @returns { Promise<ExecutorOutput> }
 */
async function easyExec(executor, args) {
    const allArguments = [executor, ...args];
    const command = allArguments.join(' ');
    const p = new Promise((resolve, _) => {
        childProcess.exec(command, (_, stdout, stderr) => {
            resolve({ stdout, stderr });
        });
    });
    return p;
}
exports.easyExec = easyExec;
//# sourceMappingURL=util.js.map