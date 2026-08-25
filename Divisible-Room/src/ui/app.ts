import {
  analogToPercent,
  percentToAnalog,
  pulse,
  publishAnalog,
  startRepeatDigital,
  subscribeAnalog,
  subscribeDigital,
  subscribeSerial,
} from '../crestron/bridge';
import { Joins, RoomJoins, Source, type SourceId } from '../crestron/joins';
import type { ConnectionState, CrestronRuntime } from '../crestron/init';
import { ipId, panelId, processorHost } from '../config';
import {
  masterRoom,
  summarize,
  visibleRooms,
  visibleWalls,
  zoneForRoom,
  zoneLabel,
  type PartitionState,
  type RoomId,
  type WallId,
} from '../rooms';
import { startClock } from './clock';

interface RoomUi {
  source: SourceId;
  volume: number;
  mute: boolean;
  power: boolean;
  name: string;
}

const ROOMS: RoomId[] = ['A', 'B', 'C'];
const SOURCE_COPY: Record<SourceId, { kicker: string; title: string; body: string; controls: string }> = {
  [Source.Off]: {
    kicker: 'Idle',
    title: 'Choose a source',
    body: 'This space is waiting for a source. Laptop, Apple TV, and HDMI pages will hold device info and controls here.',
    controls: '',
  },
  [Source.Laptop]: {
    kicker: 'Laptop',
    title: 'Table HDMI',
    body: 'Connect the laptop to the HDMI cable at the table. Device identity and BYOD status will show here.',
    controls: '<button type="button" class="btn" disabled>Auto-switch (soon)</button>',
  },
  [Source.AppleTv]: {
    kicker: 'Apple TV',
    title: 'Apple TV',
    body: 'Now playing and transport controls will live on this page.',
    controls:
      '<button type="button" class="btn" disabled>Menu</button><button type="button" class="btn" disabled>Play / Pause</button><button type="button" class="btn" disabled>Home</button>',
  },
  [Source.Hdmi]: {
    kicker: 'HDMI',
    title: 'Wall plate',
    body: 'Room HDMI input is routed to the display. Sink / HDCP details will show here.',
    controls: '<button type="button" class="btn" disabled>Re-sync (soon)</button>',
  },
};

export function mountApp(runtime: CrestronRuntime): void {
  const partitions: PartitionState = { wallABOpen: false, wallBCOpen: false };
  const rooms: Record<RoomId, RoomUi> = {
    A: { source: Source.Off, volume: 0, mute: false, power: false, name: 'A' },
    B: { source: Source.Off, volume: 0, mute: false, power: false, name: 'B' },
    C: { source: Source.Off, volume: 0, mute: false, power: false, name: 'C' },
  };
  let pendingPower: RoomId | undefined;

  startClock(must('#clock-time'), must('#clock-date'));
  must('#panel-role').textContent = panelId === 'master' ? 'Master panel' : `Room ${panelId} panel`;
  must('#cip-detail').textContent = `${processorHost} · IP-ID ${ipId.replace(/^0x/i, '')}`;
  runtime.setConnectionHandler((state, detail) => {
    setConnection(must('#cip-dot'), must('#cip-label'), must('#cip-detail'), state, detail);
  });

  subscribeDigital(Joins.wallAB, (value) => {
    partitions.wallABOpen = value;
    render();
  });
  subscribeDigital(Joins.wallBC, (value) => {
    partitions.wallBCOpen = value;
    render();
  });
  subscribeSerial(Joins.nameA, (value) => {
    rooms.A.name = value || 'A';
    render();
  });
  subscribeSerial(Joins.nameB, (value) => {
    rooms.B.name = value || 'B';
    render();
  });
  subscribeSerial(Joins.nameC, (value) => {
    rooms.C.name = value || 'C';
    render();
  });

  for (const id of ROOMS) {
    const joins = RoomJoins[id];
    subscribeAnalog(joins.source, (value) => {
      rooms[id].source = normalizeSource(value);
      render();
    });
    subscribeAnalog(joins.volume, (value) => {
      rooms[id].volume = analogToPercent(value);
      render();
    });
    subscribeDigital(joins.mute, (value) => {
      rooms[id].mute = value;
      render();
    });
    subscribeDigital(joins.power, (value) => {
      rooms[id].power = value;
      render();
    });
  }

  document.querySelectorAll<HTMLElement>('[data-wall-toggle]').forEach((el) => {
    el.addEventListener('click', () => {
      toggleWall(el.dataset.wallToggle as WallId);
    });
  });

  must('[data-action="combine-all"]').addEventListener('click', () => {
    partitions.wallABOpen = true;
    partitions.wallBCOpen = true;
    pulse(Joins.combineAll);
    render();
  });

  must('[data-action="divide-all"]').addEventListener('click', () => {
    partitions.wallABOpen = false;
    partitions.wallBCOpen = false;
    pulse(Joins.divideAll);
    render();
  });

  document.querySelectorAll<HTMLElement>('[data-source]').forEach((el) => {
    el.addEventListener('click', () => {
      const room = roomFrom(el);
      const source = normalizeSource(Number(el.dataset.source));
      applyToZone(room, (target, id, master) => {
        target.source = source;
        if (id === master) {
          publishAnalog(RoomJoins[master].source, source);
          const press = sourceJoin(master, source);
          if (press) {
            pulse(press);
          }
        }
      });
    });
  });

  document.querySelectorAll<HTMLInputElement>('[data-vol]').forEach((el) => {
    el.addEventListener('input', () => {
      const room = el.dataset.vol as RoomId;
      rooms[room].volume = Number(el.value);
      must(`[data-vol-label="${room}"]`).textContent = `${rooms[room].volume}%`;
    });
    el.addEventListener('change', () => {
      setZoneVolume(el.dataset.vol as RoomId, Number(el.value));
    });
  });

  document.querySelectorAll<HTMLElement>('[data-vol-up]').forEach((el) => {
    bindHold(el, el.dataset.volUp as RoomId, 5);
  });
  document.querySelectorAll<HTMLElement>('[data-vol-down]').forEach((el) => {
    bindHold(el, el.dataset.volDown as RoomId, -5);
  });

  document.querySelectorAll<HTMLElement>('[data-mute]').forEach((el) => {
    el.addEventListener('click', () => {
      const room = el.dataset.mute as RoomId;
      const next = !rooms[room].mute;
      applyToZone(room, (target, id, master) => {
        target.mute = next;
        if (id === master) {
          pulse(RoomJoins[master].mute);
        }
      });
    });
  });

  document.querySelectorAll<HTMLElement>('[data-power]').forEach((el) => {
    el.addEventListener('click', () => {
      const room = el.dataset.power as RoomId;
      if (rooms[room].power) {
        openPowerConfirm(room);
      } else {
        setZonePower(room, true);
      }
    });
  });

  must('[data-action="confirm-power"]').addEventListener('click', () => {
    if (pendingPower) {
      setZonePower(pendingPower, false);
    }
    closePowerConfirm();
  });
  must('[data-action="cancel-power"]').addEventListener('click', closePowerConfirm);

  function bindHold(el: HTMLElement, room: RoomId, delta: number): void {
    let stopCs: (() => void) | undefined;
    let timer: number | undefined;

    const step = () => setZoneVolume(room, rooms[room].volume + delta);
    const down = (event: Event) => {
      event.preventDefault();
      step();
      const master = masterRoom(zoneForRoom(partitions, room));
      const join = delta > 0 ? RoomJoins[master].volUp : RoomJoins[master].volDown;
      stopCs = startRepeatDigital(join);
      timer = window.setInterval(step, 250);
    };
    const up = (event: Event) => {
      event.preventDefault();
      stopCs?.();
      stopCs = undefined;
      if (timer !== undefined) {
        window.clearInterval(timer);
        timer = undefined;
      }
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', up);
  }

  function toggleWall(wall: WallId): void {
    if (wall === 'AB') {
      partitions.wallABOpen = !partitions.wallABOpen;
      pulse(partitions.wallABOpen ? Joins.combineAB : Joins.divideAB);
    } else {
      partitions.wallBCOpen = !partitions.wallBCOpen;
      pulse(partitions.wallBCOpen ? Joins.combineBC : Joins.divideBC);
    }
    render();
  }

  function setZoneVolume(room: RoomId, percent: number): void {
    const next = Math.min(100, Math.max(0, Math.round(percent)));
    applyToZone(room, (target, id, master) => {
      target.volume = next;
      if (id === master) {
        publishAnalog(RoomJoins[master].volume, percentToAnalog(next));
      }
    });
  }

  function setZonePower(room: RoomId, on: boolean): void {
    applyToZone(room, (target, id, master) => {
      target.power = on;
      if (id === master) {
        pulse(RoomJoins[master].power);
      }
    });
  }

  function openPowerConfirm(room: RoomId): void {
    pendingPower = room;
    const zone = zoneForRoom(partitions, room);
    const names = zone.rooms.map((id) => rooms[id].name).join(' + ');
    must('#power-confirm-title').textContent =
      zone.rooms.length > 1 ? `Power off ${names}?` : `Power off ${rooms[room].name}?`;
    must('#power-confirm-body').textContent =
      zone.rooms.length > 1
        ? 'This combined space shares power. Displays and audio in every listed room will shut down.'
        : 'Displays and audio in this room will shut down.';
    must('#power-confirm').hidden = false;
  }

  function closePowerConfirm(): void {
    pendingPower = undefined;
    must('#power-confirm').hidden = true;
  }

  function applyToZone(
    room: RoomId,
    fn: (state: RoomUi, id: RoomId, master: RoomId) => void,
  ): void {
    const zone = zoneForRoom(partitions, room);
    const master = masterRoom(zone);
    for (const id of zone.rooms) {
      fn(rooms[id], id, master);
    }
    render();
  }

  function render(): void {
    must('#config-label').textContent = summarize(partitions);
    const shownRooms = new Set(visibleRooms(partitions, panelId));
    const shownWalls = new Set(visibleWalls(partitions, panelId));
    must('#master-actions').classList.toggle('is-hidden', panelId !== 'master');
    must('#dock-rule').textContent =
      panelId === 'master'
        ? 'A cannot combine with C unless B is in the same space.'
        : 'You only see rooms currently combined with this space.';

    paintWall('AB', partitions.wallABOpen, shownWalls.has('AB'));
    paintWall('BC', partitions.wallBCOpen, shownWalls.has('BC'));

    for (const id of ROOMS) {
      const zone = zoneForRoom(partitions, id);
      const card = must(`.room[data-room="${id}"]`);
      card.classList.toggle('is-hidden', !shownRooms.has(id));
      card.dataset.zone = zone.id;
      card.classList.toggle('is-master', masterRoom(zone) === id && zone.rooms.length > 1);
      must(`[data-room-name="${id}"]`).textContent = rooms[id].name;
      must(`[data-room-zone="${id}"]`).textContent = zoneLabel(zone.id);

      card.querySelectorAll<HTMLElement>('[data-source]').forEach((btn) => {
        btn.classList.toggle('is-selected', Number(btn.dataset.source) === rooms[id].source);
      });
      const slider = must<HTMLInputElement>(`[data-vol="${id}"]`);
      slider.value = String(rooms[id].volume);
      must(`[data-vol-label="${id}"]`).textContent = `${rooms[id].volume}%`;
      must(`[data-mute="${id}"]`).classList.toggle('is-selected', rooms[id].mute);
      must(`[data-power="${id}"]`).classList.toggle('is-selected', rooms[id].power);
      paintSourcePage(id, rooms[id].source);
    }
  }

  function paintSourcePage(room: RoomId, source: SourceId): void {
    const copy = SOURCE_COPY[source];
    const page = must(`[data-source-page="${room}"]`);
    page.classList.toggle('is-active', source !== Source.Off);
    must(`[data-source-kicker="${room}"]`).textContent = copy.kicker;
    must(`[data-source-title="${room}"]`).textContent = copy.title;
    must(`[data-source-body="${room}"]`).textContent = copy.body;
    must(`[data-source-controls="${room}"]`).innerHTML = copy.controls;
  }

  render();
}

function paintWall(wall: WallId, open: boolean, visible: boolean): void {
  const el = must(`.wall[data-wall="${wall}"]`);
  el.classList.toggle('is-open', open);
  el.classList.toggle('is-hidden', !visible);
  must(`[data-wall-state="${wall}"]`).textContent = open ? 'Open' : 'Closed';
  must(`[data-wall-toggle="${wall}"]`).textContent = open ? 'Divide' : 'Combine';
}

function roomFrom(el: HTMLElement): RoomId {
  const room = el.closest<HTMLElement>('[data-room]')?.dataset.room;
  if (room === 'A' || room === 'B' || room === 'C') {
    return room;
  }
  return 'A';
}

function sourceJoin(room: RoomId, source: SourceId) {
  const joins = RoomJoins[room];
  if (source === Source.Laptop) {
    return joins.laptop;
  }
  if (source === Source.AppleTv) {
    return joins.appleTv;
  }
  if (source === Source.Hdmi) {
    return joins.hdmi;
  }
  return undefined;
}

function normalizeSource(value: number): SourceId {
  if (value === Source.Laptop || value === Source.AppleTv || value === Source.Hdmi) {
    return value;
  }
  return Source.Off;
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
