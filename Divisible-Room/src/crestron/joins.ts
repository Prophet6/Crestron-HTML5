import type { AnalogJoin, DigitalJoin, SerialJoin } from './types';

/**
 * 3-way divisible room. Walls are neighbors only: A–B and B–C.
 * There is no A–C wall. Combining A+C without B is not a legal state.
 */
export const Joins = {
  combineAB: { type: 'b', name: '1' } satisfies DigitalJoin,
  divideAB: { type: 'b', name: '2' } satisfies DigitalJoin,
  combineBC: { type: 'b', name: '3' } satisfies DigitalJoin,
  divideBC: { type: 'b', name: '4' } satisfies DigitalJoin,
  combineAll: { type: 'b', name: '5' } satisfies DigitalJoin,
  divideAll: { type: 'b', name: '6' } satisfies DigitalJoin,
  /** true = air wall open / rooms combined */
  wallAB: { type: 'b', name: '11' } satisfies DigitalJoin,
  wallBC: { type: 'b', name: '12' } satisfies DigitalJoin,

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
    laptop: { type: 'b', name: '25' } satisfies DigitalJoin,
    appleTv: { type: 'b', name: '26' } satisfies DigitalJoin,
    hdmi: { type: 'b', name: '27' } satisfies DigitalJoin,
  },
  B: {
    source: { type: 'n', name: '31' } satisfies AnalogJoin,
    volume: { type: 'n', name: '32' } satisfies AnalogJoin,
    power: { type: 'b', name: '31' } satisfies DigitalJoin,
    mute: { type: 'b', name: '32' } satisfies DigitalJoin,
    laptop: { type: 'b', name: '35' } satisfies DigitalJoin,
    appleTv: { type: 'b', name: '36' } satisfies DigitalJoin,
    hdmi: { type: 'b', name: '37' } satisfies DigitalJoin,
  },
  C: {
    source: { type: 'n', name: '41' } satisfies AnalogJoin,
    volume: { type: 'n', name: '42' } satisfies AnalogJoin,
    power: { type: 'b', name: '41' } satisfies DigitalJoin,
    mute: { type: 'b', name: '42' } satisfies DigitalJoin,
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
