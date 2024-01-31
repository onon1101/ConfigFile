"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIconConfig = exports.getIconPath = void 0;
const vscode = require("vscode");
const global_1 = require("../global");
const hdlPath = require("./path");
;
function getIconPath(themeType, iconName) {
    const iconFile = iconName + '.svg';
    const svgDir = hdlPath.join(global_1.opeParam.extensionPath, 'images', 'svg');
    const iconPath = hdlPath.join(svgDir, themeType, iconFile);
    return vscode.Uri.file(iconPath);
}
exports.getIconPath = getIconPath;
function getIconConfig(iconName) {
    return {
        light: getIconPath(global_1.Enum.ThemeType.Light, iconName),
        dark: getIconPath(global_1.Enum.ThemeType.Dark, iconName)
    };
}
exports.getIconConfig = getIconConfig;
//# sourceMappingURL=icons.js.map