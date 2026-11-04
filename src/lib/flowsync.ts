export interface FlowSyncEvent {
  id: string;
  type: string;
  project: string;
  ts: number;
  source: string;
  payload: {
    url?: string;
    title?: string;
    dwellTime?: number;
    visitCount?: number;
    fileName?: string;
    language?: string;
    errorMessage?: string;
    terminalOutput?: string;
    command?: string;
    exitCode?: number;
    stuckDuration?: number;
    switchCount?: number;
    severity?: string;
  };
}

export interface FlowSyncStats {
  totalEvents: number;
  todayEvents: number;
  dwellMs: number;
  byType: Record<string, number>;
  bySource: Record<string, number>;
  projects: Record<string, number>;
  distinctUrls: number;
  firstTs: number | null;
  lastTs: number | null;
}

export interface FlowSyncSettings {
  capture: {
    paused: boolean;
    autoCaptureErrors: boolean;
    terminalCommands: boolean;
    browserTabs: boolean;
    personalNotes: boolean;
    idleGapMinutes: number;
  };
  notifications: {
    errorToasts: boolean;
  };
  chrome: {
    allowedDomains: string[];
  };
  vscode: {
    stuckThresholdMinutes: number;
    redactSecrets: boolean;
    syncIntervalSec: number;
  };
}

export type SettingsPatch = {
  [K in keyof FlowSyncSettings]?: Partial<FlowSyncSettings[K]>;
};

export interface FlowSyncMeta {
  retentionDays: number;
}

export interface FlowSyncExport {
  exportedAt: number;
  events: FlowSyncEvent[];
}

interface WsInitMessage {
  type: "init";
  events: FlowSyncEvent[];
}

interface WsEventMessage {
  type: "event";
  event: FlowSyncEvent;
}

type WsMessage = WsInitMessage | WsEventMessage;

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`GET ${path} failed: HTTP ${response.status}`);
  return (await response.json()) as T;
}

export async function fetchEvents(
  limit = 200,
  range?: { from?: number; to?: number },
): Promise<FlowSyncEvent[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (range?.from !== undefined) params.set("from", String(Math.floor(range.from)));
  if (range?.to !== undefined) params.set("to", String(Math.floor(range.to)));
  const body = await getJson<{ events: FlowSyncEvent[] }>(`/api/v1/events?${params.toString()}`);
  return body.events;
}

export async function fetchStats(): Promise<FlowSyncStats> {
  return getJson<FlowSyncStats>("/api/v1/events/stats");
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    accept: "application/json",
    "content-type": "application/json",
  };
  const key = getApiKey();
  if (key) headers.authorization = `Bearer ${key}`;
  return headers;
}

async function authJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, headers: authHeaders() });
  if (!response.ok) {
    throw new Error(`${init?.method ?? "GET"} ${path} failed: HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function fetchSettings(): Promise<FlowSyncSettings> {
  return authJson<FlowSyncSettings>("/api/v1/settings");
}

export async function updateSettings(patch: SettingsPatch): Promise<FlowSyncSettings> {
  return authJson<FlowSyncSettings>("/api/v1/settings", {
    method: "PUT",
    body: JSON.stringify(patch),
  });
}

export async function fetchMeta(): Promise<FlowSyncMeta> {
  return authJson<FlowSyncMeta>("/api/v1/meta");
}

export async function exportData(): Promise<FlowSyncExport> {
  return authJson<FlowSyncExport>("/api/v1/export");
}

export async function deleteAllData(): Promise<number> {
  const body = await authJson<{ deleted: number }>("/api/v1/data", { method: "DELETE" });
  return body.deleted;
}

export function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export interface LiveEventsHandle {
  close: () => void;
}

export type LiveConnectionStatus = "connecting" | "live" | "reconnecting" | "no-key";

const RECONNECT_MS = 3000;

// The web app authenticates to the backend WebSocket with the same API key the
// Chrome extension uses (FLOWSYNC_API_KEY in backend/.env). Live Capture connects
// only once a key is present — set it in the browser before opening the app:
//   localStorage.setItem("flowsync:api-key", "<your api key>")
const API_KEY_STORAGE_KEY = "flowsync:api-key";

function getApiKey(): string {
  try {
    const stored = window.localStorage.getItem(API_KEY_STORAGE_KEY);
    if (stored && stored.trim().length > 0) return stored.trim();
  } catch {
    // localStorage unavailable — treated as no key
  }
  return "";
}

export function connectEvents(
  onInit: (events: FlowSyncEvent[]) => void,
  onEvent: (event: FlowSyncEvent) => void,
  onStatus: (status: LiveConnectionStatus) => void,
): LiveEventsHandle {
  const scheme = window.location.protocol === "https:" ? "wss" : "ws";
  const url = () => `${scheme}://${window.location.host}/ws/events?token=${encodeURIComponent(getApiKey())}`;

  let socket: WebSocket | null = null;
  let closed = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  // Without an API key the server rejects every handshake (403), so do not even
  // attempt to connect — surface the missing-key state instead of spamming the
  // console and flipping the UI between Live and Reconnecting forever.
  if (!getApiKey()) {
    onStatus("no-key");
    return {
      close(): void {
        closed = true;
      },
    };
  }

  const scheduleReconnect = (): void => {
    if (closed) return;
    onStatus("reconnecting");
    reconnectTimer = setTimeout(open, RECONNECT_MS);
  };

  const open = (): void => {
    if (closed) return;
    try {
      socket = new WebSocket(url());
    } catch {
      scheduleReconnect();
      return;
    }

    socket.onopen = () => onStatus("live");

    socket.onmessage = (message) => {
      let parsed: WsMessage | null = null;
      try {
        parsed = JSON.parse(message.data as string) as WsMessage;
      } catch {
        return;
      }
      if (parsed.type === "init") onInit(parsed.events);
      else if (parsed.type === "event") onEvent(parsed.event);
    };

    socket.onclose = () => {
      if (!closed) scheduleReconnect();
    };

    socket.onerror = () => {
      try {
        socket?.close();
      } catch {
        // close handler drives reconnect
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
        // ignore
      }
    },
  };
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-GB", { hour12: false });
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export function formatHours(ms: number): string {
  return (ms / 3_600_000).toFixed(1);
}

export function formatIdle(ms: number): string {
  const totalMinutes = Math.max(1, Math.round(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export function formatRelative(ts: number): string {
  const diffMs = Date.now() - ts;
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}