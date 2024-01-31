"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YosysOutput = exports.LspOutput = exports.MainOutput = exports.ReportType = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const vscode = require("vscode");
var ReportType;
(function (ReportType) {
    ReportType["Debug"] = "Debug";
    ReportType["Launch"] = "Launch";
    ReportType["Performance"] = "Performance";
    ReportType["PathCheck"] = "Path Check";
    ReportType["Info"] = "Info";
    ReportType["Warn"] = "Warn";
    ReportType["Error"] = "Error";
    ReportType["Run"] = "Run";
})(ReportType || (ReportType = {}));
exports.ReportType = ReportType;
;
class Output {
    constructor(title, ignoreType = []) {
        this._output = vscode.window.createOutputChannel(title);
        this._ignoreTypes = ignoreType;
    }
    alignTime(s) {
        const sstr = s + '';
        if (sstr.length === 1) {
            return '0' + sstr;
        }
        else {
            return sstr;
        }
    }
    getCurrentTime() {
        const date = new Date();
        const hms = [date.getHours(), date.getMinutes(), date.getSeconds()];
        return hms.map(this.alignTime).join(':');
    }
    skipMessage(type) {
        return this._ignoreTypes.includes(type);
    }
    showInWindows(message, type = ReportType.Info) {
        if (type === ReportType.Warn) {
            vscode.window.showWarningMessage(message);
        }
        else if (type === ReportType.Error) {
            vscode.window.showErrorMessage(message);
        }
        else {
            vscode.window.showInformationMessage(message);
        }
    }
    /**
     *
     * @param message message
     * @param type report type
     * @param reportInWindows whether use vscode.windows.<api> to show info
     */
    report(message, type = ReportType.Info, reportInWindows = false) {
        if (!this.skipMessage(type) && message) {
            // this._output.show(true);
            const currentTime = this.getCurrentTime();
            this._output.appendLine('[' + type + ' - ' + currentTime + '] ' + message);
            if (reportInWindows) {
                this.showInWindows('' + message, type);
            }
        }
    }
    show() {
        this._output.show(true);
    }
}
const MainOutput = new Output('Digital-IDE');
exports.MainOutput = MainOutput;
const LspOutput = new Output('Digital-IDE Language Server');
exports.LspOutput = LspOutput;
const YosysOutput = new Output('Yosys');
exports.YosysOutput = YosysOutput;
//# sourceMappingURL=outputChannel.js.map