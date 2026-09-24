const params = new URLSearchParams(window.location.search);

function queryParam(...names: string[]): string | undefined {
  const lower = new Map<string, string>();
  for (const [key, value] of params.entries()) {
    lower.set(key.toLowerCase(), value);
  }
  for (const name of names) {
    const trimmed = lower.get(name.toLowerCase())?.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return undefined;
}

function firstNonEmpty(...values: Array<string | undefined | null>): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return undefined;
}

/** `C1` and `c1` become `0xC1`. Values that already include `0x` are kept. */
export function normalizeIpId(value: string): string {
  const trimmed = value.trim();
  if (/^0x/i.test(trimmed)) {
    return `0x${trimmed.slice(2).toUpperCase()}`;
  }
  if (/^[0-9a-f]{1,2}$/i.test(trimmed)) {
    return `0x${trimmed.toUpperCase()}`;
  }
  return trimmed;
}

/**
 * Vite is served from this PC, including its LAN address on port 5175.
 * A processor-hosted page is https on 443 (or 80). Only then is the page host the processor.
 */
function processorPageHost(): string | undefined {
  const { hostname, port, protocol } = window.location;
  if (!hostname || /^(localhost|127\.0\.0\.1)$/i.test(hostname)) {
    return undefined;
  }
  if (port === '5173' || port === '5174' || port === '5175') {
    return undefined;
  }
  if (protocol === 'https:' || port === '' || port === '80' || port === '443') {
    return hostname;
  }
  return undefined;
}

export const processorHost =
  firstNonEmpty(queryParam('host'), processorPageHost(), import.meta.env.VITE_PROCESSOR_HOST) ??
  '192.168.86.200';

/** WebXPanel otherwise asks location.origin, which is Vite when the UI is opened from this PC. */
export const tokenUrl = `https://${processorHost}/cws/websocket/getWebSocketToken`;

/** One symbol. The TSW and the browser XPanel both use C1. */
export const ipId = normalizeIpId(
  firstNonEmpty(queryParam('ipid', 'ipId'), import.meta.env.VITE_IP_ID) ?? 'C1',
);

/** Query `authToken` wins. Otherwise the dev server uses VITE_AUTH_TOKEN from .env.development.local. */
export const authToken = firstNonEmpty(queryParam('authtoken', 'authToken'), import.meta.env.VITE_AUTH_TOKEN);

export const debugEnabled = [...params.keys()].some((key) => key.toLowerCase() === 'debug');

/**
 * Offline layout preview. `on` unless `?system=off`.
 * Dropped once CIP is online or the panel is native.
 */
export const querySystemOn = (queryParam('system') ?? 'on').toLowerCase() !== 'off';

/** Offline layout preview. `?mode=Screening` draws that mode pressed until CIP is live. */
export const queryMode = queryParam('mode') ?? '';

/**
 * `Mode.MarkFile` is a filename, optionally inside one folder: `mark1.png` or `Logo/mark2.jpg`.
 * The panel requests `https://<processor>/<that path>`.
 */
export function markFileUrl(file: string): string | undefined {
  const cleaned = file.trim().replace(/^\/+/, '').replace(/\\/g, '/');
  const parts = cleaned.split('/');
  if (!cleaned || parts.some((part) => part === '' || part === '.' || part === '..')) {
    return undefined;
  }
  if (!/^[\w.-]+(?:\/[\w.-]+)*\.(?:png|jpe?g|gif|svg|webp)$/i.test(cleaned)) {
    return undefined;
  }
  return `https://${processorHost}/${cleaned}`;
}
