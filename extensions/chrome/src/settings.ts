import { fetchSettings } from "./api/client";
import type { FlowSyncSettings } from "./api/client";
import { setAllowedDomains } from "./domains";

const SETTINGS_CACHE_KEY = "settings:cache";

// Fallbacks are used only when neither the backend nor a cached copy is
// available. They match the backend defaults.
export const DEFAULT_SETTINGS: FlowSyncSettings = {
  capture: {
    paused: false,
    autoCaptureErrors: true,
    terminalCommands: true,
    browserTabs: true,
    personalNotes: false,
    idleGapMinutes: 15,
  },
  notifications: {
    errorToasts: true,
  },
  chrome: {
    allowedDomains: [],
  },
  vscode: {
    stuckThresholdMinutes: 4,
    redactSecrets: true,
    syncIntervalSec: 10,
  },
};

interface SettingsCache {
  settings: FlowSyncSettings;
  fetchedAt: number;
}

let cached: FlowSyncSettings | null = null;

function normalize(settings: FlowSyncSettings | null | undefined): FlowSyncSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    capture: { ...DEFAULT_SETTINGS.capture, ...(settings?.capture ?? {}) },
    notifications: { ...DEFAULT_SETTINGS.notifications, ...(settings?.notifications ?? {}) },
    chrome: { ...DEFAULT_SETTINGS.chrome, ...(settings?.chrome ?? {}) },
    vscode: { ...DEFAULT_SETTINGS.vscode, ...(settings?.vscode ?? {}) },
  };
}

async function readCache(): Promise<SettingsCache | null> {
  const data = await chrome.storage.local.get(SETTINGS_CACHE_KEY);
  const value = data[SETTINGS_CACHE_KEY] as SettingsCache | undefined;
  if (!value || typeof value !== "object" || !value.settings) return null;
  return {
    settings: normalize(value.settings),
    fetchedAt: typeof value.fetchedAt === "number" ? value.fetchedAt : 0,
  };
}

export async function getCachedSettings(): Promise<FlowSyncSettings> {
  if (cached) return cached;
  const stored = await readCache();
  cached = stored?.settings ?? DEFAULT_SETTINGS;
  return cached;
}

export async function refreshSettings(): Promise<FlowSyncSettings> {
  try {
    const settings = normalize(await fetchSettings());
    cached = settings;
    await chrome.storage.local.set({
      [SETTINGS_CACHE_KEY]: { settings, fetchedAt: Date.now() },
    });
    if (Array.isArray(settings.chrome.allowedDomains) && settings.chrome.allowedDomains.length > 0) {
      await setAllowedDomains(settings.chrome.allowedDomains);
    }
    return settings;
  } catch {
    // Keep using the cached copy when the backend is unreachable.
    return getCachedSettings();
  }
}
