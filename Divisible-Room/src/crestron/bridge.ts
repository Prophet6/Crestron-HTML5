import type {
  AnalogJoin,
  CrComLibApi,
  DigitalJoin,
  Join,
  ObjectJoin,
  RampControlBlock,
  SerialJoin,
} from './types';

function lib(): CrComLibApi | undefined {
  return window.CrComLib;
}

type IncomingDigital = (name: string, value: boolean) => void;
const incomingDigitalHandlers: IncomingDigital[] = [];
let bridgeHooked = false;

function hookIncomingBooleans(): void {
  const api = lib();
  if (!api?.bridgeReceiveBooleanFromNative || bridgeHooked) {
    return;
  }
  const original = api.bridgeReceiveBooleanFromNative.bind(api);
  const wrapped = (name: string, value: boolean) => {
    original(name, value);
    const open = Boolean(value);
    for (const handler of incomingDigitalHandlers) {
      handler(String(name), open);
    }
  };
  api.bridgeReceiveBooleanFromNative = wrapped;
  window.bridgeReceiveBooleanFromNative = wrapped;
  bridgeHooked = true;
}

export function ensureIncomingDigitalHook(): void {
  hookIncomingBooleans();
}

export function onIncomingDigital(handler: IncomingDigital): void {
  hookIncomingBooleans();
  incomingDigitalHandlers.push(handler);
}

export function readDigital(name: string): boolean | undefined {
  const api = lib();
  if (!api) {
    return undefined;
  }
  if (typeof api.getBooleanSignalValue === 'function') {
    const value = api.getBooleanSignalValue(name);
    if (value !== null && value !== undefined) {
      return Boolean(value);
    }
  }
  if (typeof api.getState === 'function') {
    const value = api.getState('b', name);
    if (value !== null && value !== undefined) {
      return Boolean(value);
    }
  }
  return undefined;
}

export function publishDigital(join: DigitalJoin, value: boolean): void {
  lib()?.publishEvent('b', join.name, value);
}

export function pulse(join: DigitalJoin): void {
  publishDigital(join, true);
  publishDigital(join, false);
}

export function publishAnalog(join: AnalogJoin, value: number): void {
  lib()?.publishEvent('n', join.name, value);
}

export function subscribeDigital(join: DigitalJoin, callback: (value: boolean) => void): string | undefined {
  hookIncomingBooleans();
  const api = lib();
  if (!api) {
    return undefined;
  }
  const wrapped = (value: never) => {
    callback(Boolean(value));
  };
  api.subscribeState('b', join.name, wrapped);
  try {
    api.subscribeState('boolean', join.name, wrapped);
  } catch {
    /* older CrComLib only accepts 'b' */
  }
  return join.name;
}

export function subscribeDigitalName(name: string, callback: (value: boolean) => void): void {
  hookIncomingBooleans();
  lib()?.subscribeState('b', name, ((value: never) => {
    callback(Boolean(value));
  }) as (value: never) => void);
}

export function subscribeAnalog(join: AnalogJoin, callback: (value: number) => void): string | undefined {
  return lib()?.subscribeState('n', join.name, callback as (value: never) => void);
}

export function subscribeSerial(join: SerialJoin, callback: (value: string) => void): string | undefined {
  return lib()?.subscribeState('s', join.name, callback as (value: never) => void);
}

export function subscribeObject(join: ObjectJoin, callback: (value: unknown) => void): string | undefined {
  return lib()?.subscribeState('o', join.name, callback as (value: never) => void);
}

export function unsubscribe(join: Join, subscriptionId: string): void {
  lib()?.unsubscribeState(join.type, join.name, subscriptionId);
}

export function startRepeatDigital(join: DigitalJoin): () => void {
  const api = lib();
  if (!api) {
    return () => undefined;
  }
  api.publishEvent('o', join.name, { repeatdigital: true });
  const interval = window.setInterval(() => {
    api.publishEvent('o', join.name, { repeatdigital: true });
  }, 250);

  return () => {
    window.clearInterval(interval);
    api.publishEvent('o', join.name, { repeatdigital: false });
  };
}

export function isRampControlBlock(value: unknown): value is RampControlBlock {
  return Boolean(value && typeof value === 'object' && 'rcb' in value);
}

export function analogToPercent(value: number): number {
  return Math.round((clamp(value, 0, 65535) / 65535) * 100);
}

export function percentToAnalog(percent: number): number {
  return Math.round((clamp(percent, 0, 100) / 100) * 65535);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
