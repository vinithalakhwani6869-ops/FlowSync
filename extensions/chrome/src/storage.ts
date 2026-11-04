import type { FlowSyncEvent } from "./api/client";

const BUFFER_KEY = "events:buffer";
const VISIT_KEY = "events:visit-count";
const MAX_BUFFER_EVENTS = 1000;
const MAX_VISIT_URLS = 500;

type VisitMap = Record<string, number>;

export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.search = "";
    parsed.hash = "";
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url;
  }
}

async function readBuffer(): Promise<FlowSyncEvent[]> {
  const data = await chrome.storage.local.get(BUFFER_KEY);
  const buffer = data[BUFFER_KEY];
  return Array.isArray(buffer) ? (buffer as FlowSyncEvent[]) : [];
}

async function writeBuffer(buffer: FlowSyncEvent[]): Promise<void> {
  await chrome.storage.local.set({ [BUFFER_KEY]: buffer });
}

export async function pushEvent(event: FlowSyncEvent): Promise<void> {
  const buffer = await readBuffer();
  const sanitized = { ...event };
  if (sanitized.payload && typeof sanitized.payload.url === "string") {
    sanitized.payload = { ...sanitized.payload, url: sanitizeUrl(sanitized.payload.url) };
  }
  buffer.push(sanitized);
  if (buffer.length > MAX_BUFFER_EVENTS) {
    const dropped = buffer.length - MAX_BUFFER_EVENTS;
    buffer.splice(0, dropped);
    console.warn(`[flowsync] Buffer full — dropped ${dropped} oldest event(s)`);
  }
  await writeBuffer(buffer);
}

export async function getBuffer(): Promise<FlowSyncEvent[]> {
  return readBuffer();
}

export async function ackSynced(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const buffer = await readBuffer();
  const remaining = buffer.filter((event) => !ids.includes(event.id));
  if (remaining.length !== buffer.length) {
    await writeBuffer(remaining);
  }
}

async function readVisits(): Promise<VisitMap> {
  const data = await chrome.storage.local.get(VISIT_KEY);
  const map = data[VISIT_KEY] as VisitMap | undefined;
  return map && typeof map === "object" ? map : {};
}

function localDayKey(ts: number): string {
  const date = new Date(ts);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export async function nextVisitCount(url: string, ts: number = Date.now()): Promise<number> {
  const visits = await readVisits();
  const cleanUrl = sanitizeUrl(url);
  // Count per sanitized URL per local calendar day. The day is part of the key
  // so the counter naturally resets at local midnight instead of growing for
  // the lifetime of the extension install.
  const key = `${localDayKey(ts)}::${cleanUrl}`;
  const count = (visits[key] ?? 0) + 1;
  visits[key] = count;

  const keys = Object.keys(visits);
  if (keys.length > MAX_VISIT_URLS) {
    const excess = keys.length - MAX_VISIT_URLS;
    for (const key of keys.slice(0, excess)) {
      delete visits[key];
    }
  }

  await chrome.storage.local.set({ [VISIT_KEY]: visits });
  return count;
}