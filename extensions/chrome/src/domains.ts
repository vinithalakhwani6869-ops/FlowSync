const ALLOWED_KEY = "domains:allowed";
const DEFAULTS_VERSION_KEY = "domains:defaults-version";
const REMOVED_DEFAULTS_KEY = "domains:removed-defaults";

// Bump this whenever DEFAULT_ALLOWED_DOMAINS gains new entries and add the new
// entries to VERSION_ADDITIONS below.
export const DEFAULTS_VERSION = 2;

const V1_DEFAULTS = [
  "github.com",
  "gitlab.com",
  "bitbucket.org",
  "stackoverflow.com",
  "npmjs.com",
  "pypi.org",
  "docs.python.org",
  "developer.mozilla.org",
  "localhost",
  "127.0.0.1",
  "vercel.app",
  "railway.app",
  "supabase.com",
  "tailwindcss.com",
  "reactjs.org",
  "react.dev",
  "nextjs.org",
  "vitejs.dev",
  "fastapi.tiangolo.com",
  "devdocs.io",
  "caniuse.com",
  "regex101.com",
  "codepen.io",
  "codesandbox.io",
  "replit.com",
  "render.com",
  "heroku.com",
  "digitalocean.com",
  "aws.amazon.com",
  "console.cloud.google.com",
  "portal.azure.com",
];

// New in defaults version 2. Only these are merged into existing user lists so
// defaults the user deliberately removed earlier are never re-added.
const V2_ADDITIONS = [
  "leetcode.com",
  "codeforces.com",
  "codechef.com",
  "hackerrank.com",
  "geeksforgeeks.org",
  "kaggle.com",
  "huggingface.co",
  "colab.research.google.com",
];

const VERSION_ADDITIONS: Record<number, string[]> = {
  2: V2_ADDITIONS,
};

export const DEFAULT_ALLOWED_DOMAINS = [...V1_DEFAULTS, ...V2_ADDITIONS];

function normalizeDomain(domain: string): string {
  return domain.trim().toLowerCase().replace(/^\.+/, "").replace(/\/+$/, "");
}

function cleanList(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return value.filter((entry): entry is string => typeof entry === "string").map(normalizeDomain);
}

let migrationPromise: Promise<void> | null = null;

async function migrateDefaults(): Promise<void> {
  const data = await chrome.storage.local.get([
    ALLOWED_KEY,
    DEFAULTS_VERSION_KEY,
    REMOVED_DEFAULTS_KEY,
  ]);
  const stored = cleanList(data[ALLOWED_KEY]);
  const storedVersion = typeof data[DEFAULTS_VERSION_KEY] === "number"
    ? (data[DEFAULTS_VERSION_KEY] as number)
    : 0;
  const removed = cleanList(data[REMOVED_DEFAULTS_KEY]) ?? [];

  // Fresh install: seed the full current list.
  if (stored === null) {
    await chrome.storage.local.set({
      [ALLOWED_KEY]: [...DEFAULT_ALLOWED_DOMAINS],
      [DEFAULTS_VERSION_KEY]: DEFAULTS_VERSION,
    });
    return;
  }

  if (storedVersion >= DEFAULTS_VERSION) return;

  // Existing install (including unversioned/legacy storage): merge only the
  // defaults introduced after the stored version. User additions stay, and
  // defaults the user explicitly removed stay removed.
  const additions: string[] = [];
  for (let version = storedVersion + 1; version <= DEFAULTS_VERSION; version += 1) {
    additions.push(...(VERSION_ADDITIONS[version] ?? []));
  }

  const next = [...stored];
  for (const domain of additions) {
    if (!removed.includes(domain) && !next.includes(domain)) next.push(domain);
  }

  await chrome.storage.local.set({
    [ALLOWED_KEY]: next,
    [DEFAULTS_VERSION_KEY]: DEFAULTS_VERSION,
  });
}

function ensureDomainDefaults(): Promise<void> {
  if (!migrationPromise) {
    migrationPromise = migrateDefaults().catch((error) => {
      // Allow a later call to retry if storage was temporarily unavailable.
      migrationPromise = null;
      throw error;
    });
  }
  return migrationPromise;
}

async function readAllowed(): Promise<string[]> {
  await ensureDomainDefaults();
  const data = await chrome.storage.local.get(ALLOWED_KEY);
  const list = cleanList(data[ALLOWED_KEY]);
  return list ?? [...DEFAULT_ALLOWED_DOMAINS];
}

async function readRemovedDefaults(): Promise<string[]> {
  const data = await chrome.storage.local.get(REMOVED_DEFAULTS_KEY);
  return cleanList(data[REMOVED_DEFAULTS_KEY]) ?? [];
}

export async function getAllowedDomains(): Promise<string[]> {
  return readAllowed();
}

export async function addDomain(domain: string): Promise<string[]> {
  const normalized = normalizeDomain(domain);
  const list = await readAllowed();
  if (normalized && !list.includes(normalized)) {
    list.push(normalized);
    await chrome.storage.local.set({ [ALLOWED_KEY]: list });
  }
  if (DEFAULT_ALLOWED_DOMAINS.includes(normalized)) {
    const removed = await readRemovedDefaults();
    if (removed.includes(normalized)) {
      await chrome.storage.local.set({
        [REMOVED_DEFAULTS_KEY]: removed.filter((entry) => entry !== normalized),
      });
    }
  }
  return list;
}

export async function removeDomain(domain: string): Promise<string[]> {
  const normalized = normalizeDomain(domain);
  const list = await readAllowed();
  const next = list.filter((entry) => entry !== normalized);
  if (next.length !== list.length) {
    await chrome.storage.local.set({ [ALLOWED_KEY]: next });
  }
  if (DEFAULT_ALLOWED_DOMAINS.includes(normalized)) {
    const removed = await readRemovedDefaults();
    if (!removed.includes(normalized)) {
      removed.push(normalized);
      await chrome.storage.local.set({ [REMOVED_DEFAULTS_KEY]: removed });
    }
  }
  return next;
}

export async function resetToDefaults(): Promise<string[]> {
  const defaults = [...DEFAULT_ALLOWED_DOMAINS];
  await chrome.storage.local.set({
    [ALLOWED_KEY]: defaults,
    [DEFAULTS_VERSION_KEY]: DEFAULTS_VERSION,
  });
  await chrome.storage.local.remove(REMOVED_DEFAULTS_KEY);
  return defaults;
}

export async function isDomainAllowed(url: string): Promise<boolean> {
  let hostname: string;
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return false;
  }
  if (!hostname) return false;

  const allowed = await readAllowed();
  return allowed.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
}
