"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hdlExts = exports.systemVerilogExts = exports.vhdlExts = exports.verilogExts = void 0;
const verilogExts = ['v', 'vh', 'vl'];
exports.verilogExts = verilogExts;
const vhdlExts = ['vhd', 'vhdl', 'vho', 'vht'];
exports.vhdlExts = vhdlExts;
const systemVerilogExts = ['sv'];
exports.systemVerilogExts = systemVerilogExts;
const hdlExts = verilogExts.concat(vhdlExts).concat(systemVerilogExts);
exports.hdlExts = hdlExts;
//# sourceMappingURL=lang.js.map