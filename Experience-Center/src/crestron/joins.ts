import type { AnalogJoin, DigitalJoin, ObjectJoin, SerialJoin } from './types';
import { PRESET_COUNT, SOUND_COUNT, type ModeName } from '../modes';

function b(name: string): DigitalJoin {
  return { type: 'b', name };
}

function n(name: string): AnalogJoin {
  return { type: 'n', name };
}

function s(name: string): SerialJoin {
  return { type: 's', name };
}

function o(name: string): ObjectJoin {
  return { type: 'o', name };
}

/**
 * Name-based CH5 contract.
 * Signal names match contracts/experience-center.cse2j.
 */
export const Joins = {
  mode: {
    systemOn: b('Mode.SystemOn'),
    startup: b('Mode.Startup'),
    shutdown: b('Mode.Shutdown'),
    neutral: b('Mode.Neutral'),
    gallery: b('Mode.Gallery'),
    screening: b('Mode.Screening'),
    presentation: b('Mode.Presentation'),
    roomName: s('Mode.RoomName'),
    status: s('Mode.Status'),
    markFile: s('Mode.MarkFile'),
  },
  powerConfirm: {
    initiate: b('PowerConfirm.Initiate'),
    cancel: b('PowerConfirm.Cancel'),
    confirm: b('PowerConfirm.Confirm'),
    warningPage: b('PowerConfirm.WarningPage'),
    shutdown: b('PowerConfirm.Shutdown'),
    countText: s('PowerConfirm.CountText'),
  },
  lighting: {
    active: n('Lighting.Active'),
    level: n('Lighting.Level'),
    levelRamp: o('Lighting.Level'),
  },
} as const;

export const modeJoin: Record<ModeName, DigitalJoin> = {
  Startup: Joins.mode.startup,
  Shutdown: Joins.mode.shutdown,
  Neutral: Joins.mode.neutral,
  Gallery: Joins.mode.gallery,
  Screening: Joins.mode.screening,
  Presentation: Joins.mode.presentation,
};

export interface PresetJoins {
  name: SerialJoin;
  recall: DigitalJoin;
  save: DigitalJoin;
}

export const presetJoins: PresetJoins[] = Array.from({ length: PRESET_COUNT }, (_, index) => {
  const slot = index + 1;
  return {
    name: s(`Lighting.Preset${slot}Name`),
    recall: b(`Lighting.Preset${slot}Recall`),
    save: b(`Lighting.Preset${slot}Save`),
  };
});

export interface SoundJoins {
  level: AnalogJoin;
  levelRamp: ObjectJoin;
  mute: DigitalJoin;
  name: SerialJoin;
  visible: DigitalJoin;
  enable: DigitalJoin;
}

export const soundJoins: SoundJoins[] = Array.from({ length: SOUND_COUNT }, (_, index) => {
  const slot = index + 1;
  return {
    level: n(`Sound.Level${slot}`),
    levelRamp: o(`Sound.Level${slot}`),
    mute: b(`Sound.Mute${slot}`),
    name: s(`Sound.Name${slot}`),
    visible: b(`Sound.Visible${slot}`),
    enable: b(`Sound.Enable${slot}`),
  };
});
