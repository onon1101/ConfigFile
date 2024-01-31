"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeVscodePosition = exports.InstModPathStatus = exports.HdlFileType = exports.HdlModuleParamType = exports.HdlModulePortType = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
;
function makeVscodePosition(position) {
    return new vscode.Position(position.line, position.character);
}
exports.makeVscodePosition = makeVscodePosition;
;
var HdlModulePortType;
(function (HdlModulePortType) {
    HdlModulePortType["Inout"] = "inout";
    HdlModulePortType["Output"] = "output";
    HdlModulePortType["Input"] = "input";
    HdlModulePortType["Unknown"] = "unknown";
})(HdlModulePortType || (HdlModulePortType = {}));
exports.HdlModulePortType = HdlModulePortType;
;
var HdlModuleParamType;
(function (HdlModuleParamType) {
    HdlModuleParamType[HdlModuleParamType["LocalParam"] = 0] = "LocalParam";
    HdlModuleParamType[HdlModuleParamType["Parameter"] = 1] = "Parameter";
    HdlModuleParamType[HdlModuleParamType["Unknown"] = 2] = "Unknown";
})(HdlModuleParamType || (HdlModuleParamType = {}));
exports.HdlModuleParamType = HdlModuleParamType;
;
var HdlFileType;
(function (HdlFileType) {
    HdlFileType["Src"] = "src";
    HdlFileType["Sim"] = "sim";
    HdlFileType["LocalLib"] = "local_lib";
    HdlFileType["RemoteLib"] = "remote_lib";
})(HdlFileType || (HdlFileType = {}));
exports.HdlFileType = HdlFileType;
;
var InstModPathStatus;
(function (InstModPathStatus) {
    InstModPathStatus[InstModPathStatus["Current"] = 0] = "Current";
    InstModPathStatus[InstModPathStatus["Include"] = 1] = "Include";
    InstModPathStatus[InstModPathStatus["Others"] = 2] = "Others";
    InstModPathStatus[InstModPathStatus["Unknown"] = 3] = "Unknown";
})(InstModPathStatus || (InstModPathStatus = {}));
exports.InstModPathStatus = InstModPathStatus;
;
;
;
;
;
;
;
;
;
;
;
;
;
//# sourceMappingURL=common.js.map