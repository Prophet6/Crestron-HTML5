import type { PanelId } from './rooms';

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

function parsePanel(): PanelId {
  const raw = (queryParam('panel', 'room') ?? 'master').toUpperCase();
  if (raw === 'A' || raw === 'B' || raw === 'C') {
    return raw;
  }
  return 'master';
}

export const panelId: PanelId = parsePanel();

const defaultIpId: Record<PanelId, string> = {
  master: '0xE2',
  A: '0xE3',
  B: '0xE4',
  C: '0xE5',
};

export const processorHost =
  firstNonEmpty(queryParam('host'), import.meta.env.VITE_PROCESSOR_HOST) ?? '192.168.86.200';

/** Master E2, room panels E3–E5. Override with ?ipId=. */
export const ipId =
  firstNonEmpty(queryParam('ipid', 'ipId'), import.meta.env.VITE_IP_ID) ?? defaultIpId[panelId];

export const authToken = queryParam('authtoken', 'authToken');

export const debugEnabled = [...params.keys()].some((key) => key.toLowerCase() === 'debug');
