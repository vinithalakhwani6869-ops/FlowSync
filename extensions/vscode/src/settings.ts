import * as vscode from "vscode";
import { fetchSettings } from "./api/client";
import type { FlowSyncSettings } from "./api/client";

const SETTINGS_CACHE_KEY = "flowsync.settings.cache";

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

function normalize(settings: FlowSyncSettings | undefined): FlowSyncSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    capture: { ...DEFAULT_SETTINGS.capture, ...(settings?.capture ?? {}) },
    notifications: { ...DEFAULT_SETTINGS.notifications, ...(settings?.notifications ?? {}) },
    chrome: { ...DEFAULT_SETTINGS.chrome, ...(settings?.chrome ?? {}) },
    vscode: { ...DEFAULT_SETTINGS.vscode, ...(settings?.vscode ?? {}) },
  };
}

export async function getCachedSettings(context: vscode.ExtensionContext): Promise<FlowSyncSettings> {
  return normalize(context.globalState.get<FlowSyncSettings>(SETTINGS_CACHE_KEY));
}

export async function refreshSettings(context: vscode.ExtensionContext): Promise<FlowSyncSettings> {
  try {
    const settings = normalize(await fetchSettings());
    await context.globalState.update(SETTINGS_CACHE_KEY, settings);
    return settings;
  } catch {
    // Keep using the cached copy when the backend is unreachable.
    return getCachedSettings(context);
  }
}
