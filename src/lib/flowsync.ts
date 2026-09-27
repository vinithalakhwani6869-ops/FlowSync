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

export async function fetchEvents(limit = 200): Promise<FlowSyncEvent[]> {
  const body = await getJson<{ events: FlowSyncEvent[] }>(`/api/v1/events?limit=${limit}`);
  return body.events;
}

export async function fetchStats(): Promise<FlowSyncStats> {
  return getJson<FlowSyncStats>("/api/v1/events/stats");
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