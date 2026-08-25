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

/** 4-Series processor on the lab LAN. Override with ?host= or VITE_PROCESSOR_HOST. */
export const processorHost =
  firstNonEmpty(queryParam('host'), import.meta.env.VITE_PROCESSOR_HOST) ?? '192.168.86.200';

/**
 * Experimental HTML5 XPanel IP-ID. 0xE1 = 225.
 * Crestron URL params are case-insensitive (`ipId`, `ipID`, `ipid`).
 */
export const ipId = firstNonEmpty(queryParam('ipid', 'ipId'), import.meta.env.VITE_IP_ID) ?? '0xE1';

/**
 * 4-Series WebXPanel auth token from the URL (`authToken` / `authtoken`).
 * Never commit a real token. Omit the property entirely when absent.
 */
export const authToken = queryParam('authtoken', 'authToken');

export const debugEnabled = [...params.keys()].some((key) => key.toLowerCase() === 'debug');
