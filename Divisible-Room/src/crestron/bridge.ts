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
  return lib()?.subscribeState('b', join.name, callback as (value: never) => void);
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
