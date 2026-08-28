import type { AnalogJoin, DigitalJoin, SerialJoin } from './types';

function b(name: string): DigitalJoin {
  return { type: 'b', name };
}

function n(name: string): AnalogJoin {
  return { type: 'n', name };
}

function s(name: string): SerialJoin {
  return { type: 's', name };
}

/**
 * Name-based CH5 contract (DivisibleRoom). Signal names match
 * contracts/divisible-room.cse2j. Numbered joins are not used.
 */
export const Joins = {
  wallAB: b('Walls.ABOpen'),
  wallBC: b('Walls.BCOpen'),
  wallABEnable: b('Walls.ABEnable'),
  wallBCEnable: b('Walls.BCEnable'),
  combineAll: b('Walls.CombineAll'),
  divideAll: b('Walls.DivideAll'),
  wallABToggle: b('Walls.ABToggle'),
  wallBCToggle: b('Walls.BCToggle'),
  masterMode: b('Identity.MasterMode'),
  roomAssign: n('Identity.RoomAssign'),
  nameA: s('RoomA.Name'),
  nameB: s('RoomB.Name'),
  nameC: s('RoomC.Name'),
  powerConfirm: {
    initiate: b('PowerConfirm.Initiate'),
    cancel: b('PowerConfirm.Cancel'),
    confirm: b('PowerConfirm.Confirm'),
    warningPage: b('PowerConfirm.WarningPage'),
    shutdown: b('PowerConfirm.Shutdown'),
    countSerial: s('PowerConfirm.CountText'),
    countAnalog: n('PowerConfirm.Count'),
  },
} as const;

export const RoomJoins = {
  A: {
    source: n('RoomA.Source'),
    volume: n('RoomA.Volume'),
    power: b('RoomA.Power'),
    mute: b('RoomA.Mute'),
    volUp: b('RoomA.VolUp'),
    volDown: b('RoomA.VolDown'),
    laptop: b('RoomA.Laptop'),
    appleTv: b('RoomA.AppleTv'),
    hdmi: b('RoomA.Hdmi'),
  },
  B: {
    source: n('RoomB.Source'),
    volume: n('RoomB.Volume'),
    power: b('RoomB.Power'),
    mute: b('RoomB.Mute'),
    volUp: b('RoomB.VolUp'),
    volDown: b('RoomB.VolDown'),
    laptop: b('RoomB.Laptop'),
    appleTv: b('RoomB.AppleTv'),
    hdmi: b('RoomB.Hdmi'),
  },
  C: {
    source: n('RoomC.Source'),
    volume: n('RoomC.Volume'),
    power: b('RoomC.Power'),
    mute: b('RoomC.Mute'),
    volUp: b('RoomC.VolUp'),
    volDown: b('RoomC.VolDown'),
    laptop: b('RoomC.Laptop'),
    appleTv: b('RoomC.AppleTv'),
    hdmi: b('RoomC.Hdmi'),
  },
} as const;

export const Source = {
  Off: 0,
  Laptop: 1,
  AppleTv: 2,
  Hdmi: 3,
} as const;

export type SourceId = (typeof Source)[keyof typeof Source];
