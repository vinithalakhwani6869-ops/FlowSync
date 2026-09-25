const ALLOWED_KEY = "domains:allowed";

export const DEFAULT_ALLOWED_DOMAINS = [
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

function normalizeDomain(domain: string): string {
  return domain.trim().toLowerCase().replace(/^\.+/, "").replace(/\/+$/, "");
}

async function readAllowed(): Promise<string[]> {
  const data = await chrome.storage.local.get(ALLOWED_KEY);
  const list = data[ALLOWED_KEY];
  if (Array.isArray(list)) {
    const cleaned = list.filter((entry): entry is string => typeof entry === "string").map(normalizeDomain);
    return cleaned.length > 0 ? cleaned : [...DEFAULT_ALLOWED_DOMAINS];
  }
  return [...DEFAULT_ALLOWED_DOMAINS];
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
  return list;
}

export async function removeDomain(domain: string): Promise<string[]> {
  const normalized = normalizeDomain(domain);
  const list = await readAllowed();
  const next = list.filter((entry) => entry !== normalized);
  if (next.length !== list.length) {
    await chrome.storage.local.set({ [ALLOWED_KEY]: next });
  }
  return next;
}

export async function resetToDefaults(): Promise<string[]> {
  const defaults = [...DEFAULT_ALLOWED_DOMAINS];
  await chrome.storage.local.set({ [ALLOWED_KEY]: defaults });
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