import type { AnalogJoin, DigitalJoin, SerialJoin } from './types';

/**
 * 3-way divisible room. Walls are neighbors only: A–B and B–C.
 * There is no A–C wall. Combining A+C without B is not a legal state.
 */
export const Joins = {
  /** Held FB. 1 = air wall open / rooms combined. Matches core outputs 1–2. */
  wallAB: { type: 'b', name: '1' } satisfies DigitalJoin,
  wallBC: { type: 'b', name: '2' } satisfies DigitalJoin,
  /** Master panel only in the UI. Optional: wire only the master XPanel in SIMPL. */
  combineAll: { type: 'b', name: '7' } satisfies DigitalJoin,
  divideAll: { type: 'b', name: '8' } satisfies DigitalJoin,
  /** Held FB from that panel's Divisible Room Identity instance. */
  masterMode: { type: 'b', name: '13' } satisfies DigitalJoin,
  /** 0 = master, 1 = A, 2 = B, 3 = C */
  roomAssign: { type: 'n', name: '10' } satisfies AnalogJoin,

  nameA: { type: 's', name: '1' } satisfies SerialJoin,
  nameB: { type: 's', name: '2' } satisfies SerialJoin,
  nameC: { type: 's', name: '3' } satisfies SerialJoin,
} as const;

export const RoomJoins = {
  A: {
    source: { type: 'n', name: '21' } satisfies AnalogJoin,
    volume: { type: 'n', name: '22' } satisfies AnalogJoin,
    power: { type: 'b', name: '21' } satisfies DigitalJoin,
    mute: { type: 'b', name: '22' } satisfies DigitalJoin,
    volUp: { type: 'b', name: '23' } satisfies DigitalJoin,
    volDown: { type: 'b', name: '24' } satisfies DigitalJoin,
    laptop: { type: 'b', name: '25' } satisfies DigitalJoin,
    appleTv: { type: 'b', name: '26' } satisfies DigitalJoin,
    hdmi: { type: 'b', name: '27' } satisfies DigitalJoin,
  },
  B: {
    source: { type: 'n', name: '31' } satisfies AnalogJoin,
    volume: { type: 'n', name: '32' } satisfies AnalogJoin,
    power: { type: 'b', name: '31' } satisfies DigitalJoin,
    mute: { type: 'b', name: '32' } satisfies DigitalJoin,
    volUp: { type: 'b', name: '33' } satisfies DigitalJoin,
    volDown: { type: 'b', name: '34' } satisfies DigitalJoin,
    laptop: { type: 'b', name: '35' } satisfies DigitalJoin,
    appleTv: { type: 'b', name: '36' } satisfies DigitalJoin,
    hdmi: { type: 'b', name: '37' } satisfies DigitalJoin,
  },
  C: {
    source: { type: 'n', name: '41' } satisfies AnalogJoin,
    volume: { type: 'n', name: '42' } satisfies AnalogJoin,
    power: { type: 'b', name: '41' } satisfies DigitalJoin,
    mute: { type: 'b', name: '42' } satisfies DigitalJoin,
    volUp: { type: 'b', name: '43' } satisfies DigitalJoin,
    volDown: { type: 'b', name: '44' } satisfies DigitalJoin,
    laptop: { type: 'b', name: '45' } satisfies DigitalJoin,
    appleTv: { type: 'b', name: '46' } satisfies DigitalJoin,
    hdmi: { type: 'b', name: '47' } satisfies DigitalJoin,
  },
} as const;

export const Source = {
  Off: 0,
  Laptop: 1,
  AppleTv: 2,
  Hdmi: 3,
} as const;

export type SourceId = (typeof Source)[keyof typeof Source];
