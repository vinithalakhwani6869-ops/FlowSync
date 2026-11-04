"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SETTINGS = void 0;
exports.getCachedSettings = getCachedSettings;
exports.refreshSettings = refreshSettings;
const client_1 = require("./api/client");
const SETTINGS_CACHE_KEY = "flowsync.settings.cache";
// Fallbacks are used only when neither the backend nor a cached copy is
// available. They match the backend defaults.
exports.DEFAULT_SETTINGS = {
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
function normalize(settings) {
    return {
        ...exports.DEFAULT_SETTINGS,
        ...settings,
        capture: { ...exports.DEFAULT_SETTINGS.capture, ...(settings?.capture ?? {}) },
        notifications: { ...exports.DEFAULT_SETTINGS.notifications, ...(settings?.notifications ?? {}) },
        chrome: { ...exports.DEFAULT_SETTINGS.chrome, ...(settings?.chrome ?? {}) },
        vscode: { ...exports.DEFAULT_SETTINGS.vscode, ...(settings?.vscode ?? {}) },
    };
}
async function getCachedSettings(context) {
    return normalize(context.globalState.get(SETTINGS_CACHE_KEY));
}
async function refreshSettings(context) {
    try {
        const settings = normalize(await (0, client_1.fetchSettings)());
        await context.globalState.update(SETTINGS_CACHE_KEY, settings);
        return settings;
    }
    catch {
        // Keep using the cached copy when the backend is unreachable.
        return getCachedSettings(context);
    }
}
//# sourceMappingURL=settings.js.map