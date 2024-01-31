"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerNetlist = exports.registerFSM = exports.registerToolCommands = exports.registerLsp = exports.registerFunctionCommands = void 0;
const vscode = require("vscode");
const hdlDoc = require("./hdlDoc");
const sim = require("./sim");
const treeView = require("./treeView");
const lspCompletion = require("./lsp/completion");
const lspDocSymbol = require("./lsp/docSymbol");
const lspDefinition = require("./lsp/definition");
const lspHover = require("./lsp/hover");
const lspFormatter = require("../../resources/formatter");
const lspTranslator = require("../../resources/translator");
const lspLinter = require("./lsp/linter");
const tool = require("./tool");
const lspCore = require("./lsp/core");
// special function
const FSM = require("./fsm");
const Netlist = require("./netlist");
function registerDocumentation(context) {
    vscode.commands.registerCommand('digital-ide.hdlDoc.showWebview', hdlDoc.showDocWebview);
    hdlDoc.registerFileDocExport(context);
    hdlDoc.registerProjectDocExport(context);
}
function registerSimulation(context) {
    vscode.commands.registerCommand('digital-ide.tool.instance', sim.instantiation);
    vscode.commands.registerCommand('digital-ide.tool.testbench', sim.testbench);
    vscode.commands.registerCommand('digital-ide.tool.icarus.simulateFile', sim.Icarus.simulateFile);
}
function registerFunctionCommands(context) {
    registerDocumentation(context);
    registerSimulation(context);
    registerTreeView(context);
}
exports.registerFunctionCommands = registerFunctionCommands;
function registerTreeView(context) {
    // register normal tree
    vscode.window.registerTreeDataProvider('digital-ide-treeView-arch', treeView.moduleTreeProvider);
    vscode.window.registerTreeDataProvider('digital-ide-treeView-tool', treeView.toolTreeProvider);
    vscode.window.registerTreeDataProvider('digital-ide-treeView-hardware', treeView.hardwareTreeProvider);
    // vscode.window.registerTreeDataProvider('digital-ide-treeView-software', treeView.softwareTreeProvider);
    // constant used in tree
    vscode.commands.executeCommand('setContext', 'TOOL-tree-expand', false);
    // register command in tree
    vscode.commands.registerCommand('digital-ide.treeView.arch.expand', treeView.expandTreeView);
    vscode.commands.registerCommand('digital-ide.treeView.arch.collapse', treeView.collapseTreeView);
    vscode.commands.registerCommand('digital-ide.treeView.arch.refresh', treeView.refreshArchTree);
    vscode.commands.registerCommand('digital-ide.treeView.arch.openFile', treeView.openFileByUri);
}
function registerLsp(context) {
    const vlogSelector = { scheme: 'file', language: 'verilog' };
    const svlogSelector = { scheme: 'file', language: 'systemverilog' };
    const vhdlSelector = { scheme: 'file', language: 'vhdl' };
    const tclSelector = { scheme: 'file', language: 'tcl' };
    // formatter
    vscode.languages.registerDocumentFormattingEditProvider(vlogSelector, lspFormatter.hdlFormatterProvider);
    vscode.languages.registerDocumentFormattingEditProvider(vhdlSelector, lspFormatter.hdlFormatterProvider);
    vscode.languages.registerDocumentFormattingEditProvider(svlogSelector, lspFormatter.hdlFormatterProvider);
    // translator
    vscode.commands.registerCommand('digital-ide.vhdl2vlog', uri => lspTranslator.vhdl2vlog(uri));
    // verilog lsp
    vscode.languages.registerDocumentSymbolProvider(vlogSelector, lspDocSymbol.vlogDocSymbolProvider);
    vscode.languages.registerDefinitionProvider(vlogSelector, lspDefinition.vlogDefinitionProvider);
    vscode.languages.registerHoverProvider(vlogSelector, lspHover.vlogHoverProvider);
    vscode.languages.registerCompletionItemProvider(vlogSelector, lspCompletion.vlogIncludeCompletionProvider, '/', '"');
    vscode.languages.registerCompletionItemProvider(vlogSelector, lspCompletion.vlogMacroCompletionProvider, '`');
    vscode.languages.registerCompletionItemProvider(vlogSelector, lspCompletion.vlogPositionPortProvider, '.');
    vscode.languages.registerCompletionItemProvider(vlogSelector, lspCompletion.vlogCompletionProvider);
    // vscode.languages.registerDocumentSemanticTokensProvider(vlogSelector, lspDocSemantic.vlogDocSenmanticProvider, lspDocSemantic.vlogLegend);
    // vhdl lsp    
    vscode.languages.registerDocumentSymbolProvider(vhdlSelector, lspDocSymbol.vhdlDocSymbolProvider);
    vscode.languages.registerDefinitionProvider(vhdlSelector, lspDefinition.vhdlDefinitionProvider);
    vscode.languages.registerHoverProvider(vhdlSelector, lspHover.vhdlHoverProvider);
    vscode.languages.registerCompletionItemProvider(vhdlSelector, lspCompletion.vhdlCompletionProvider);
    // tcl lsp
    vscode.languages.registerCompletionItemProvider(tclSelector, lspCompletion.tclCompletionProvider);
    // lsp linter
    // make first symbols in workspace
    lspCore.hdlSymbolStorage.initialise();
    lspLinter.vlogLinterManager.initialise();
    lspLinter.vhdlLinterManager.initialise();
    lspLinter.svlogLinterManager.initialise();
    vscode.commands.registerCommand('digital-ide.lsp.vlog.linter.pick', lspLinter.pickVlogLinter);
    vscode.commands.registerCommand('digital-ide.lsp.vhdl.linter.pick', lspLinter.pickVhdlLinter);
    vscode.commands.registerCommand('digital-ide.lsp.svlog.linter.pick', lspLinter.pickSvlogLinter);
}
exports.registerLsp = registerLsp;
function registerToolCommands(context) {
    vscode.commands.registerCommand('digital-ide.lsp.tool.insertTextToUri', tool.insertTextToUri);
    vscode.commands.registerCommand('digital-ide.lsp.tool.transformOldPropertyFile', tool.transformOldPpy);
}
exports.registerToolCommands = registerToolCommands;
function registerFSM(context) {
    vscode.commands.registerCommand('digital-ide.fsm.show', uri => FSM.openFsmViewer(context, uri));
}
exports.registerFSM = registerFSM;
function registerNetlist(context) {
    vscode.commands.registerCommand('digital-ide.netlist.show', uri => Netlist.openNetlistViewer(context, uri));
}
exports.registerNetlist = registerNetlist;
//# sourceMappingURL=index.js.map