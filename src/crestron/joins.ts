import type { AnalogJoin, DigitalJoin, ObjectJoin, SerialJoin } from './types';

/**
 * Named join map for the AV-room proof of concept.
 *
 * Wire these on an HTML5 TST-1080 / HTML5 Web XPanel symbol at IP-ID 0xE1.
 * Signal names are always strings for CrComLib.
 */
export const Joins = {
  roomName: { type: 's', name: '1' } satisfies SerialJoin,

  /** 0 = off / welcome, 1 = laptop, 2 = Apple TV, 3 = HDMI. */
  source: { type: 'n', name: '1' } satisfies AnalogJoin,

  volume: { type: 'n', name: '2' } satisfies AnalogJoin,
  volumeRamp: { type: 'o', name: '2' } satisfies ObjectJoin,
  mute: { type: 'b', name: '10' } satisfies DigitalJoin,
  volumeUp: { type: 'b', name: '14' } satisfies DigitalJoin,
  volumeDown: { type: 'b', name: '15' } satisfies DigitalJoin,

  laptop: { type: 'b', name: '11' } satisfies DigitalJoin,
  appleTv: { type: 'b', name: '12' } satisfies DigitalJoin,
  hdmi: { type: 'b', name: '13' } satisfies DigitalJoin,

  lightsOn: { type: 'b', name: '31' } satisfies DigitalJoin,
  lightsDim: { type: 'b', name: '32' } satisfies DigitalJoin,
  lightsOff: { type: 'b', name: '33' } satisfies DigitalJoin,
  lightLevel: { type: 'n', name: '3' } satisfies AnalogJoin,
  lightLevelRamp: { type: 'o', name: '3' } satisfies ObjectJoin,

  powerOff: { type: 'b', name: '40' } satisfies DigitalJoin,
} as const;

export const Source = {
  Off: 0,
  Laptop: 1,
  AppleTv: 2,
  Hdmi: 3,
} as const;

export type SourceId = (typeof Source)[keyof typeof Source];
