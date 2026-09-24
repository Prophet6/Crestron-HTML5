export const MODE_NAMES = ['Startup', 'Shutdown', 'Neutral', 'Gallery', 'Screening', 'Presentation'] as const;

export type ModeName = (typeof MODE_NAMES)[number];

/** Large selections on the System page while the system is on. */
export const OPERATING_MODES = ['Neutral', 'Gallery', 'Screening', 'Presentation'] as const;

export type OperatingMode = (typeof OPERATING_MODES)[number];

export const PRESET_COUNT = 6;
export const SOUND_COUNT = 6;

/** Press-and-hold on a lighting preset sends Save. */
export const PRESET_HOLD_MS = 2500;

export function isModeName(value: string): value is ModeName {
  return (MODE_NAMES as readonly string[]).includes(value);
}
