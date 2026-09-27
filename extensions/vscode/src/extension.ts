import * as vscode from "vscode";
import {
  FlowSyncEvent,
  VscodeEventPayload,
  configureClient,
  connectSocket,
  postEvents,
  SocketHandle,
} from "./api/client";
import { FlowSyncPanel } from "./panel";

const EVENT_TYPES = {
  FILE_OPENED: "file.opened",
  DIAGNOSTIC_ERROR: "diagnostic.error",
  DEVELOPER_STUCK: "developer.stuck",
  CONTEXT_SWITCHING: "context.switching",
  TERMINAL_ERROR: "terminal.error",
} as const;

const DEFAULT_PROJECT = "unknown-workspace";

export function activate(context: vscode.ExtensionContext): void {
  reloadConfig();

  const buffer: FlowSyncEvent[] = [];
  let syncing = false;
  let panel: FlowSyncPanel | undefined;
  let socket: SocketHandle | null = null;
  let syncTimer: ReturnType<typeof setInterval> | null = null;
  let idleTimer: ReturnType<typeof setInterval> | null = null;

  function reloadConfig(): void {
    const config = vscode.workspace.getConfiguration("flowsync");
    configureClient({
      baseUrl: config.get<string>("baseUrl", "http://localhost:8000"),
      authToken: config.get<string>("apiKey", ""),
    });
  }

  function getProject(): string {
    return vscode.workspace.workspaceFolders?.[0]?.name || DEFAULT_PROJECT;
  }

  function push(eventType: string, payload: VscodeEventPayload): void {
    buffer.push({
      type: eventType,
      project: getProject(),
      ts: Date.now(),
      source: "vscode",
      payload,
    });
  }

  async function flush(): Promise<void> {
    if (syncing || buffer.length === 0) return;
    syncing = true;
    try {
      const batch = buffer.splice(0, 100);
      const result = await postEvents(batch);
      if (result.retryable) {
        buffer.unshift(...batch);
      }
    } finally {
      syncing = false;
    }
  }

  function startSyncTimer(): void {
    if (syncTimer) return;
    const config = vscode.workspace.getConfiguration("flowsync");
    const intervalSec = Math.max(5, config.get<number>("syncIntervalSec", 10));
    syncTimer = setInterval(() => {
      void flush();
    }, intervalSec * 1000);
  }

  function openSocket(): void {
    if (socket) return;
    socket = connectSocket(() => {
      // Live frames are intentionally not surfaced in the panel yet.
    });
    const connected = socket !== null;
    panel?.setStatus({
      project: getProject(),
      buffered: buffer.length,
      connected,
    });
  }

  function showPanel(): void {
    if (panel) {
      panel.reveal();
      return;
    }
    panel = new FlowSyncPanel(
      vscode.window.createWebviewPanel(
        "flowsync.panel",
        "FlowSync",
        vscode.ViewColumn.Beside,
        { enableScripts: true },
      ),
      context.extensionUri,
      (msg) => {
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
      },
      () => {
        panel = undefined;
      },
    );
  }

  // --- Editor activity ---
  const switchWindowMs = 30 * 1000;
  const switchThreshold = 3;
  let lastSwitchAt: number | undefined;
  let switchCount = 0;

  vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (!editor) return;
    push(EVENT_TYPES.FILE_OPENED, {
      fileName: vscode.workspace.asRelativePath(editor.document.uri),
      language: editor.document.languageId,
    });
    markActivity();

    const now = Date.now();
    if (lastSwitchAt !== undefined && now - lastSwitchAt < switchWindowMs) {
      switchCount += 1;
    } else {
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
  let stuckSince: number | undefined;

  function markActivity(): void {
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
  const onStartTerminal = (
    vscode.window as unknown as {
      onDidStartTerminalShellExecution?: (
        listener: (event: {
          execution: { commandLine: { value: string } | undefined };
        }) => void,
      ) => vscode.Disposable;
    }
  ).onDidStartTerminalShellExecution;
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
  const errorTracker = new Map<string, { message: string }>();
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
        errorMessage:
          first.message.length > 500
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
  context.subscriptions.push(
    vscode.commands.registerCommand("flowsync.showPanel", showPanel),
    vscode.commands.registerCommand("flowsync.showOutput", async () => {
      const message =
        buffer.length === 0
          ? "No buffered events."
          : `${buffer.length} buffered events awaiting sync.`;
      void vscode.window.showInformationMessage(message);
    }),
    vscode.workspace.onDidChangeConfiguration((change) => {
      if (change.affectsConfiguration("flowsync")) {
        reloadConfig();
        openSocket();
      }
    }),
    { dispose: () => { if (idleTimer) clearInterval(idleTimer); } },
    { dispose: () => { if (syncTimer) clearInterval(syncTimer); } },
    { dispose: () => socket?.close() },
    { dispose: () => panel?.dispose() },
  );

  void vscode.window.showInformationMessage("FlowSync is capturing activity.");
}

export function deactivate(): void {
  // Subscriptions are disposed by VS Code on deactivate.
}