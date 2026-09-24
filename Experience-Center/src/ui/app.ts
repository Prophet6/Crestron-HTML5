import {
  analogToPercent,
  asDigital,
  isRampControlBlock,
  onIncomingDigital,
  percentToAnalog,
  pulse,
  publishAnalog,
  readDigital,
  subscribeAnalog,
  subscribeDigital,
  subscribeObject,
  subscribeSerial,
} from '../crestron/bridge';
import { debugEnabled, markFileUrl, queryMode, querySystemOn } from '../config';
import { Joins, modeJoin, presetJoins, soundJoins } from '../crestron/joins';
import type { ConnectionState, CrestronRuntime } from '../crestron/init';
import {
  isModeName,
  MODE_NAMES,
  OPERATING_MODES,
  PRESET_HOLD_MS,
  SOUND_COUNT,
  type ModeName,
} from '../modes';
import { startClock } from './clock';

type PageId = 'system' | 'lighting' | 'sound';

interface SoundSlot {
  level: number;
  mute: boolean;
  name: string;
  visible: boolean;
  enable: boolean;
  enableKnown: boolean;
  dragging: boolean;
}

export function mountApp(runtime: CrestronRuntime): void {
  const shell = must('#app');
  const roomName = must('#room-name');
  const statusLine = must('#status-line');
  const systemOff = must('#system-off');
  const systemOn = must('#system-on');
  const countText = must('#count-text');
  const lightLevelInput = must<HTMLInputElement>('#light-level');
  const lightLevelValue = must('#light-level-value');
  const soundRoot = must('#sound-strips');
  const soundEmpty = must('#sound-empty');
  const presetRoot = must('#presets');

  let joinsLive = false;
  let sawModeFeedback = false;
  let systemOnJoin = false;
  let warning = false;
  let shutdownHigh = false;
  let shuttingDown = false;
  let confirmShown = false;
  let confirmFadeTimer = 0;
  let renderQueued = false;
  let lightLevel = 0;
  let lightActive = 0;
  let lightDragging = false;
  let sawSoundVisible = false;
  let page: PageId = 'system';
  const modeHigh: Record<ModeName, boolean> = {
    Startup: false,
    Shutdown: false,
    Neutral: false,
    Gallery: false,
    Screening: false,
    Presentation: false,
  };
  const presetNames = presetJoins.map(() => '');
  const sound: SoundSlot[] = Array.from({ length: SOUND_COUNT }, () => ({
    level: 0,
    mute: false,
    name: '',
    visible: false,
    enable: false,
    enableKnown: false,
    dragging: false,
  }));

  startClock(must('#clock-time'), must('#clock-date'));
  fitStatus(statusLine, '');
  window.addEventListener('resize', () => fitStatus(statusLine, statusLine.dataset.raw ?? ''));

  runtime.setConnectionHandler((state, detail) => {
    const live = state === 'online' || state === 'native';
    const becameLive = live && !joinsLive;
    joinsLive = live;
    setConnection(must('#cip-dot'), must('#cip-label'), state, detail);
    if (becameLive) {
      resyncFromProcessor();
    }
    render();
  });

  buildPresets(presetRoot);
  buildStrips(soundRoot);

  must('#startup').addEventListener('click', () => {
    pulse(Joins.mode.startup);
  });
  must('#shutdown').addEventListener('click', () => {
    if (!systemIsOn()) {
      return;
    }
    pulse(Joins.powerConfirm.initiate);
  });
  must('#confirm-yes').addEventListener('click', () => {
    pulse(Joins.powerConfirm.confirm);
  });
  must('#confirm-no').addEventListener('click', () => {
    pulse(Joins.powerConfirm.cancel);
  });

  document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      const name = button.dataset.mode;
      if (!name || !isModeName(name)) {
        return;
      }
      pulse(modeJoin[name]);
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-nav]').forEach((button) => {
    button.addEventListener('click', () => {
      const next = button.dataset.nav;
      if (next === 'system' || next === 'lighting' || next === 'sound') {
        showPage(next);
      }
    });
  });

  lightLevelInput.addEventListener('pointerdown', () => {
    lightDragging = true;
  });
  lightLevelInput.addEventListener('pointerup', () => {
    lightDragging = false;
  });
  lightLevelInput.addEventListener('pointercancel', () => {
    lightDragging = false;
  });
  lightLevelInput.addEventListener('input', () => {
    lightLevel = Number(lightLevelInput.value);
    lightLevelValue.textContent = `${lightLevel}%`;
    publishAnalog(Joins.lighting.level, percentToAnalog(lightLevel));
  });

  subscribeDigital(Joins.mode.systemOn, (high) => {
    systemOnJoin = high;
    render();
  });
  for (const name of MODE_NAMES) {
    subscribeDigital(modeJoin[name], () => {
      /* Highlight comes from processor feedback only. A press uses this same
         name, and its release would clear a highlight the program is holding. */
    });
  }
  subscribeDigital(Joins.powerConfirm.warningPage, (high) => {
    warning = high;
    render();
  });
  subscribeSerial(Joins.mode.roomName, (value) => {
    roomName.textContent = value.trim() || 'Room Name Here';
  });
  subscribeSerial(Joins.mode.status, (value) => {
    fitStatus(statusLine, value);
  });
  subscribeSerial(Joins.mode.markFile, (value) => {
    applyMark(value);
  });
  onIncomingDigital((name, value) => {
    if (debugEnabled) {
      console.info('digital', name, value);
    }
    applyNamedDigital(name, asDigital(value));
  });
  subscribeDigital(Joins.powerConfirm.shutdown, (high) => {
    noteShutdown(high);
  });
  subscribeSerial(Joins.powerConfirm.countText, (value) => {
    countText.textContent = value;
  });

  subscribeAnalog(Joins.lighting.active, (value) => {
    lightActive = value;
    render();
  });
  subscribeAnalog(Joins.lighting.level, (value) => {
    if (lightDragging) {
      return;
    }
    lightLevel = analogToPercent(value);
    renderLight();
  });
  subscribeObject(Joins.lighting.levelRamp, (value) => {
    if (lightDragging || !isRampControlBlock(value)) {
      return;
    }
    lightLevel = analogToPercent(value.rcb.value);
    renderLight();
  });
  presetJoins.forEach((joins, index) => {
    subscribeSerial(joins.name, (value) => {
      presetNames[index] = value;
      const label = presetRoot.querySelector<HTMLElement>(`[data-preset-label="${index + 1}"]`);
      if (label) {
        label.textContent = value.trim() || `Preset ${index + 1}`;
      }
    });
  });

  soundJoins.forEach((joins, index) => {
    subscribeAnalog(joins.level, (value) => {
      if (sound[index].dragging) {
        return;
      }
      sound[index].level = analogToPercent(value);
      paintStrip(index);
    });
    subscribeObject(joins.levelRamp, (value) => {
      if (sound[index].dragging || !isRampControlBlock(value)) {
        return;
      }
      sound[index].level = analogToPercent(value.rcb.value);
      paintStrip(index);
    });
    subscribeDigital(joins.mute, (high) => {
      sound[index].mute = high;
      paintStrip(index);
    });
    subscribeSerial(joins.name, (value) => {
      sound[index].name = value;
      paintStrip(index);
    });
    subscribeDigital(joins.visible, (high) => {
      sawSoundVisible = true;
      sound[index].visible = high;
      renderSound();
    });
    subscribeDigital(joins.enable, (high) => {
      sound[index].enableKnown = true;
      sound[index].enable = high;
      paintStrip(index);
    });
  });

  render();

  function noteMode(name: ModeName, high: boolean): void {
    if (debugEnabled) {
      console.info('mode', name, high);
    }
    sawModeFeedback = true;
    modeHigh[name] = high;
    render();
  }

  function applyNamedDigital(name: string, high: boolean): void {
    if (name === Joins.mode.systemOn.name) {
      systemOnJoin = high;
      render();
      return;
    }
    if (name === Joins.powerConfirm.warningPage.name) {
      warning = high;
      render();
      return;
    }
    if (name === Joins.powerConfirm.shutdown.name) {
      noteShutdown(high);
      return;
    }
    const mode = MODE_NAMES.find((item) => modeJoin[item].name === name);
    if (mode) {
      noteMode(mode, high);
    }
  }

  function resyncFromProcessor(): void {
    const system = readDigital(Joins.mode.systemOn.name);
    if (system !== undefined) {
      systemOnJoin = system;
    }
    const warn = readDigital(Joins.powerConfirm.warningPage.name);
    if (warn !== undefined) {
      warning = warn;
    }
    for (const name of MODE_NAMES) {
      const value = readDigital(modeJoin[name].name);
      if (value !== undefined) {
        sawModeFeedback = true;
        modeHigh[name] = value;
      }
    }
  }

  function noteShutdown(high: boolean): void {
    if (high && !shutdownHigh) {
      shuttingDown = true;
      pulse(Joins.mode.shutdown);
    }
    shutdownHigh = high;
    render();
  }

  function systemIsOn(): boolean {
    return joinsLive ? systemOnJoin : querySystemOn;
  }

  function modeIsPressed(name: ModeName): boolean {
    if (!joinsLive && !sawModeFeedback) {
      return queryMode.toLowerCase() === name.toLowerCase();
    }
    return modeHigh[name];
  }

  function showPage(next: PageId): void {
    if (next === 'sound' && !systemIsOn()) {
      return;
    }
    page = next;
    render();
  }

  function syncConfirm(): void {
    const confirmEl = must('#page-confirm');
    if (warning) {
      if (confirmFadeTimer) {
        window.clearTimeout(confirmFadeTimer);
        confirmFadeTimer = 0;
      }
      confirmEl.hidden = false;
      confirmEl.classList.add('is-open');
      confirmShown = true;
      return;
    }
    if (!confirmShown) {
      return;
    }
    confirmShown = false;
    confirmEl.classList.remove('is-open');
    confirmFadeTimer = window.setTimeout(() => {
      confirmFadeTimer = 0;
      if (!warning) {
        confirmEl.hidden = true;
      }
    }, 500);
  }

  function render(): void {
    if (renderQueued) {
      return;
    }
    renderQueued = true;
    requestAnimationFrame(paint);
  }

  function paint(): void {
    renderQueued = false;
    const on = systemIsOn();
    const showOff = !on || shuttingDown;
    if (shuttingDown) {
      page = 'system';
    }
    if (!on) {
      shuttingDown = false;
    }

    shell.dataset.system = on ? 'on' : 'off';
    shell.dataset.page = page;

    systemOff.hidden = !showOff;
    systemOn.hidden = showOff;

    document.querySelectorAll<HTMLElement>('[data-page-panel]').forEach((panel) => {
      const id = panel.dataset.pagePanel;
      if (id === 'confirm') {
        return;
      }
      panel.hidden = id !== page;
    });
    syncConfirm();

    for (const name of OPERATING_MODES) {
      const button = document.querySelector<HTMLButtonElement>(`[data-mode="${name}"]`);
      if (!button) {
        continue;
      }
      const pressed = modeIsPressed(name);
      button.classList.toggle('is-pressed', pressed);
      button.setAttribute('aria-pressed', pressed ? 'true' : 'false');
    }

    document.querySelectorAll<HTMLButtonElement>('[data-nav]').forEach((button) => {
      const id = button.dataset.nav;
      button.classList.toggle('is-current', id === page);
      const blocked = (id === 'sound' && !on) || (id === 'shutdown' && !on);
      button.disabled = blocked;
      button.classList.toggle('is-dimmed', blocked);
      button.setAttribute('aria-disabled', blocked ? 'true' : 'false');
    });

    presetRoot.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((button) => {
      const slot = Number(button.dataset.preset);
      button.classList.toggle('is-pressed', joinsLive && lightActive === slot);
    });

    renderLight();
    renderSound();
  }

  function renderLight(): void {
    if (!lightDragging) {
      lightLevelInput.value = String(lightLevel);
    }
    lightLevelValue.textContent = `${lightLevelInput.value}%`;
  }

  function soundIsVisible(index: number): boolean {
    if (!joinsLive || !sawSoundVisible) {
      return true;
    }
    return sound[index].visible;
  }

  function soundIsEnabled(index: number): boolean {
    if (!joinsLive || !sawSoundVisible || !sound[index].enableKnown) {
      return true;
    }
    return sound[index].enable;
  }

  function renderSound(): void {
    let shown = 0;
    for (let index = 0; index < SOUND_COUNT; index += 1) {
      const strip = soundRoot.querySelector<HTMLElement>(`[data-sound="${index + 1}"]`);
      if (!strip) {
        continue;
      }
      const visible = soundIsVisible(index);
      strip.hidden = !visible;
      if (visible) {
        shown += 1;
      }
      paintStrip(index);
    }
    soundEmpty.hidden = shown > 0;
  }

  function paintStrip(index: number): void {
    const strip = soundRoot.querySelector<HTMLElement>(`[data-sound="${index + 1}"]`);
    if (!strip) {
      return;
    }
    const enabled = soundIsEnabled(index);
    const input = strip.querySelector<HTMLInputElement>('input');
    const value = strip.querySelector<HTMLElement>('[data-sound-value]');
    const mute = strip.querySelector<HTMLButtonElement>('[data-sound-mute]');
    const name = strip.querySelector<HTMLElement>('[data-sound-name]');
    strip.classList.toggle('is-disabled', !enabled);
    if (input) {
      input.disabled = !enabled;
      if (!sound[index].dragging) {
        input.value = String(sound[index].level);
      }
      if (value) {
        value.textContent = `${input.value}%`;
      }
    }
    if (mute) {
      mute.disabled = !enabled;
      mute.classList.toggle('is-pressed', sound[index].mute);
      mute.setAttribute('aria-pressed', sound[index].mute ? 'true' : 'false');
    }
    if (name) {
      name.textContent = sound[index].name.trim() || `Level ${index + 1}`;
    }
  }

  function buildPresets(root: HTMLElement): void {
    presetJoins.forEach((_, index) => {
      const slot = index + 1;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn preset';
      button.dataset.preset = String(slot);
      button.innerHTML = `<span class="preset__label" data-preset-label="${slot}">Preset ${slot}</span>`;
      bindPresetHold(button, index);
      button.addEventListener('animationend', () => {
        button.classList.remove('is-saved');
      });
      root.append(button);
    });
  }

  function bindPresetHold(button: HTMLButtonElement, index: number): void {
    let frame = 0;
    let start = 0;
    let down = false;
    let saved = false;

    function finish(event: PointerEvent, recall: boolean): void {
      if (!down) {
        return;
      }
      down = false;
      window.cancelAnimationFrame(frame);
      button.style.setProperty('--hold', '0');
      if (recall && !saved) {
        pulse(presetJoins[index].recall);
      }
      saved = false;
      if (button.hasPointerCapture(event.pointerId)) {
        button.releasePointerCapture(event.pointerId);
      }
    }

    button.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) {
        return;
      }
      event.preventDefault();
      down = true;
      saved = false;
      start = performance.now();
      button.setPointerCapture(event.pointerId);
      const tick = (now: number): void => {
        if (!down) {
          return;
        }
        const progress = Math.min(1, (now - start) / PRESET_HOLD_MS);
        button.style.setProperty('--hold', String(progress));
        if (progress >= 1 && !saved) {
          saved = true;
          pulse(presetJoins[index].save);
          button.classList.remove('is-saved');
          void button.offsetWidth;
          button.classList.add('is-saved');
          return;
        }
        frame = window.requestAnimationFrame(tick);
      };
      frame = window.requestAnimationFrame(tick);
    });
    button.addEventListener('pointerup', (event) => {
      finish(event, true);
    });
    button.addEventListener('pointercancel', (event) => {
      finish(event, false);
    });
    button.addEventListener('contextmenu', (event) => {
      event.preventDefault();
    });
  }

  function buildStrips(root: HTMLElement): void {
    for (let index = 0; index < SOUND_COUNT; index += 1) {
      const slot = index + 1;
      const strip = document.createElement('div');
      strip.className = 'strip';
      strip.dataset.sound = String(slot);
      strip.innerHTML = `
        <input type="range" min="0" max="100" value="0" aria-label="Level ${slot}" />
        <span class="strip__value" data-sound-value>0%</span>
        <button type="button" class="btn strip__mute" data-sound-mute>Mute</button>
        <span class="strip__name" data-sound-name>Level ${slot}</span>
      `;
      const input = strip.querySelector<HTMLInputElement>('input');
      const mute = strip.querySelector<HTMLButtonElement>('[data-sound-mute]');
      input?.addEventListener('pointerdown', () => {
        sound[index].dragging = true;
      });
      input?.addEventListener('pointerup', () => {
        sound[index].dragging = false;
      });
      input?.addEventListener('pointercancel', () => {
        sound[index].dragging = false;
      });
      input?.addEventListener('input', () => {
        if (!soundIsEnabled(index) || !input) {
          return;
        }
        sound[index].level = Number(input.value);
        const value = strip.querySelector<HTMLElement>('[data-sound-value]');
        if (value) {
          value.textContent = `${input.value}%`;
        }
        publishAnalog(soundJoins[index].level, percentToAnalog(sound[index].level));
      });
      mute?.addEventListener('click', () => {
        if (!soundIsEnabled(index)) {
          return;
        }
        pulse(soundJoins[index].mute);
        if (!joinsLive) {
          sound[index].mute = !sound[index].mute;
          paintStrip(index);
        }
      });
      root.append(strip);
    }
  }
}

function applyMark(file: string): void {
  const image = must<HTMLImageElement>('#owner-mark');
  const fallback = must('#mark-fallback');
  const url = markFileUrl(file);
  if (!url) {
    image.hidden = true;
    image.removeAttribute('src');
    fallback.hidden = false;
    return;
  }
  const remote = new Image();
  const stamped = `${url}?v=${Date.now()}`;
  remote.onload = () => {
    image.src = stamped;
    image.hidden = false;
    fallback.hidden = true;
  };
  remote.onerror = () => {
    image.hidden = true;
    fallback.hidden = false;
  };
  remote.src = stamped;
}

const STATUS_MAX_PX = 28;
const STATUS_MIN_PX = 12;
const STATUS_PLACEHOLDER = 'Waiting for a system status update';

function fitStatus(element: HTMLElement, value: string): void {
  const text = value.trim() || STATUS_PLACEHOLDER;
  element.dataset.raw = value;
  element.textContent = text;
  let size = STATUS_MAX_PX;
  element.style.fontSize = `${size}px`;
  if (element.clientWidth === 0) {
    return;
  }
  while (size > STATUS_MIN_PX && element.scrollWidth > element.clientWidth) {
    size -= 1;
    element.style.fontSize = `${size}px`;
  }
}

function setConnection(
  dot: HTMLElement,
  label: HTMLElement,
  state: ConnectionState,
  extra?: string,
): void {
  dot.dataset.state = state;
  const copy: Record<ConnectionState, string> = {
    native: 'Panel',
    connecting: 'Connecting',
    online: 'Online',
    offline: 'Offline',
    error: 'Error',
  };
  label.textContent = extra && state !== 'online' && state !== 'native' && state !== 'connecting' ? extra : copy[state];
}

function must<T extends HTMLElement = HTMLElement>(selector: string): T {
  const node = document.querySelector<T>(selector);
  if (!node) {
    throw new Error(`Missing ${selector}`);
  }
  return node;
}
