"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseManage = void 0;
const vscode = require("vscode");
class BaseManage {
    /**
     * 创建终端，并返回对应的属性
     * @param name 终端名
     * @returns 终端属性
     */
    createTerminal(name) {
        const terminal = this.getTerminal(name);
        if (terminal) {
            return terminal;
        }
        return vscode.window.createTerminal({
            name: name
        });
    }
    /**
     * 获取终端对应的属性
     * @param name 终端名
     * @returns 终端属性
     */
    getTerminal(name) {
        for (const terminal of vscode.window.terminals) {
            if (terminal.name === name) {
                return terminal;
            }
        }
        return null;
    }
}
exports.BaseManage = BaseManage;
//# sourceMappingURL=common.js.map