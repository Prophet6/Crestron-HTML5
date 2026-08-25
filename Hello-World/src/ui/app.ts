import {
  analogToPercent,
  isRampControlBlock,
  percentToAnalog,
  pulse,
  publishAnalog,
  startRepeatDigital,
  subscribeAnalog,
  subscribeDigital,
  subscribeObject,
  subscribeSerial,
} from '../crestron/bridge';
import { Joins, Source, type SourceId } from '../crestron/joins';
import type { ConnectionState, CrestronRuntime } from '../crestron/init';
import { startClock } from './clock';

const CARD_BY_SOURCE: Record<SourceId, string> = {
  [Source.Off]: 'card-welcome',
  [Source.Laptop]: 'card-laptop',
  [Source.AppleTv]: 'card-appletv',
  [Source.Hdmi]: 'card-hdmi',
};

export function mountApp(runtime: CrestronRuntime): void {
  const roomName = must('#room-name');
  const cipDot = must('#cip-dot');
  const cipLabel = must('#cip-label');
  const cipDetail = must('#cip-detail');
  const volumeSlider = must<HTMLInputElement>('#volume-slider');
  const volumeValue = must('#volume-value');
  const lightSlider = must<HTMLInputElement>('#light-slider');
  const lightValue = must('#light-value');

  startClock(must('#clock-time'), must('#clock-date'));

  runtime.setConnectionHandler((state, detail) => {
    setConnection(cipDot, cipLabel, cipDetail, state, detail);
  });

  subscribeSerial(Joins.roomName, (value) => {
    roomName.textContent = value || 'Lab';
  });

  subscribeAnalog(Joins.source, (value) => {
    showSourceCard(normalizeSource(value));
  });

  subscribeAnalog(Joins.volume, (value) => {
    setSlider(volumeSlider, volumeValue, analogToPercent(value));
  });

  subscribeObject(Joins.volumeRamp, (value) => {
    if (isRampControlBlock(value)) {
      setSlider(volumeSlider, volumeValue, analogToPercent(value.rcb.value), value.rcb.time);
    }
  });

  subscribeAnalog(Joins.lightLevel, (value) => {
    setSlider(lightSlider, lightValue, analogToPercent(value));
  });

  subscribeObject(Joins.lightLevelRamp, (value) => {
    if (isRampControlBlock(value)) {
      setSlider(lightSlider, lightValue, analogToPercent(value.rcb.value), value.rcb.time);
    }
  });

  (Object.keys(Joins) as Array<keyof typeof Joins>).forEach((key) => {
    const join = Joins[key];
    if (join.type !== 'b') {
      return;
    }
    subscribeDigital(join, (value) => {
      document.querySelectorAll(`[data-selected="${key}"]`).forEach((el) => {
        el.classList.toggle('is-selected', value);
      });
    });
  });

  document.querySelectorAll<HTMLElement>('[data-pulse]').forEach((el) => {
    el.addEventListener('click', () => {
      const name = el.dataset.pulse;
      if (!name || !isJoinKey(name)) {
        return;
      }
      const join = Joins[name];
      if (join.type === 'b') {
        pulse(join);
      }
    });
  });

  document.querySelectorAll<HTMLElement>('[data-source]').forEach((el) => {
    el.addEventListener('click', () => {
      const source = Number(el.dataset.source) as SourceId;
      showSourceCard(source);
      publishAnalog(Joins.source, source);
    });
  });

  document.querySelectorAll<HTMLElement>('[data-hold]').forEach((el) => {
    bindHold(el);
  });

  volumeSlider.addEventListener('change', () => {
    publishAnalog(Joins.volume, percentToAnalog(Number(volumeSlider.value)));
  });
  volumeSlider.addEventListener('input', () => {
    volumeValue.textContent = `${volumeSlider.value}%`;
  });

  lightSlider.addEventListener('change', () => {
    publishAnalog(Joins.lightLevel, percentToAnalog(Number(lightSlider.value)));
  });
  lightSlider.addEventListener('input', () => {
    lightValue.textContent = `${lightSlider.value}%`;
  });

  document.querySelector('[data-action="power"]')?.addEventListener('click', () => {
    showCard('card-power');
  });
  document.querySelector('[data-action="lights"]')?.addEventListener('click', () => {
    showCard('card-lights');
  });
  document.querySelector('[data-action="confirm-power"]')?.addEventListener('click', () => {
    pulse(Joins.powerOff);
    publishAnalog(Joins.source, Source.Off);
    showSourceCard(Source.Off);
  });
  document.querySelector('[data-action="cancel-power"]')?.addEventListener('click', () => {
    showSourceCard(readSourceFromUi());
  });

  showSourceCard(Source.Off);
}

function isJoinKey(name: string): name is keyof typeof Joins {
  return name in Joins;
}

function bindHold(el: HTMLElement): void {
  const name = el.dataset.hold;
  if (!name || !isJoinKey(name)) {
    return;
  }
  const join = Joins[name];
  if (join.type !== 'b') {
    return;
  }

  let stop: (() => void) | undefined;

  const down = (event: Event) => {
    event.preventDefault();
    stop?.();
    stop = startRepeatDigital(join);
  };
  const up = (event: Event) => {
    event.preventDefault();
    stop?.();
    stop = undefined;
  };

  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('pointerleave', up);
}

function showSourceCard(source: SourceId): void {
  showCard(CARD_BY_SOURCE[source] ?? 'card-welcome');
  document.querySelectorAll<HTMLElement>('[data-source]').forEach((el) => {
    el.classList.toggle('is-selected', Number(el.dataset.source) === source);
  });
}

function showCard(id: string): void {
  document.querySelectorAll<HTMLElement>('[data-card]').forEach((card) => {
    card.classList.toggle('is-active', card.id === id);
  });
}

function readSourceFromUi(): SourceId {
  const selected = document.querySelector<HTMLElement>('[data-source].is-selected');
  return normalizeSource(Number(selected?.dataset.source ?? 0));
}

function normalizeSource(value: number): SourceId {
  if (value === Source.Laptop || value === Source.AppleTv || value === Source.Hdmi) {
    return value;
  }
  return Source.Off;
}

function setSlider(slider: HTMLInputElement, label: HTMLElement, percent: number, durationMs = 0): void {
  slider.style.transitionDuration = `${durationMs}ms`;
  slider.value = String(percent);
  label.textContent = `${percent}%`;
}

function setConnection(
  dot: HTMLElement,
  label: HTMLElement,
  detail: HTMLElement,
  state: ConnectionState,
  message?: string,
): void {
  const titles: Record<ConnectionState, string> = {
    native: 'Native panel',
    connecting: 'Connecting',
    online: 'CIP online',
    offline: 'CIP offline',
    error: 'Connection error',
  };
  dot.dataset.state = state;
  label.textContent = titles[state];
  if (message) {
    detail.textContent = message;
  }
}

function must<T extends HTMLElement = HTMLElement>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) {
    throw new Error(`Missing element ${selector}`);
  }
  return el;
}
