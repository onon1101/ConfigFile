"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exist = exports.basename = exports.extname = exports.filename = exports.resolve = exports.join = exports.relative = exports.rel2abs = exports.toSlash = void 0;
const fspath = require("path");
const fs = require("fs");
/**
 * @param path
 * @returns
 */
function toSlash(path) {
    return path.replace(/\\/g, "\/");
}
exports.toSlash = toSlash;
/**
 * resolve an absolute path of a relative path in an absolute path
 * @param curPath current path of the file
 * @param relPath relative path in curPath
 * @returns
 */
function rel2abs(curPath, relPath) {
    if (fspath.isAbsolute(relPath)) {
        return relPath;
    }
    const curDirPath = fspath.dirname(curPath);
    const absPath = fspath.resolve(curDirPath, relPath);
    return toSlash(absPath);
}
exports.rel2abs = rel2abs;
function relative(from, to) {
    let rel = fspath.relative(from, to);
    if (!rel.startsWith('.') && !rel.startsWith('./')) {
        rel = './' + rel;
    }
    return toSlash(rel);
}
exports.relative = relative;
/**
 * cat paths with '/'
 * @param paths
 * @returns
 */
function join(...paths) {
    return paths.join('/');
}
exports.join = join;
/**
 * resolve paths with '/'
 * @param paths
 * @returns
 */
function resolve(...paths) {
    const absPath = fspath.resolve(...paths);
    return toSlash(absPath);
}
exports.resolve = resolve;
/**
 * get the extname of a path
 * @param path
 * @param reserveSplitor
 * @returns reserveSplitor=true  src/file.txt -> .txt
 *          reserveSplitor=false src/file.txt -> txt
 */
function extname(path, reserveSplitor = true) {
    let ext = fspath.extname(path).toLowerCase();
    if (!reserveSplitor && ext.startsWith('.')) {
        ext = ext.substring(1);
    }
    return ext;
}
exports.extname = extname;
function basename(path) {
    return fspath.basename(path, extname(path, true));
}
exports.basename = basename;
/**
 * get the file name of a path
 * @param path
 * @returns src/file.txt -> file
 */
function filename(path) {
    const ext = extname(path, true);
    return fspath.basename(path, ext);
}
exports.filename = filename;
function exist(path) {
    if (!path) {
        return false;
    }
    return fs.existsSync(path);
}
exports.exist = exist;
//# sourceMappingURL=path.js.map