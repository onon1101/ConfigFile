"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HdlSymbol = void 0;
const hdlParser_1 = require("../../resources/hdlParser");
const hdlFs_1 = require("../hdlFs");
const enum_1 = require("../global/enum");
var HdlSymbol;
(function (HdlSymbol) {
    function fast(path) {
        const langID = hdlFs_1.hdlFile.getLanguageId(path);
        switch (langID) {
            case enum_1.HdlLangID.Verilog: return (0, hdlParser_1.vlogFast)(path);
            case enum_1.HdlLangID.Vhdl: return (0, hdlParser_1.vhdlFast)(path);
            case enum_1.HdlLangID.SystemVerilog: return (0, hdlParser_1.svFast)(path);
            default: return new Promise(resolve => resolve(undefined));
        }
    }
    HdlSymbol.fast = fast;
    function all(path) {
        const langID = hdlFs_1.hdlFile.getLanguageId(path);
        switch (langID) {
            case enum_1.HdlLangID.Verilog: return (0, hdlParser_1.vlogAll)(path);
            case enum_1.HdlLangID.Vhdl: return (0, hdlParser_1.vhdlAll)(path);
            case enum_1.HdlLangID.SystemVerilog: return (0, hdlParser_1.svAll)(path);
            default: return new Promise(resolve => resolve(undefined));
        }
    }
    HdlSymbol.all = all;
})(HdlSymbol || (HdlSymbol = {}));
exports.HdlSymbol = HdlSymbol;
//# sourceMappingURL=util.js.map