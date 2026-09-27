export interface VscodeEventPayload {
  fileName?: string;
  language?: string;
  errorMessage?: string;
  terminalOutput?: string;
  stuckDuration?: number;
  switchCount?: number;
  severity?: string;
}

export interface FlowSyncEvent {
  type: string;
  project: string;
  ts: number;
  source: "vscode";
  payload: VscodeEventPayload;
}

export interface ClientConfig {
  baseUrl?: string;
  authToken?: string;
}

export interface SyncResult {
  syncedIds: string[];
  retryable: boolean;
}

const EVENT_PATH = "/api/v1/events";
const MAX_ATTEMPTS = 5;
const BASE_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 15000;
const REQUEST_TIMEOUT_MS = 8000;

let config: Required<ClientConfig> = {
  baseUrl: "http://localhost:8000",
  authToken: "",
};

export function configureClient(next: ClientConfig): void {
  config = { ...config, ...next };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function postEvents(events: FlowSyncEvent[]): Promise<SyncResult> {
  if (events.length === 0) return { syncedIds: [], retryable: false };

  if (!config.authToken) {
    console.warn(
      "[flowsync] No API key configured — skipping sync. " +
        "Set the 'flowsync.apiKey' setting before events can be sent.",
    );
    return { syncedIds: [], retryable: false };
  }

  for (let attempt = 0; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const headers: Record<string, string> = { "content-type": "application/json" };
      if (config.authToken) headers.authorization = `Bearer ${config.authToken}`;

      const response = await fetchWithTimeout(
        `${config.baseUrl}${EVENT_PATH}`,
        { method: "POST", headers, body: JSON.stringify({ events }) },
        REQUEST_TIMEOUT_MS,
      );

      if (response.status >= 200 && response.status < 300) {
        const body = (await response.json().catch(() => null)) as { accepted?: string[] } | null;
        const accepted = body && Array.isArray(body.accepted) ? body.accepted : [];
        return { syncedIds: accepted, retryable: false };
      }

      if (response.status >= 400 && response.status < 500) {
        console.warn(`[flowsync] Events rejected (HTTP ${response.status}) — keeping buffer`);
        return { syncedIds: [], retryable: false };
      }

      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      console.warn(`[flowsync] Sync attempt ${attempt + 1}/${MAX_ATTEMPTS + 1} failed: ${String(error)}`);
      if (attempt < MAX_ATTEMPTS) {
        await sleep(Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * 2 ** attempt));
      }
    }
  }

  return { syncedIds: [], retryable: true };
}

export function connectSocket(onMessage?: (event: unknown) => void): SocketHandle | null {
  if (!config.authToken) {
    console.warn("[flowsync] WebSocket skipped — no auth token configured");
    return null;
  }

  const wsBase = config.baseUrl.replace(/^http/, "ws");
  const url = `${wsBase}/ws/events?token=${encodeURIComponent(config.authToken)}`;

  let socket: WebSocket | null = null;
  let closed = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  const scheduleReconnect = (): void => {
    if (closed) return;
    reconnectTimer = setTimeout(open, 5000);
  };

  const open = (): void => {
    if (closed) return;
    try {
      socket = new WebSocket(url);
    } catch (error) {
      console.warn(`[flowsync] WebSocket failed to open: ${String(error)}`);
      scheduleReconnect();
      return;
    }

    socket.onmessage = (message) => {
      try {
        onMessage?.(JSON.parse(message.data as string));
      } catch {
        // Ignore malformed frames.
      }
    };

    socket.onclose = () => {
      if (!closed) scheduleReconnect();
    };

    socket.onerror = () => {
      try {
        socket?.close();
      } catch {
        // Ignore — close handler drives the reconnect.
      }
    };
  };

  open();

  return {
    close(): void {
      closed = true;
      if (reconnectTimer !== null) clearTimeout(reconnectTimer);
      try {
        socket?.close();
      } catch {
        // Ignore.
      }
    },
  };
}

export interface SocketHandle {
  close: () => void;
}