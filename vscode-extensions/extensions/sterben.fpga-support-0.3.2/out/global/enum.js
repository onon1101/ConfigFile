"use strict";
/* eslint-disable @typescript-eslint/naming-convention */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validLibraryState = exports.validXilinxIP = exports.validToolChainType = exports.ThemeType = exports.XilinxIP = exports.LibraryState = exports.ToolChainType = exports.HdlLangID = void 0;
var HdlLangID;
(function (HdlLangID) {
    HdlLangID["Verilog"] = "verilog";
    HdlLangID["SystemVerilog"] = "systemverilog";
    HdlLangID["Vhdl"] = "vhdl";
    HdlLangID["Unknown"] = "Unknown";
})(HdlLangID || (HdlLangID = {}));
exports.HdlLangID = HdlLangID;
;
var ToolChainType;
(function (ToolChainType) {
    ToolChainType["Xilinx"] = "xilinx";
    ToolChainType["Intel"] = "intel";
    ToolChainType["Custom"] = "custom";
})(ToolChainType || (ToolChainType = {}));
exports.ToolChainType = ToolChainType;
;
var LibraryState;
(function (LibraryState) {
    LibraryState["Local"] = "local";
    LibraryState["Remote"] = "remote";
    LibraryState["Unknown"] = "Unknown";
})(LibraryState || (LibraryState = {}));
exports.LibraryState = LibraryState;
;
var XilinxIP;
(function (XilinxIP) {
    XilinxIP["Arm"] = "arm";
    XilinxIP["Aid"] = "aid";
})(XilinxIP || (XilinxIP = {}));
exports.XilinxIP = XilinxIP;
;
var ThemeType;
(function (ThemeType) {
    ThemeType["Dark"] = "dark";
    ThemeType["Light"] = "light";
})(ThemeType || (ThemeType = {}));
exports.ThemeType = ThemeType;
;
function validToolChainType(name) {
    const allTypes = [
        'xilinx',
        'intel',
        'custom'
    ];
    return allTypes.includes(name);
}
exports.validToolChainType = validToolChainType;
function validXilinxIP(name) {
    const ips = [
        'arm',
        'aid'
    ];
    return ips.includes(name);
}
exports.validXilinxIP = validXilinxIP;
function validLibraryState(state) {
    const states = [
        'local',
        'remote',
        'Unknown'
    ];
    return states.includes(state);
}
exports.validLibraryState = validLibraryState;
//# sourceMappingURL=enum.js.map