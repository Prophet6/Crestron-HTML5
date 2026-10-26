export const MODE_NAMES = ['Startup', 'Shutdown', 'Neutral', 'Gallery', 'Screening', 'Presentation'] as const;

export type ModeName = (typeof MODE_NAMES)[number];

/** Large selections on the System page while the system is on. */
export const OPERATING_MODES = ['Neutral', 'Gallery', 'Screening', 'Presentation'] as const;

export type OperatingMode = (typeof OPERATING_MODES)[number];

export const PRESET_COUNT = 6;
export const SOUND_COUNT = 6;

/** Quiet time before the save gauge appears. */
export const PRESET_HOLD_DELAY_MS = 1000;

/** Gauge travel after the delay. The blink happens when this finishes (2.5s). */
export const PRESET_HOLD_GAUGE_MS = 1500;

export function isModeName(value: string): value is ModeName {
  return (MODE_NAMES as readonly string[]).includes(value);
}
