"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openFsmViewer = void 0;
const fsm_1 = require("../../../resources/fsm");
async function openFsmViewer(context, uri) {
    const viewer = new fsm_1.FsmViewer(context);
    viewer.open(uri);
}
exports.openFsmViewer = openFsmViewer;
//# sourceMappingURL=index.js.map