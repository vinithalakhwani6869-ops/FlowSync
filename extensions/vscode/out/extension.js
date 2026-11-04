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
// Narrow patterns that indicate a real failure. Normal command echoes (e.g.
// "cd backend") never match these.
const ERROR_PATTERNS = [
    /(?:^|\n)\s*(?:Traceback \(most recent call last\)|npm ERR!|error TS\d+|Error:|ERROR:|FATAL:|Fatal:|Uncaught (?:Error|Exception)|[A-Za-z_]*Error:)/,
    /(?:command not found|is not recognized as an internal or external command|No such file or directory|Permission denied|Cannot find module|ModuleNotFoundError|ImportError|SyntaxError|TypeError|ReferenceError|ENOENT|EACCES)/,
    /(?:^|\n)\s*[A-Za-z_]*Exception(?:[: ]|$)/,
    /\bfailed with exit code\b/i,
];
function redactSecrets(text) {
    return text
        .replace(/\b(Bearer\s+)[A-Za-z0-9._~+/=-]+/gi, "$1[REDACTED]")
        .replace(/\bsk-[A-Za-z0-9_-]{8,}/g, "sk-[REDACTED]")
        .replace(/\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g, "[REDACTED]")
        .replace(/\bgh[pousr]_[A-Za-z0-9]{20,}\b/g, "[REDACTED]")
        .replace(/\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g, "[REDACTED]")
        .replace(/\b(api[_-]?key|secret|token|password|passwd|authorization)\b(\s*[:=]\s*)("[^"]*"|'[^']*'|[^\s,;]+)/gi, (_match, key, separator) => `${key}${separator}[REDACTED]`)
        .replace(/\b[A-Fa-f0-9]{32,}\b/g, "[REDACTED]")
        .replace(/\b[A-Za-z0-9_-]{32,}\b/g, "[REDACTED]");
}
function trimErrorText(text) {
    const redacted = redactSecrets(text).trim();
    if (redacted.length <= 500)
        return redacted;
    return `…${redacted.slice(-500)}`;
}
function commandFailed(exitCode, output) {
    if (typeof exitCode === "number" && exitCode !== 0)
        return true;
    return ERROR_PATTERNS.some((pattern) => pattern.test(output));
}
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
            id: (0, client_1.uuid)(),
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
    const errorTracker = new Map();
    let recentFailure;
    function latestDiagnostic() {
        let latest;
        for (const entry of errorTracker.values()) {
            if (!latest || entry.at > latest.at)
                latest = entry;
        }
        return latest;
    }
    function recordDiagnostics(uri, diagnostics, emit) {
        const key = uri.toString();
        const errors = diagnostics.filter((d) => d.severity === vscode.DiagnosticSeverity.Error);
        if (errors.length === 0) {
            errorTracker.delete(key);
            return;
        }
        const first = errors[0];
        const previous = errorTracker.get(key);
        if (previous?.message === first.message)
            return;
        errorTracker.set(key, {
            message: first.message,
            fileName: vscode.workspace.asRelativePath(uri),
            at: Date.now(),
        });
        if (!emit)
            return;
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
    // Seed the tracker so stuck detection knows about errors already on screen.
    for (const [uri, diagnostics] of vscode.languages.getDiagnostics()) {
        recordDiagnostics(uri, diagnostics, false);
    }
    vscode.languages.onDidChangeDiagnostics((event) => {
        for (const uri of event.uris) {
            recordDiagnostics(uri, vscode.languages.getDiagnostics(uri), true);
        }
    });
    // --- Stuck detection: only focused + real unresolved/failed evidence ---
    const idleThresholdMs = 4 * 60 * 1000;
    const failureWindowMs = 15 * 60 * 1000;
    let lastActivityAt = Date.now();
    let stuckReported = false;
    function markActivity() {
        lastActivityAt = Date.now();
        stuckReported = false;
    }
    function recentFailedCommand(now) {
        return recentFailure && now - recentFailure.at <= failureWindowMs ? recentFailure : undefined;
    }
    idleTimer = setInterval(() => {
        const now = Date.now();
        if (stuckReported)
            return;
        if (now - lastActivityAt < idleThresholdMs)
            return;
        if (!vscode.window.state.focused)
            return;
        const diagnostic = latestDiagnostic();
        const failure = recentFailedCommand(now);
        if (!diagnostic && !failure)
            return;
        // One event per stuck period. The flag only resets on real activity or on
        // regaining window focus, so being away cannot produce a stream of events.
        stuckReported = true;
        const reason = diagnostic?.message ||
            failure?.output ||
            (failure ? `Command failed: ${failure.command}` : "");
        push(EVENT_TYPES.DEVELOPER_STUCK, {
            stuckDuration: now - lastActivityAt,
            errorMessage: reason ? trimErrorText(reason) : undefined,
            fileName: diagnostic?.fileName,
            command: failure?.command,
        });
        void flush();
    }, 15 * 1000);
    vscode.workspace.onDidChangeTextDocument(() => {
        markActivity();
    });
    // Returning from another window/app is not itself "stuck": restart the idle
    // window while focused so only genuine in-editor inactivity counts.
    vscode.window.onDidChangeWindowState((state) => {
        if (state.focused) {
            lastActivityAt = Date.now();
            stuckReported = false;
        }
    });
    // --- Real terminal failures only (shell integration; VS Code 1.88+) ---
    const terminalApi = vscode.window;
    if (terminalApi.onDidEndTerminalShellExecution) {
        const disposable = terminalApi.onDidEndTerminalShellExecution((event) => {
            const command = event.execution.commandLine?.value?.trim() || "unknown";
            const exitCode = event.exitCode;
            markActivity();
            void (async () => {
                let output = "";
                const read = event.execution.read;
                try {
                    if (read) {
                        for await (const chunk of read()) {
                            output += chunk;
                            if (output.length > 20000)
                                output = output.slice(-10000);
                        }
                    }
                }
                catch {
                    // Shell integration may stop streaming when the terminal closes.
                }
                const text = output.trim();
                if (!commandFailed(exitCode, text))
                    return;
                const commandText = redactSecrets(command).slice(0, 300);
                const errorText = trimErrorText(text ||
                    (typeof exitCode === "number"
                        ? `Command exited with code ${exitCode}`
                        : "Command failed"));
                recentFailure = { at: Date.now(), command: commandText, output: errorText };
                push(EVENT_TYPES.TERMINAL_ERROR, {
                    command: commandText,
                    terminalOutput: errorText,
                    errorMessage: errorText,
                    exitCode: typeof exitCode === "number" ? exitCode : undefined,
                });
                void flush();
            })();
        });
        context.subscriptions.push(disposable);
    }
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