import { configureClient, postEvents, uuid } from "./api/client";
import type { FlowSyncEvent } from "./api/client";
import { ackSynced, getBuffer, nextVisitCount, pushEvent } from "./storage";

const PROJECT_ID = "default";
const FLUSH_DELAY_MS = 1500;

interface TabState {
  url: string;
  title: string;
  lastSeen: number;
  visitCount: number;
}

const tabs = new Map<number, TabState>();
let lastActiveTabId: number | null = null;
let flushing = false;
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function isTrackableUrl(raw?: string): raw is string {
  if (!raw) return false;
  const url = raw.toLowerCase();
  return url.startsWith("http://") || url.startsWith("https://");
}

async function safeGetTab(tabId: number): Promise<{ url?: string; title?: string } | null> {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab || !tab.url) return null;
    return { url: tab.url, title: tab.title };
  } catch {
    return null;
  }
}

function emitEvent(event: FlowSyncEvent): void {
  void pushEvent(event);
}

async function closeDwell(state: TabState, now: number): Promise<void> {
  const dwellTime = Math.max(0, now - state.lastSeen);
  emitEvent({
    id: uuid(),
    type: "tab.dwell",
    project: PROJECT_ID,
    ts: now,
    source: "chrome",
    payload: {
      url: state.url,
      title: state.title,
      dwellTime,
      visitCount: state.visitCount,
    },
  });
  state.lastSeen = 0;
}

async function ensureTracked(
  tabId: number,
  url: string,
  title: string | undefined,
  now: number,
  emitVisit: boolean,
): Promise<void> {
  const prev = tabs.get(tabId);
  if (prev && prev.lastSeen > 0 && prev.url !== url) {
    await closeDwell(prev, now);
  }

  const visitCount = emitVisit ? await nextVisitCount(url) : prev && prev.url === url ? prev.visitCount : 0;
  const state: TabState = {
    url,
    title: title ?? prev?.title ?? "",
    lastSeen: emitVisit ? now : 0,
    visitCount,
  };
  tabs.set(tabId, state);

  if (emitVisit) {
    emitEvent({
      id: uuid(),
      type: "tab.visit",
      project: PROJECT_ID,
      ts: now,
      source: "chrome",
      payload: {
        url,
        title: state.title,
        visitCount,
      },
    });
  }
}

async function handleActivated(tabId: number): Promise<void> {
  const now = Date.now();

  if (lastActiveTabId !== null && lastActiveTabId !== tabId) {
    const previous = tabs.get(lastActiveTabId);
    if (previous && previous.lastSeen > 0) {
      await closeDwell(previous, now);
    }
  }

  const info = await safeGetTab(tabId);
  if (info && isTrackableUrl(info.url)) {
    const prev = tabs.get(tabId);
    if (!prev || prev.url !== info.url || prev.lastSeen === 0) {
      await ensureTracked(tabId, info.url, info.title, now, true);
    } else {
      prev.lastSeen = now;
    }
  }

  lastActiveTabId = tabId;
  scheduleFlush();
}

async function handleUpdated(tabId: number): Promise<void> {
  const info = await safeGetTab(tabId);
  if (!info || !isTrackableUrl(info.url)) return;

  const now = Date.now();
  const prev = tabs.get(tabId);

  if (!prev || prev.url !== info.url) {
    const emitVisit = tabId === lastActiveTabId;
    await ensureTracked(tabId, info.url, info.title, now, emitVisit);
  } else if (info.title && prev.title !== info.title) {
    prev.title = info.title;
  }

  scheduleFlush();
}

async function flushBuffer(): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    let buffer = await getBuffer();
    let guard = 0;
    while (buffer.length > 0 && guard < 5) {
      guard += 1;
      const { syncedIds, retryable } = await postEvents(buffer);
      await ackSynced(syncedIds);
      if (retryable) break;
      const remaining = buffer.filter((event) => !syncedIds.includes(event.id));
      if (remaining.length === 0 || remaining.length === buffer.length) break;
      buffer = remaining;
    }
  } finally {
    flushing = false;
  }
}

function scheduleFlush(): void {
  if (flushTimer !== null) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushBuffer();
  }, FLUSH_DELAY_MS);
}

async function init(): Promise<void> {
  const data = await chrome.storage.local.get(["config:base-url", "config:auth-token"]);
  const baseUrl = data["config:base-url"];
  const authToken = data["config:auth-token"];
  if (typeof baseUrl === "string" && baseUrl.length > 0) configureClient({ baseUrl });
  if (typeof authToken === "string" && authToken.length > 0) configureClient({ authToken });

  const pending = await getBuffer();
  if (pending.length > 0) void flushBuffer();
}

chrome.tabs.onActivated.addListener(({ tabId }) => {
  void handleActivated(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (!changeInfo.url && changeInfo.status !== "complete") return;
  void handleUpdated(tabId);
});

chrome.runtime.onInstalled.addListener(() => {
  emitEvent({
    id: uuid(),
    type: "session.start",
    project: PROJECT_ID,
    ts: Date.now(),
    source: "chrome",
    payload: {},
  });
});

chrome.runtime.onStartup.addListener(() => {
  void flushBuffer();
});

void init();