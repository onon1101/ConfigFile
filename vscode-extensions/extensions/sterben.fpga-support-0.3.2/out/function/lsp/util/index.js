"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchCommentAround = exports.transferVlogNumber = exports.makeNormalDesc = exports.makeParamDesc = exports.makePortDesc = exports.getInstParamByPosition = exports.getInstPortByPosition = exports.positionAfterEqual = exports.makeVhdlHoverContent = exports.makeVlogHoverContent = exports.matchNormalSymbol = exports.matchParams = exports.matchPorts = exports.matchInstance = exports.matchDefineMacro = exports.matchDefine = exports.matchInclude = exports.isInComment = exports.isPositionInput = exports.filterInstanceByPosition = exports.locateVhdlSymbol = exports.locateVlogSymbol = exports.transformRange = void 0;
const vscode = require("vscode");
const feature_1 = require("./feature");
Object.defineProperty(exports, "transferVlogNumber", { enumerable: true, get: function () { return feature_1.transferVlogNumber; } });
const common_1 = require("../../../hdlParser/common");
// eslint-disable-next-line @typescript-eslint/naming-convention
const Unknown = 'Unknown';
;
;
function transformRange(range, lineOffset = 0, characterOffset = 0, endLineOffset = undefined, endCharacterOffset = undefined) {
    const start = range.start;
    const end = range.end;
    const startPosition = new vscode.Position(start.line + lineOffset, start.character + characterOffset);
    endLineOffset = endLineOffset ? endLineOffset : lineOffset;
    endCharacterOffset = endCharacterOffset ? endLineOffset : characterOffset;
    const endPosition = new vscode.Position(end.line + endLineOffset, end.character + endCharacterOffset);
    return new vscode.Range(startPosition, endPosition);
}
exports.transformRange = transformRange;
function positionAfter(positionA, positionB) {
    return positionA.line > positionB.line || (positionA.line === positionB.line &&
        positionA.character > positionB.character);
}
function positionEqual(positionA, positionB) {
    return positionA.line === positionB.line &&
        positionA.character === positionB.character;
}
/**
 * @description positionA behind or equal to positionB
 */
function positionAfterEqual(positionA, positionB) {
    return positionAfter(positionA, positionB) ||
        positionEqual(positionA, positionB);
}
exports.positionAfterEqual = positionAfterEqual;
/**
 * @description filter the symbol result item that exceed the scope
 */
function locateVlogSymbol(position, rawSymbols) {
    if (!rawSymbols) {
        return null;
    }
    const parentModules = rawSymbols.filter(item => item.type === 'module' &&
        positionAfterEqual(position, item.range.start) &&
        positionAfterEqual(item.range.end, position));
    if (parentModules.length === 0) {
        // TODO : macro
        return null;
    }
    const parentModule = parentModules[0];
    const symbols = rawSymbols.filter(item => item !== parentModule &&
        positionAfterEqual(item.range.start, parentModule.range.start) &&
        positionAfterEqual(parentModule.range.end, item.range.end));
    return {
        module: parentModule,
        symbols: symbols
    };
}
exports.locateVlogSymbol = locateVlogSymbol;
function locateVhdlSymbol(position, rawSymbols) {
    if (!rawSymbols) {
        return null;
    }
    const parentModules = rawSymbols.filter(item => (item.type === 'entity' || item.type === 'architecture') &&
        positionAfterEqual(position, item.range.start) &&
        positionAfterEqual(item.range.end, position));
    if (parentModules.length === 0) {
        // TODO : macro
        return null;
    }
    const parentModule = parentModules[0];
    const symbols = rawSymbols.filter(item => item !== parentModule &&
        positionAfterEqual(item.range.start, parentModule.range.start) &&
        positionAfterEqual(parentModule.range.end, item.range.end));
    return {
        module: parentModule,
        symbols: symbols
    };
}
exports.locateVhdlSymbol = locateVhdlSymbol;
function isInComment(document, position, comments) {
    if (!comments) {
        return false;
    }
    // remove the situation that   <cursor> // comment
    const lineText = document.lineAt((0, common_1.makeVscodePosition)(position)).text;
    const singleCommentIndex = lineText.indexOf('//');
    if (singleCommentIndex !== -1) {
        return position.character >= singleCommentIndex;
    }
    const currentLine = position.line + 1;
    for (const comment of comments) {
        const commentLine = comment.start.line;
        if (commentLine > currentLine) {
            continue;
        }
        const startPosition = new vscode.Position(commentLine, 0);
        const startOffset = document.offsetAt(startPosition);
        const endPosition = document.positionAt(startOffset + comment.length);
        const originalPosition = { line: currentLine, character: position.character };
        if (positionAfterEqual(originalPosition, startPosition) &&
            positionAfterEqual(endPosition, originalPosition)) {
            return true;
        }
    }
    return false;
}
exports.isInComment = isInComment;
function matchInclude(document, position, includes) {
    const selectFileRange = document.getWordRangeAtPosition(position, /[\.\\\/_0-9A-Za-z]+/);
    const selectFileName = document.getText(selectFileRange);
    if (!includes) {
        return null;
    }
    for (const include of includes) {
        const range = include.range;
        if (position.line + 1 === range.start.line && selectFileName === include.path) {
            return {
                name: include.path,
                value: include.path,
                range: range
            };
        }
    }
    return null;
}
exports.matchInclude = matchInclude;
function matchDefine(position, defines) {
    if (!defines) {
        return null;
    }
    for (const define of defines) {
        const range = define.range;
        if (positionAfterEqual(position, range.start) &&
            positionAfterEqual(range.end, position)) {
            return {
                name: define.name,
                value: define.replacement,
                range: range
            };
        }
    }
    return null;
}
exports.matchDefine = matchDefine;
function matchDefineMacro(position, singleWord, defines) {
    if (!defines) {
        return null;
    }
    if (singleWord[0] !== '`' || singleWord.length <= 1) {
        return null;
    }
    const targetMacro = singleWord.substring(1);
    for (const define of defines) {
        if (define.name === targetMacro) {
            const range = define.range;
            return {
                name: define.name,
                value: define.replacement,
                range: range
            };
        }
    }
    return null;
}
exports.matchDefineMacro = matchDefineMacro;
function matchInstance(singleWord, module) {
    for (const inst of module.getAllInstances()) {
        if (singleWord === inst.type) {
            return inst;
        }
    }
    return null;
}
exports.matchInstance = matchInstance;
function filterInstanceByPosition(position, symbols, module) {
    if (!symbols) {
        return null;
    }
    for (const symbol of symbols) {
        const inst = module.getInstance(symbol.name);
        if (positionAfterEqual(position, symbol.range.start) &&
            positionAfterEqual(symbol.range.end, position) &&
            inst) {
            return inst;
        }
    }
    return null;
}
exports.filterInstanceByPosition = filterInstanceByPosition;
async function getInstPortByPosition(inst, position, singleWord) {
    if (!inst.module || !inst.instports) {
        return null;
    }
    const instportRange = transformRange(inst.instports, -1, 0);
    if (positionAfterEqual(position, instportRange.start) &&
        positionAfterEqual(instportRange.end, position)) {
        for (const port of inst.module.ports) {
            if (port.name === singleWord) {
                return port;
            }
        }
    }
    return null;
}
exports.getInstPortByPosition = getInstPortByPosition;
async function getInstParamByPosition(inst, position, singleWord) {
    if (!inst || !inst.module || !inst.instparams) {
        return null;
    }
    const instParamRange = transformRange(inst.instparams, -1, 0);
    if (positionAfterEqual(position, instParamRange.start) &&
        positionAfterEqual(instParamRange.end, position)) {
        for (const param of inst.module.params) {
            if (param.name === singleWord) {
                return param;
            }
        }
    }
    return null;
}
exports.getInstParamByPosition = getInstParamByPosition;
function isPositionInput(lineText, character) {
    const alphaReg = /[_0-9A-Za-z]/;
    for (let i = character; i >= 0; --i) {
        const ch = lineText[i];
        if (alphaReg.test(ch)) {
            continue;
        }
        else if (ch === '.') {
            if (i === 0) {
                return true;
            }
            else if (lineText[i - 1] === ' ') {
                return true;
            }
            else {
                return false;
            }
        }
        else {
            return false;
        }
    }
    return false;
}
exports.isPositionInput = isPositionInput;
function matchPorts(singleWord, module) {
    if (!module || module.ports.length === 0) {
        return null;
    }
    const targetPorts = module.ports.filter(port => port.name === singleWord);
    if (targetPorts.length === 0) {
        return null;
    }
    return targetPorts[0];
}
exports.matchPorts = matchPorts;
function matchParams(singleWord, module) {
    if (module.params.length === 0) {
        return null;
    }
    const targetParams = module.params.filter(param => param.name === singleWord);
    if (targetParams.length === 0) {
        return null;
    }
    return targetParams[0];
}
exports.matchParams = matchParams;
function makePortDesc(port) {
    const portDescArray = [];
    portDescArray.push(port.type);
    if (port.netType) {
        portDescArray.push(port.netType);
    }
    if (port.signed) {
        portDescArray.push('signed');
    }
    if (port.width && port.width !== Unknown && port.width !== '1') {
        portDescArray.push(port.width);
    }
    portDescArray.push(port.name);
    const portDesc = portDescArray.join(' ');
    return portDesc;
}
exports.makePortDesc = makePortDesc;
function makeParamDesc(param) {
    let paramDesc = 'parameter ' + param.name;
    if (param.init && param.init !== Unknown) {
        paramDesc += ' = ' + param.init;
    }
    return paramDesc;
}
exports.makeParamDesc = makeParamDesc;
function makeNormalDesc(normal) {
    const width = normal.width ? normal.width : '';
    const signed = normal.signed === 1 ? 'signed' : '';
    let desc = normal.type + ' ' + signed + ' ' + width + ' ' + normal.name;
    if (normal.init) {
        desc += ' = ' + normal.init;
    }
    return desc;
}
exports.makeNormalDesc = makeNormalDesc;
function matchNormalSymbol(singleWord, symbols) {
    if (!symbols || Object.keys(symbols).length === 0) {
        return null;
    }
    for (const symbol of symbols) {
        if (singleWord === symbol.name) {
            return symbol;
        }
    }
    return null;
}
exports.matchNormalSymbol = matchNormalSymbol;
async function makeVlogHoverContent(content, module) {
    const portNum = module.ports.length;
    const paramNum = module.params.length;
    const instNum = module.getInstanceNum();
    const moduleUri = vscode.Uri.file(module.path);
    const thenableFileDocument = vscode.workspace.openTextDocument(moduleUri);
    const portDesc = ' $(instance-param) ' + paramNum +
        ' $(instance-port) ' + portNum +
        ' $(instance-module)' + instNum;
    content.appendMarkdown(portDesc);
    content.appendText('   |   ');
    const count = {
        input: 0,
        output: 0,
        inout: 0
    };
    for (const port of module.ports) {
        count[port.type] += 1;
    }
    const ioDesc = ' $(instance-input) ' + count.input +
        ' $(instance-output) ' + count.output +
        ' $(instance-inout)' + count.inout;
    content.appendMarkdown(ioDesc);
    content.appendText('\n');
    content.appendMarkdown('---');
    // make document
    const fileDocument = await thenableFileDocument;
    const range = transformRange(module.range, -1, 0, 1);
    const moduleDefinitionCode = fileDocument.getText(range);
    content.appendCodeblock(moduleDefinitionCode, 'verilog');
}
exports.makeVlogHoverContent = makeVlogHoverContent;
async function makeVhdlHoverContent(content, module) {
    const portNum = module.ports.length;
    const paramNum = module.params.length;
    const instNum = module.getInstanceNum();
    const moduleUri = vscode.Uri.file(module.path);
    const thenableFileDocument = vscode.workspace.openTextDocument(moduleUri);
    const portDesc = ' $(instance-param) ' + paramNum +
        ' $(instance-port) ' + portNum +
        ' $(instance-module)' + instNum;
    content.appendMarkdown(portDesc);
    content.appendText('   |   ');
    const count = {
        input: 0,
        output: 0,
        inout: 0
    };
    for (const port of module.ports) {
        count[port.type] += 1;
    }
    const ioDesc = ' $(instance-input) ' + count.input +
        ' $(instance-output) ' + count.output +
        ' $(instance-inout)' + count.inout;
    content.appendMarkdown(ioDesc);
    content.appendText('\n');
    content.appendMarkdown('---');
    // make document
    const fileDocument = await thenableFileDocument;
    const range = transformRange(module.range, -1, 0, 1);
    const moduleDefinitionCode = fileDocument.getText(range);
    content.appendCodeblock(moduleDefinitionCode, 'vhdl');
}
exports.makeVhdlHoverContent = makeVhdlHoverContent;
async function searchCommentAround(path, range) {
    const targetRange = transformRange(range, -1, 0);
    const comment = await (0, feature_1.getSymbolComment)(path, targetRange);
    return comment;
}
exports.searchCommentAround = searchCommentAround;
//# sourceMappingURL=index.js.map