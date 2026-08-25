const params = new URLSearchParams(window.location.search);

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
  firstNonEmpty(params.get('host'), import.meta.env.VITE_PROCESSOR_HOST) ?? '192.168.86.200';

/** Experimental HTML5 XPanel IP-ID. 0xE1 = 225. Override with ?ipId= or VITE_IP_ID. */
export const ipId = firstNonEmpty(params.get('ipId'), import.meta.env.VITE_IP_ID) ?? '0xE1';

export const debugEnabled = params.has('debug');
