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

export const processorHost =
  firstNonEmpty(queryParam('host'), import.meta.env.VITE_PROCESSOR_HOST) ?? '192.168.86.200';

/** Hello-World uses E1. This project defaults to E2 so both can sit on the RMC4. */
export const ipId = firstNonEmpty(queryParam('ipid', 'ipId'), import.meta.env.VITE_IP_ID) ?? '0xE2';

export const authToken = queryParam('authtoken', 'authToken');

export const debugEnabled = [...params.keys()].some((key) => key.toLowerCase() === 'debug');
