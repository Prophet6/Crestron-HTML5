import type { PanelId, RoomId } from './rooms';

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

/** Room A = E1, Room B = E2, Room C = E3. */
export const ipId = firstNonEmpty(queryParam('ipid', 'ipId'), import.meta.env.VITE_IP_ID) ?? '0xE1';

export const authToken = queryParam('authtoken', 'authToken');

export const debugEnabled = [...params.keys()].some((key) => key.toLowerCase() === 'debug');

export function roomFromIpId(value: string): RoomId | undefined {
  const hex = Number.parseInt(value.replace(/^0x/i, ''), 16);
  if (hex === 0xe1) {
    return 'A';
  }
  if (hex === 0xe2) {
    return 'B';
  }
  if (hex === 0xe3) {
    return 'C';
  }
  return undefined;
}

export function roomFromAssign(value: number): RoomId | undefined {
  if (value === 1) {
    return 'A';
  }
  if (value === 2) {
    return 'B';
  }
  if (value === 3) {
    return 'C';
  }
  return undefined;
}

/** Vite-only: ?master=1 forces master layout before CIP. */
export const queryMaster = queryParam('master') === '1';

export function panelFromState(masterMode: boolean, home: RoomId): PanelId {
  return masterMode ? 'master' : home;
}
