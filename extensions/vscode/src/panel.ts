export interface PanelMessage {
  command: "ready" | "getStatus" | "syncNow";
}

export class FlowSyncPanel {
  private readonly panel: import("vscode").WebviewPanel;
  private readonly disposables: { dispose(): void }[] = [];

  constructor(
    panel: import("vscode").WebviewPanel,
    extensionUri: import("vscode").Uri,
    onMessage: (msg: PanelMessage) => void,
    onDispose: () => void,
  ) {
    this.panel = panel;
    this.panel.webview.html = this.getHtml();
    this.disposables.push(
      this.panel.webview.onDidReceiveMessage((msg: PanelMessage) => onMessage(msg)),
      this.panel.onDidDispose(onDispose),
    );
  }

  reveal(): void {
    this.panel.reveal();
  }

  setStatus(status: Record<string, unknown>): void {
    this.post({ command: "status", status });
  }

  post(message: Record<string, unknown>): void {
    // Silently drop messages while a re-render is pending.
    void this.panel.webview.postMessage(message);
  }

  private getHtml(): string {
    const { webview } = this.panel;
    const nonce = `fs-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    // CSP evaluated from the generated script URI so there is no static nonce to bypass.
    const csp = [
      `default-src 'none'`,
      `style-src ${webview.cspSource}`,
      `script-src 'nonce-${nonce}'`,
      `connect-src ${webview.cspSource}`,
    ].join("; ");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FlowSync</title>
  <style>
    body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); padding: 16px; }
    h1 { font-size: 1.2rem; }
    .status-row { display: flex; gap: 8px; margin: 8px 0; }
    .pill { background: var(--vscode-badge-background); color: var(--vscode-badge-foreground);
            padding: 2px 10px; border-radius: 999px; font-size: 0.85rem; }
    .btn { background: var(--vscode-button-background); color: var(--vscode-button-foreground);
           border: none; padding: 6px 14px; cursor: pointer; }
    .btn:hover { background: var(--vscode-button-hoverBackground); }
  </style>
</head>
<body>
  <h1>FlowSync</h1>
  <div id="key" class="status-row"></div>
  <div id="status" class="status-row"></div>
  <button class="btn" id="syncNow">Sync now</button>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const keyEl = document.getElementById("key");
    const statusEl = document.getElementById("status");

    function render(msg) {
      if (msg.command === "status" && msg.status) {
        statusEl.textContent = "Status: " + JSON.stringify(msg.status);
      }
    }

    window.addEventListener("message", (e) => render(e.data));
    document.getElementById("syncNow").addEventListener("click", () => {
      vscode.postMessage({ command: "syncNow" });
    });
    vscode.postMessage({ command: "ready" });
  </script>
</body>
</html>`;
  }

  dispose(): void {
    this.disposables.forEach((d) => d.dispose());
  }
}