import {
  analogToPercent,
  percentToAnalog,
  pulse,
  publishAnalog,
  subscribeAnalog,
  subscribeDigital,
  subscribeSerial,
} from '../crestron/bridge';
import { Joins, RoomJoins, Source, type SourceId } from '../crestron/joins';
import type { ConnectionState, CrestronRuntime } from '../crestron/init';
import {
  masterRoom,
  summarize,
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

export function mountApp(runtime: CrestronRuntime): void {
  const partitions: PartitionState = { wallABOpen: false, wallBCOpen: false };
  const rooms: Record<RoomId, RoomUi> = {
    A: { source: Source.Off, volume: 0, mute: false, power: false, name: 'A' },
    B: { source: Source.Off, volume: 0, mute: false, power: false, name: 'B' },
    C: { source: Source.Off, volume: 0, mute: false, power: false, name: 'C' },
  };

  startClock(must('#clock-time'), must('#clock-date'));
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
      const wall = el.dataset.wallToggle as WallId;
      toggleWall(wall);
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
      renderVolumeLabels();
    });
    el.addEventListener('change', () => {
      const room = el.dataset.vol as RoomId;
      const value = Number(el.value);
      applyToZone(room, (target, id, master) => {
        target.volume = value;
        if (id === master) {
          publishAnalog(RoomJoins[master].volume, percentToAnalog(value));
        }
      });
    });
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
      const next = !rooms[room].power;
      applyToZone(room, (target, id, master) => {
        target.power = next;
        if (id === master) {
          pulse(RoomJoins[master].power);
        }
      });
    });
  });

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
    paintWall('AB', partitions.wallABOpen);
    paintWall('BC', partitions.wallBCOpen);

    for (const id of ROOMS) {
      const zone = zoneForRoom(partitions, id);
      const card = must(`.room[data-room="${id}"]`);
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
    }
  }

  function renderVolumeLabels(): void {
    for (const id of ROOMS) {
      must(`[data-vol-label="${id}"]`).textContent = `${rooms[id].volume}%`;
    }
  }

  render();
}

function paintWall(wall: WallId, open: boolean): void {
  const el = must(`.wall[data-wall="${wall}"]`);
  el.classList.toggle('is-open', open);
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
