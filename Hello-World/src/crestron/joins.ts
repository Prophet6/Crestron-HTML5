import type { AnalogJoin, DigitalJoin, ObjectJoin, SerialJoin } from './types';

/**
 * Named join map for the AV-room proof of concept.
 *
 * Wire these on the TST-1080 (IP-ID C1) and HTML5 XPanel (IP-ID E1).
 * Signal names are always strings for CrComLib. SIMPL names are in docs/simpl.md.
 */
export const Joins = {
  /** Serial 1 — Room_Name$ */
  roomName: { type: 's', name: '1' } satisfies SerialJoin,

  /** Analog 1 — Press_Source. 0 = off, 1 = laptop, 2 = Apple TV, 3 = HDMI. */
  source: { type: 'n', name: '1' } satisfies AnalogJoin,

  /** Analog 2 — Volume */
  volume: { type: 'n', name: '2' } satisfies AnalogJoin,
  volumeRamp: { type: 'o', name: '2' } satisfies ObjectJoin,
  /** Digital 10 — Volume_Mute / Volume_Mute_FB */
  mute: { type: 'b', name: '10' } satisfies DigitalJoin,
  /** Digital 14 — Volume_Up (repeat digital) */
  volumeUp: { type: 'b', name: '14' } satisfies DigitalJoin,
  /** Digital 15 — Volume_Down (repeat digital) */
  volumeDown: { type: 'b', name: '15' } satisfies DigitalJoin,

  /** Digital 11 — Press_Laptop / Press_Laptop_FB */
  laptop: { type: 'b', name: '11' } satisfies DigitalJoin,
  /** Digital 12 — Press_AppleTV / Press_AppleTV_FB */
  appleTv: { type: 'b', name: '12' } satisfies DigitalJoin,
  /** Digital 13 — Press_HDMI / Press_HDMI_FB */
  hdmi: { type: 'b', name: '13' } satisfies DigitalJoin,

  /** Digital 31 — Lights_On */
  lightsOn: { type: 'b', name: '31' } satisfies DigitalJoin,
  /** Digital 32 — Lights_Dim */
  lightsDim: { type: 'b', name: '32' } satisfies DigitalJoin,
  /** Digital 33 — Lights_Off */
  lightsOff: { type: 'b', name: '33' } satisfies DigitalJoin,
  /** Analog 3 — Lights */
  lightLevel: { type: 'n', name: '3' } satisfies AnalogJoin,
  lightLevelRamp: { type: 'o', name: '3' } satisfies ObjectJoin,

  /** Digital 40 — Press_Off */
  powerOff: { type: 'b', name: '40' } satisfies DigitalJoin,
} as const;

export const Source = {
  Off: 0,
  Laptop: 1,
  AppleTv: 2,
  Hdmi: 3,
} as const;

export type SourceId = (typeof Source)[keyof typeof Source];
