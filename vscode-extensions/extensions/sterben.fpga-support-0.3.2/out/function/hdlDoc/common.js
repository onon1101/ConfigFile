"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Count = exports.getWavedromsFromFile = exports.makeWaveDromSVG = exports.RenderString = exports.WavedromString = exports.MarkdownString = exports.BaseDoc = exports.RenderType = exports.mergeSortByLine = exports.converter = void 0;
const vscode = require("vscode");
const fs = require("fs");
const readline = require("readline");
const JSON5 = require("../../../resources/json5");
const Wavedrom = require("../../../resources/wavedrom");
const showdown = require("showdown");
const enum_1 = require("../../global/enum");
const global_1 = require("../../global");
const Count = {
    svgMakeTimes: 0
};
exports.Count = Count;
const converter = new showdown.Converter({
    tables: true,
    literalMidWordUnderscores: true,
    strikethrough: true,
    simpleLineBreaks: true
});
exports.converter = converter;
var MarkdownTag;
(function (MarkdownTag) {
    MarkdownTag["Title"] = "#";
    MarkdownTag["Quote"] = ">";
    MarkdownTag["Bold"] = "**";
    MarkdownTag["Italic"] = "*";
    MarkdownTag["InlineCode"] = "`";
    MarkdownTag["UnorderedList"] = "-";
})(MarkdownTag || (MarkdownTag = {}));
;
var MarkdownAlign;
(function (MarkdownAlign) {
    MarkdownAlign[MarkdownAlign["Left"] = 0] = "Left";
    MarkdownAlign[MarkdownAlign["Center"] = 1] = "Center";
    MarkdownAlign[MarkdownAlign["Right"] = 2] = "Right";
})(MarkdownAlign || (MarkdownAlign = {}));
;
var RenderType;
(function (RenderType) {
    RenderType[RenderType["Wavedrom"] = 0] = "Wavedrom";
    RenderType[RenderType["Markdown"] = 1] = "Markdown";
})(RenderType || (RenderType = {}));
exports.RenderType = RenderType;
;
function getAlignSpliter(align) {
    switch (align) {
        case MarkdownAlign.Left: return ':---';
        case MarkdownAlign.Center: return ':---:';
        case MarkdownAlign.Right: return '---:';
        default: return '';
    }
}
function joinString(...strings) {
    return strings.join(' ');
}
function catString(...strings) {
    return strings.join('');
}
function getThemeColorKind() {
    const currentColorKind = vscode.window.activeColorTheme.kind;
    if (currentColorKind === vscode.ColorThemeKind.Dark ||
        currentColorKind === vscode.ColorThemeKind.HighContrast) {
        return enum_1.ThemeType.Dark;
    }
    else {
        return enum_1.ThemeType.Light;
    }
}
class BaseDoc {
    constructor(value) {
        this.value = value;
    }
}
exports.BaseDoc = BaseDoc;
;
class Text extends BaseDoc {
    constructor(value) {
        super(value);
    }
}
;
class Title extends BaseDoc {
    constructor(value, level) {
        super(value);
        this.level = level;
        const prefix = MarkdownTag.Title.repeat(level);
        this.value = joinString(prefix, value);
    }
}
;
class UnorderedList {
    constructor(values) {
        this.value = '';
        for (const v of values) {
            this.value += joinString(MarkdownTag.UnorderedList, v, '\n');
        }
    }
}
;
class OrderedList {
    constructor(values) {
        this.value = '';
        values.forEach((v, i) => {
            const id = i + 1;
            this.value += joinString(id + '.', v, '\n');
        });
    }
}
;
class Quote extends BaseDoc {
    /**
     * @description quote, tag > in markdown
     * @param {string} value
     */
    constructor(value) {
        super(value);
        this.value = joinString(MarkdownTag.Quote, value);
    }
}
;
class Bold extends BaseDoc {
    constructor(value) {
        super(value);
        this.value = catString(MarkdownTag.Bold, value, MarkdownTag.Bold);
    }
}
;
class Italic extends BaseDoc {
    constructor(value) {
        super(value);
        this.value = catString(MarkdownTag.Italic, value, MarkdownTag.Italic);
    }
}
;
class InlineCode extends BaseDoc {
    constructor(value) {
        super(value);
        this.value = catString(MarkdownTag.InlineCode, value, MarkdownTag.InlineCode);
    }
}
class Split extends BaseDoc {
    constructor() {
        super('---');
    }
}
;
class Table extends BaseDoc {
    constructor(fieldNames, rows, align = MarkdownAlign.Left) {
        const colNum = fieldNames.length;
        const rowNum = rows.length;
        const alignString = getAlignSpliter(align);
        let value = catString('| ', fieldNames.join(' | '), ' |', '\n');
        const alignUnit = catString('| ', alignString, ' ');
        value += catString(alignUnit.repeat(colNum), '|', '\n');
        for (let row = 0; row < rowNum; ++row) {
            const data = rows[row];
            value += catString('| ', data.join(' | '), '|');
            if (row < rowNum - 1) {
                value += '\n';
            }
        }
        super(value);
    }
}
;
class RenderString {
    constructor(line, type) {
        this.line = line;
        this.type = type;
    }
}
exports.RenderString = RenderString;
;
class MarkdownString extends RenderString {
    constructor(line) {
        super(line, RenderType.Markdown);
        this.values = [];
    }
    addText(value, end = '\n') {
        const tag = new Text(value);
        this.values.push({ tag, end });
    }
    addTitle(value, level, end = '\n') {
        const tag = new Title(value, level);
        this.values.push({ tag, end });
    }
    addQuote(value, end = '\n') {
        const tag = new Quote(value);
        this.values.push({ tag, end });
    }
    addBold(value, end = '\n') {
        const tag = new Bold(value);
        this.values.push({ tag, end });
    }
    addEnter() {
        const tag = { value: '' };
        const end = '\n';
        this.values.push({ tag, end });
    }
    addItalic(value, end = '\n') {
        const tag = new Italic(value);
        this.values.push({ tag, end });
    }
    addInlineCode(value, end = '\n') {
        const tag = new InlineCode(value);
        this.values.push({ tag, end });
    }
    addUnorderedList(values) {
        const end = '';
        const tag = new UnorderedList(values);
        this.values.push({ tag, end });
    }
    addOrderedList(values) {
        const end = '';
        const tag = new OrderedList(values);
        this.values.push({ tag, end });
    }
    addSplit(value) {
        const end = '\n';
        const tag = new Split();
        this.values.push({ tag, end });
    }
    addTable(fieldNames, rows, align = MarkdownAlign.Left, end = '\n') {
        const tag = new Table(fieldNames, rows, align);
        this.values.push({ tag, end });
    }
    renderMarkdown() {
        let markdown = '';
        for (const md of this.values) {
            markdown += md.tag.value + md.end;
        }
        return markdown;
    }
    render() {
        const rawMD = this.renderMarkdown();
        return converter.makeHtml(rawMD);
    }
}
exports.MarkdownString = MarkdownString;
;
class WavedromString extends RenderString {
    constructor(line, desc) {
        super(line, RenderType.Wavedrom);
        this.value = '';
        this.desc = desc;
    }
    add(text) {
        this.value += text;
    }
    render() {
        const style = getThemeColorKind();
        return makeWaveDromSVG(this.value, style);
    }
}
exports.WavedromString = WavedromString;
;
function parseJson5(text) {
    let json = null;
    try {
        json = JSON5.parse(text);
    }
    catch (error) {
        global_1.MainOutput.report('error happen when parse json ', global_1.ReportType.Error);
        global_1.MainOutput.report(error, global_1.ReportType.Error);
    }
    return json;
}
function makeWaveDromSVG(wavedromComment, style) {
    const json = parseJson5(wavedromComment);
    try {
        if (!json) {
            return '';
        }
        const svgString = Wavedrom.renderWaveDrom(Count.svgMakeTimes, json, style);
        Count.svgMakeTimes += 1;
        return svgString;
    }
    catch (error) {
        global_1.MainOutput.report('error happen when render ' + wavedromComment, global_1.ReportType.Error);
        global_1.MainOutput.report(error, global_1.ReportType.Error);
        return '';
    }
}
exports.makeWaveDromSVG = makeWaveDromSVG;
/**
 * extract wavedrom comment from hdl file
 * @param path
 * @returns
 */
async function getWavedromsFromFile(path) {
    let lineID = 0;
    let findWavedrom = false;
    const wavedroms = [];
    const fileStream = fs.createReadStream(path, 'utf-8');
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    for await (const line of rl) {
        lineID += 1;
        if (findWavedrom) {
            if (/\*\//g.test(line)) {
                findWavedrom = false;
            }
            else {
                const currentWav = wavedroms[wavedroms.length - 1];
                currentWav.add(line.trim());
            }
        }
        else {
            if (/\/\*[\s\S]*(@wavedrom)/g.test(line)) {
                findWavedrom = true;
                let spliters = line.trim().split('@wavedrom');
                let desc = spliters[spliters.length - 1];
                const newWavedrom = new WavedromString(lineID, desc);
                wavedroms.push(newWavedrom);
            }
        }
    }
    return wavedroms;
}
exports.getWavedromsFromFile = getWavedromsFromFile;
function mergeSortByLine(docs, svgs) {
    const renderList = [];
    let i = 0, j = 0;
    while (i < docs.length && j < svgs.length) {
        if (docs[i].line < svgs[j].line) {
            renderList.push(docs[i]);
            i++;
        }
        else {
            renderList.push(svgs[j]);
            j++;
        }
    }
    while (i < docs.length) {
        renderList.push(docs[i]);
        i++;
    }
    while (j < svgs.length) {
        renderList.push(svgs[j]);
        j++;
    }
    return renderList;
}
exports.mergeSortByLine = mergeSortByLine;
//# sourceMappingURL=common.js.map