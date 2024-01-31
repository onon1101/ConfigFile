"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hdlMonitor = void 0;
const chokidar = require("chokidar");
const global_1 = require("../global");
const lang_1 = require("../global/lang");
const util_1 = require("../global/util");
const hdlFs_1 = require("../hdlFs");
const Event = require("./event");
class HdlMonitor {
    constructor() {
        // public config for monitor
        this.monitorConfig = {
            persistent: true,
            usePolling: false,
            ignoreInitial: true
        };
    }
    makeMonitor(paths, config) {
        if (!config) {
            config = this.monitorConfig;
        }
        return chokidar.watch(paths, config);
    }
    /**
     * @description get monitor for property.json
     */
    getPpyMonitor() {
        const watcherPath = global_1.opeParam.propertyJsonPath;
        return this.makeMonitor(watcherPath);
    }
    /**
     * @description get monitor for HDLParam update
     */
    getHdlMonitor() {
        const hdlExtsGlob = `**/*.{${lang_1.hdlExts.join(',')}}`;
        const prjInfo = global_1.opeParam.prjInfo;
        const monitorPathSet = new util_1.PathSet();
        monitorPathSet.checkAdd(prjInfo.hardwareSimPath);
        monitorPathSet.checkAdd(prjInfo.hardwareSrcPath);
        monitorPathSet.checkAdd(prjInfo.libCommonPath);
        monitorPathSet.checkAdd(prjInfo.libCustomPath);
        const monitorFoldersWithGlob = [];
        for (const folder of monitorPathSet.files) {
            const globPath = hdlFs_1.hdlPath.join(folder, hdlExtsGlob);
            monitorFoldersWithGlob.push(globPath);
        }
        global_1.MainOutput.report('Following folders are tracked: ');
        monitorPathSet.files.forEach(p => global_1.MainOutput.report(p));
        return this.makeMonitor(monitorFoldersWithGlob);
    }
    close() {
        this.hdlMonitor?.close();
        this.ppyMonitor?.close();
    }
    start() {
        // make monitor
        this.hdlMonitor = this.getHdlMonitor();
        this.ppyMonitor = this.getPpyMonitor();
        this.registerHdlMonitorListener();
        this.registerPpyMonitorListener();
    }
    remakeHdlMonitor() {
        if (this.hdlMonitor) {
            this.hdlMonitor.close();
            this.hdlMonitor = this.getHdlMonitor();
            this.registerHdlMonitorListener();
        }
    }
    remakePpyMonitor() {
        if (this.ppyMonitor) {
            this.ppyMonitor.close();
            this.ppyMonitor = this.getPpyMonitor();
            this.registerPpyMonitorListener();
        }
    }
    registerHdlMonitorListener() {
        Event.hdlAction.listenAdd(this);
        Event.hdlAction.listenChange(this);
        Event.hdlAction.listenUnlink(this);
        // Event.hdlAction.listenAddDir(this);
        // Event.hdlAction.listenUnlinkDir(this);
    }
    registerPpyMonitorListener() {
        Event.ppyAction.listenAdd(this);
        Event.ppyAction.listenChange(this);
        Event.ppyAction.listenUnlink(this);
    }
}
;
const hdlMonitor = new HdlMonitor();
exports.hdlMonitor = hdlMonitor;
//# sourceMappingURL=index.js.map