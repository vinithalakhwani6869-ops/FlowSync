"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const client_1 = require("./api/client");
const panel_1 = require("./panel");
const EVENT_TYPES = {
    FILE_OPENED: "file.opened",
    DIAGNOSTIC_ERROR: "diagnostic.error",
    DEVELOPER_STUCK: "developer.stuck",
    CONTEXT_SWITCHING: "context.switching",
    TERMINAL_ERROR: "terminal.error",
};
const DEFAULT_PROJECT = "unknown-workspace";
function activate(context) {
    reloadConfig();
    const buffer = [];
    let syncing = false;
    let panel;
    let socket = null;
    let syncTimer = null;
    let idleTimer = null;
    function reloadConfig() {
        const config = vscode.workspace.getConfiguration("flowsync");
        (0, client_1.configureClient)({
            baseUrl: config.get("baseUrl", "http://localhost:8000"),
            authToken: config.get("apiKey", ""),
        });
    }
    function getProject() {
        return vscode.workspace.workspaceFolders?.[0]?.name || DEFAULT_PROJECT;
    }
    function push(eventType, payload) {
        buffer.push({
            type: eventType,
            project: getProject(),
            ts: Date.now(),
            source: "vscode",
            payload,
        });
    }
    async function flush() {
        if (syncing || buffer.length === 0)
            return;
        syncing = true;
        try {
            const batch = buffer.splice(0, 100);
            const result = await (0, client_1.postEvents)(batch);
            if (result.retryable) {
                buffer.unshift(...batch);
            }
        }
        finally {
            syncing = false;
        }
    }
    function startSyncTimer() {
        if (syncTimer)
            return;
        const config = vscode.workspace.getConfiguration("flowsync");
        const intervalSec = Math.max(5, config.get("syncIntervalSec", 10));
        syncTimer = setInterval(() => {
            void flush();
        }, intervalSec * 1000);
    }
    function openSocket() {
        if (socket)
            return;
        socket = (0, client_1.connectSocket)(() => {
            // Live frames are intentionally not surfaced in the panel yet.
        });
        const connected = socket !== null;
        panel?.setStatus({
            project: getProject(),
            buffered: buffer.length,
            connected,
        });
    }
    function showPanel() {
        if (panel) {
            panel.reveal();
            return;
        }
        panel = new panel_1.FlowSyncPanel(vscode.window.createWebviewPanel("flowsync.panel", "FlowSync", vscode.ViewColumn.Beside, { enableScripts: true }), context.extensionUri, (msg) => {
            if (msg.command === "ready") {
                panel?.setStatus({
                    project: getProject(),
                    buffered: buffer.length,
                    connected: socket !== null,
                });
            }
            if (msg.command === "syncNow") {
                void flush();
            }
        }, () => {
            panel = undefined;
        });
    }
    // --- Editor activity ---
    const switchWindowMs = 30 * 1000;
    const switchThreshold = 3;
    let lastSwitchAt;
    let switchCount = 0;
    vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (!editor)
            return;
        push(EVENT_TYPES.FILE_OPENED, {
            fileName: vscode.workspace.asRelativePath(editor.document.uri),
            language: editor.document.languageId,
        });
        markActivity();
        const now = Date.now();
        if (lastSwitchAt !== undefined && now - lastSwitchAt < switchWindowMs) {
            switchCount += 1;
        }
        else {
            switchCount = 1;
        }
        lastSwitchAt = now;
        if (switchCount >= switchThreshold) {
            push(EVENT_TYPES.CONTEXT_SWITCHING, {
                switchCount,
                fileName: vscode.workspace.asRelativePath(editor.document.uri),
            });
            switchCount = 0;
            lastSwitchAt = undefined;
        }
        void flush();
    });
    // --- Stuck detection (no typing/editing for 4 min, then stuck for 1 min) ---
    const idleThresholdMs = 4 * 60 * 1000;
    const stuckThresholdMs = 60 * 1000;
    let lastActivityAt = Date.now();
    let stuckSince;
    function markActivity() {
        lastActivityAt = Date.now();
        stuckSince = undefined;
    }
    idleTimer = setInterval(() => {
        const now = Date.now();
        if (stuckSince === undefined && now - lastActivityAt >= idleThresholdMs) {
            stuckSince = now;
            return;
        }
        if (stuckSince !== undefined && now - stuckSince >= stuckThresholdMs) {
            push(EVENT_TYPES.DEVELOPER_STUCK, {
                stuckDuration: now - stuckSince,
            });
            stuckSince = undefined;
            lastActivityAt = now;
            void flush();
        }
    }, 10 * 1000);
    vscode.workspace.onDidChangeTextDocument((change) => {
        markActivity();
    });
    // --- Terminal diagnostics (shell integration requires VS Code 1.88+) ---
    const onStartTerminal = vscode.window.onDidStartTerminalShellExecution;
    if (onStartTerminal) {
        onStartTerminal((event) => {
            const commandLine = event.execution.commandLine?.value;
            push(EVENT_TYPES.TERMINAL_ERROR, {
                terminalOutput: commandLine || "unknown",
            });
            markActivity();
            void flush();
        });
    }
    // --- Diagnostics ---
    const errorTracker = new Map();
    vscode.languages.onDidChangeDiagnostics((event) => {
        for (const uri of event.uris) {
            const errors = vscode.languages
                .getDiagnostics(uri)
                .filter((d) => d.severity === vscode.DiagnosticSeverity.Error);
            if (errors.length === 0) {
                errorTracker.delete(uri.toString());
                continue;
            }
            const first = errors[0];
            if (errorTracker.get(uri.toString())?.message === first.message) {
                continue;
            }
            errorTracker.set(uri.toString(), { message: first.message });
            push(EVENT_TYPES.DIAGNOSTIC_ERROR, {
                fileName: vscode.workspace.asRelativePath(uri),
                language: uri.path.split(".").pop() ?? undefined,
                errorMessage: first.message.length > 500
                    ? `${first.message.slice(0, 500)}…`
                    : first.message,
                severity: "error",
            });
            void flush();
        }
    });
    startSyncTimer();
    openSocket();
    void flush();
    // --- Commands / subscriptions ---
    context.subscriptions.push(vscode.commands.registerCommand("flowsync.showPanel", showPanel), vscode.commands.registerCommand("flowsync.showOutput", async () => {
        const message = buffer.length === 0
            ? "No buffered events."
            : `${buffer.length} buffered events awaiting sync.`;
        void vscode.window.showInformationMessage(message);
    }), vscode.workspace.onDidChangeConfiguration((change) => {
        if (change.affectsConfiguration("flowsync")) {
            reloadConfig();
            openSocket();
        }
    }), { dispose: () => { if (idleTimer)
            clearInterval(idleTimer); } }, { dispose: () => { if (syncTimer)
            clearInterval(syncTimer); } }, { dispose: () => socket?.close() }, { dispose: () => panel?.dispose() });
    void vscode.window.showInformationMessage("FlowSync is capturing activity.");
}
function deactivate() {
    // Subscriptions are disposed by VS Code on deactivate.
}
//# sourceMappingURL=extension.js.map