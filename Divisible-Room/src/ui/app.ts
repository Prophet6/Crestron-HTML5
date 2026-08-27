import {
  analogToPercent,
  onIncomingDigital,
  percentToAnalog,
  pulse,
  publishAnalog,
  readDigital,
  startRepeatDigital,
  subscribeAnalog,
  subscribeDigital,
  subscribeDigitalName,
  subscribeSerial,
} from '../crestron/bridge';
import { Joins, RoomJoins, Source, type SourceId } from '../crestron/joins';
import type { ConnectionState, CrestronRuntime } from '../crestron/init';
import {
  ipId,
  isMasterIpId,
  panelFromState,
  queryMaster,
  queryPartitions,
  queryWalls,
  roomFromAssign,
  roomFromIpId,
  processorHost,
} from '../config';
import {
  masterRoom,
  summarize,
  canToggleWall,
  wallCloseFirstHint,
  visibleWalls,
  visibleZones,
  zoneForRoom,
  zoneLabel,
  type PartitionState,
  type RoomId,
  type WallId,
  type Zone,
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
    body: 'Select Laptop, Apple TV, or HDMI to power this space on. Device info and controls will appear here.',
    controls: '',
  },
  [Source.Laptop]: {
    kicker: 'Laptop',
    title: 'Table HDMI',
    body: 'Connect the laptop to the HDMI cable at the table. The display follows this space.',
    controls: '',
  },
  [Source.AppleTv]: {
    kicker: 'Apple TV',
    title: 'Apple TV',
    body: 'Transport and now-playing controls for this source.',
    controls:
      '<button type="button" class="btn" disabled>Menu</button><button type="button" class="btn" disabled>Play / Pause</button><button type="button" class="btn" disabled>Home</button>',
  },
  [Source.Hdmi]: {
    kicker: 'HDMI',
    title: 'Wall plate',
    body: 'Room HDMI input is routed to the display.',
    controls: '',
  },
};

export function mountApp(runtime: CrestronRuntime): void {
  const partitions: PartitionState = {
    wallABOpen: queryWalls === 'abc' || queryWalls === 'ab',
    wallBCOpen: queryWalls === 'abc' || queryWalls === 'bc',
  };
  const rooms: Record<RoomId, RoomUi> = {
    A: { source: Source.Off, volume: 0, mute: false, power: false, name: 'A' },
    B: { source: Source.Off, volume: 0, mute: false, power: false, name: 'B' },
    C: { source: Source.Off, volume: 0, mute: false, power: false, name: 'C' },
  };
  let pendingPower: RoomId | undefined;
  let linked = false;
  let processorOwnsConfirm = false;
  let localCountTimer: number | undefined;
  let localCountLeft = 0;
  const localCountdownSeconds = 10;
  let masterMode = queryMaster || isMasterIpId(ipId);
  let homeRoom: RoomId = roomFromIpId(ipId) ?? 'A';
  let mountedKey = '';
  let holdStop: (() => void) | undefined;
  let holdTimer: number | undefined;
  let holdBtn: HTMLElement | undefined;
  let wallPoll: number | undefined;
  const wallAbNames = [Joins.wallAB.name, 'fb1'];
  const wallBcNames = [Joins.wallBC.name, 'fb2'];

  function currentPanel() {
    return panelFromState(masterMode, homeRoom, ipId);
  }

  startClock(must('#clock-time'), must('#clock-date'));
  must('#cip-detail').textContent = `${processorHost} · IP-ID ${ipId.replace(/^0x/i, '')}`;
  runtime.setConnectionHandler((state, detail) => {
    linked = state === 'online' || state === 'native';
    setConnection(must('#cip-dot'), must('#cip-label'), must('#cip-detail'), state, detail);
    if (linked) {
      syncWallsFromCip();
      if (wallPoll === undefined) {
        wallPoll = window.setInterval(syncWallsFromCip, 250);
      }
    } else if (wallPoll !== undefined) {
      window.clearInterval(wallPoll);
      wallPoll = undefined;
    }
  });

  function setWallFromCip(wall: WallId, open: boolean): void {
    if (wall === 'AB' && partitions.wallABOpen !== open) {
      partitions.wallABOpen = open;
      render();
    }
    if (wall === 'BC' && partitions.wallBCOpen !== open) {
      partitions.wallBCOpen = open;
      render();
    }
  }

  function readAnyDigital(names: string[]): boolean | undefined {
    let sawFalse = false;
    for (const name of names) {
      const value = readDigital(name);
      if (value === true) {
        return true;
      }
      if (value === false) {
        sawFalse = true;
      }
    }
    return sawFalse ? false : undefined;
  }

  function syncWallsFromCip(): void {
    const ab = readAnyDigital(wallAbNames);
    const bc = readAnyDigital(wallBcNames);
    if (ab !== undefined) {
      setWallFromCip('AB', ab);
    }
    if (bc !== undefined) {
      setWallFromCip('BC', bc);
    }
  }

  function pullWallsSoon(): void {
    window.setTimeout(syncWallsFromCip, 50);
    window.setTimeout(syncWallsFromCip, 200);
    window.setTimeout(syncWallsFromCip, 500);
  }

  function noteWallFeedback(name: string, open: boolean): void {
    if (wallAbNames.includes(name)) {
      setWallFromCip('AB', open);
    }
    if (wallBcNames.includes(name)) {
      setWallFromCip('BC', open);
    }
  }

  subscribeDigital(Joins.wallAB, (value) => {
    if (!linked && queryWalls && !asDigital(value)) {
      return;
    }
    setWallFromCip('AB', asDigital(value));
  });
  subscribeDigital(Joins.wallBC, (value) => {
    if (!linked && queryWalls && !asDigital(value)) {
      return;
    }
    setWallFromCip('BC', asDigital(value));
  });
  subscribeDigitalName('fb1', (value) => setWallFromCip('AB', value));
  subscribeDigitalName('fb2', (value) => setWallFromCip('BC', value));
  onIncomingDigital(noteWallFeedback);
  subscribeDigital(Joins.masterMode, (value) => {
    masterMode = isMasterIpId(ipId) || (linked ? value : queryMaster || value);
    render();
  });
  subscribeAnalog(Joins.roomAssign, (value) => {
    const assigned = roomFromAssign(value);
    if (assigned) {
      homeRoom = assigned;
    }
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

  must('[data-action="combine-all"]').addEventListener('click', () => {
    if (currentPanel() !== 'master') {
      return;
    }
    pulse(Joins.combineAll);
    if (!linked) {
      partitions.wallABOpen = true;
      partitions.wallBCOpen = true;
      render();
    }
    pullWallsSoon();
  });

  must('[data-action="divide-all"]').addEventListener('click', () => {
    if (currentPanel() !== 'master') {
      return;
    }
    pulse(Joins.divideAll);
    if (!linked) {
      partitions.wallABOpen = false;
      partitions.wallBCOpen = false;
      render();
    }
    pullWallsSoon();
  });

  must('#partition-page').addEventListener('click', (event) => {
    const btn = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-wall-toggle]');
    if (!btn || btn.disabled) {
      return;
    }
    const wall = btn.dataset.wallToggle;
    if (wall !== 'AB' && wall !== 'BC') {
      return;
    }
    const panel = currentPanel();
    if (!canToggleWall(partitions, panel, wall)) {
      return;
    }
    pulse(wall === 'AB' ? Joins.wallABToggle : Joins.wallBCToggle);
    if (!linked) {
      if (wall === 'AB') {
        partitions.wallABOpen = !partitions.wallABOpen;
      } else {
        partitions.wallBCOpen = !partitions.wallBCOpen;
      }
      render();
    }
    pullWallsSoon();
  });

  must('[data-action="open-partitions"]').addEventListener('click', openPartitions);
  must('[data-action="close-partitions"]').addEventListener('click', closePartitions);

  const zonesEl = must('#zones');

  zonesEl.addEventListener('click', (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-source], [data-mute], [data-power]');
    if (!target || !zonesEl.contains(target)) {
      return;
    }
    const room = roomFrom(target);
    if (target.hasAttribute('data-source')) {
      const source = normalizeSource(Number(target.dataset.source));
      applyToZone(room, (state, id, command) => {
        state.source = source;
        state.power = true;
        if (id === command) {
          publishAnalog(RoomJoins[command].source, source);
          const press = sourceJoin(command, source);
          if (press) {
            pulse(press);
          }
        }
      });
      return;
    }
    if (target.hasAttribute('data-mute')) {
      const next = !rooms[room].mute;
      applyToZone(room, (state, id, command) => {
        state.mute = next;
        if (id === command) {
          pulse(RoomJoins[command].mute);
        }
      });
      return;
    }
    if (rooms[room].power) {
      requestShutdown(room);
    }
  });

  zonesEl.addEventListener('input', (event) => {
    const el = event.target;
    if (!(el instanceof HTMLInputElement) || !el.hasAttribute('data-vol')) {
      return;
    }
    const room = roomFrom(el);
    rooms[room].volume = Number(el.value);
    const label = el.closest('.zone')?.querySelector('[data-vol-label]');
    if (label) {
      label.textContent = `${rooms[room].volume}%`;
    }
  });

  zonesEl.addEventListener('change', (event) => {
    const el = event.target;
    if (!(el instanceof HTMLInputElement) || !el.hasAttribute('data-vol')) {
      return;
    }
    setZoneVolume(roomFrom(el), Number(el.value));
  });

  zonesEl.addEventListener('pointerdown', (event) => {
    const btn = (event.target as HTMLElement).closest<HTMLElement>('[data-vol-up], [data-vol-down]');
    if (!btn) {
      return;
    }
    event.preventDefault();
    const room = roomFrom(btn);
    const delta = btn.hasAttribute('data-vol-up') ? 5 : -5;
    btn.setPointerCapture(event.pointerId);
    startHold(room, delta, btn);
  });
  zonesEl.addEventListener('pointerup', stopHold);
  zonesEl.addEventListener('pointercancel', stopHold);

  must('[data-action="confirm-power"]').addEventListener('click', () => {
    pulse(Joins.powerConfirm.confirm);
    if (!processorOwnsConfirm) {
      completeLocalShutdown();
    }
  });
  must('[data-action="cancel-power"]').addEventListener('click', () => {
    pulse(Joins.powerConfirm.cancel);
    if (!processorOwnsConfirm) {
      cancelLocalShutdown();
    }
  });

  subscribeDigital(Joins.powerConfirm.warningPage, (value) => {
    if (asDigital(value)) {
      processorOwnsConfirm = true;
      stopLocalCountdown();
      setConfirmVisible(true);
    } else if (processorOwnsConfirm) {
      processorOwnsConfirm = false;
      stopLocalCountdown();
      setConfirmVisible(false);
      paintConfirmCount('');
    }
  });
  subscribeDigital(Joins.powerConfirm.shutdown, (value) => {
    if (asDigital(value) && pendingPower) {
      const room = pendingPower;
      pendingPower = undefined;
      stopLocalCountdown();
      setZonePower(room, false);
    }
  });
  subscribeSerial(Joins.powerConfirm.countSerial, (value) => {
    const text = value.trim();
    if (!text) {
      return;
    }
    processorOwnsConfirm = true;
    stopLocalCountdown();
    paintConfirmCount(text);
  });
  subscribeAnalog(Joins.powerConfirm.countAnalog, (value) => {
    if (!processorOwnsConfirm) {
      return;
    }
    const el = must('#power-confirm-count');
    if (!el.textContent.trim()) {
      paintConfirmCount(String(value));
    }
  });

  /** Satellite uses this panel's room joins; master uses the zone's leftmost room. S+ fans the command across the zone. */
  function commandRoom(zone: Zone): RoomId {
    const panel = currentPanel();
    if (panel !== 'master' && zone.rooms.includes(homeRoom)) {
      return homeRoom;
    }
    return masterRoom(zone);
  }

  function startHold(room: RoomId, delta: number, btn: HTMLElement): void {
    stopHold();
    holdBtn = btn;
    holdBtn.classList.add('is-pressed');
    setZoneVolume(room, rooms[room].volume + delta);
    const command = commandRoom(zoneForRoom(partitions, room));
    const join = delta > 0 ? RoomJoins[command].volUp : RoomJoins[command].volDown;
    holdStop = startRepeatDigital(join);
    holdTimer = window.setInterval(() => {
      setZoneVolume(room, rooms[room].volume + delta);
    }, 250);
  }

  function stopHold(): void {
    holdBtn?.classList.remove('is-pressed');
    holdBtn = undefined;
    holdStop?.();
    holdStop = undefined;
    if (holdTimer !== undefined) {
      window.clearInterval(holdTimer);
      holdTimer = undefined;
    }
  }

  function setZoneVolume(room: RoomId, percent: number): void {
    const next = Math.min(100, Math.max(0, Math.round(percent)));
    applyToZone(room, (state, id, command) => {
      state.volume = next;
      if (id === command) {
        publishAnalog(RoomJoins[command].volume, percentToAnalog(next));
      }
    });
  }

  function setZonePower(room: RoomId, on: boolean): void {
    applyToZone(room, (state, id, command) => {
      state.power = on;
      if (!on) {
        state.source = Source.Off;
      }
      if (id === command) {
        pulse(RoomJoins[command].power);
      }
    });
  }

  function requestShutdown(room: RoomId): void {
    pendingPower = room;
    const zone = zoneForRoom(partitions, room);
    const names = zone.rooms.map((id) => rooms[id].name).join(' + ');
    must('#power-confirm-title').textContent =
      zone.rooms.length > 1 ? `Power off ${names}?` : `Power off ${rooms[room].name}?`;
    must('#power-confirm-body').textContent =
      zone.rooms.length > 1
        ? 'This combined space shares power. Displays and audio in every listed room will shut down.'
        : 'Displays and audio in this room will shut down.';
    pulse(Joins.powerConfirm.initiate);
    setConfirmVisible(true);
    if (!processorOwnsConfirm) {
      startLocalCountdown();
    }
  }

  function startLocalCountdown(): void {
    stopLocalCountdown();
    localCountLeft = localCountdownSeconds;
    paintConfirmCount(String(localCountLeft));
    localCountTimer = window.setInterval(() => {
      localCountLeft -= 1;
      if (localCountLeft <= 0) {
        completeLocalShutdown();
        return;
      }
      paintConfirmCount(String(localCountLeft));
    }, 1000);
  }

  function stopLocalCountdown(): void {
    if (localCountTimer !== undefined) {
      window.clearInterval(localCountTimer);
      localCountTimer = undefined;
    }
  }

  function completeLocalShutdown(): void {
    stopLocalCountdown();
    processorOwnsConfirm = false;
    const room = pendingPower;
    pendingPower = undefined;
    paintConfirmCount('');
    setConfirmVisible(false);
    if (room) {
      setZonePower(room, false);
    }
  }

  function cancelLocalShutdown(): void {
    stopLocalCountdown();
    processorOwnsConfirm = false;
    pendingPower = undefined;
    paintConfirmCount('');
    setConfirmVisible(false);
  }

  function paintConfirmCount(text: string): void {
    must('#power-confirm-count').textContent = text;
  }

  function setConfirmVisible(visible: boolean): void {
    must('#power-confirm').hidden = !visible;
  }

  function openPartitions(): void {
    must('#partition-page').hidden = false;
    const btn = must('[data-action="open-partitions"]');
    btn.classList.add('is-selected');
    btn.setAttribute('aria-expanded', 'true');
  }

  function closePartitions(): void {
    must('#partition-page').hidden = true;
    const btn = must('[data-action="open-partitions"]');
    btn.classList.remove('is-selected');
    btn.setAttribute('aria-expanded', 'false');
  }

  function applyToZone(
    room: RoomId,
    fn: (state: RoomUi, id: RoomId, command: RoomId) => void,
  ): void {
    const zone = zoneForRoom(partitions, room);
    const command = commandRoom(zone);
    for (const id of zone.rooms) {
      fn(rooms[id], id, command);
    }
    render();
  }

  function mountZoneCards(zones: Zone[]): void {
    const template = must<HTMLTemplateElement>('#zone-template');
    const proto = template.content.firstElementChild;
    if (!proto) {
      throw new Error('Zone template is empty');
    }
    zonesEl.replaceChildren();
    zonesEl.dataset.count = String(Math.max(1, zones.length));
    for (const zone of zones) {
      const node = proto.cloneNode(true) as HTMLElement;
      node.dataset.room = commandRoom(zone);
      node.dataset.zone = zone.id;
      zonesEl.appendChild(node);
    }
  }

  function paintZone(zone: Zone): void {
    const command = commandRoom(zone);
    const card = zonesEl.querySelector<HTMLElement>(`.zone[data-zone="${zone.id}"]`);
    if (!card) {
      return;
    }
    const ui = rooms[command];
    card.dataset.room = command;
    card.classList.toggle('is-combined', zone.rooms.length > 1);
    within(card, '[data-zone-kind]').textContent = zone.rooms.length > 1 ? 'Combined zone' : 'Room';
    within(card, '[data-zone-name]').textContent = zone.rooms.map((id) => rooms[id].name).join(' + ');
    within(card, '[data-zone-status]').textContent = zoneLabel(zone.id);

    card.querySelectorAll<HTMLElement>('[data-source]').forEach((btn) => {
      btn.classList.toggle('is-selected', Number(btn.dataset.source) === ui.source);
    });
    const slider = within<HTMLInputElement>(card, '[data-vol]');
    if (document.activeElement !== slider) {
      slider.value = String(ui.volume);
    }
    within(card, '[data-vol-label]').textContent = `${ui.volume}%`;
    within(card, '[data-mute]').classList.toggle('is-selected', ui.mute);
    within(card, '[data-power]').classList.toggle('is-selected', ui.source === Source.Off);

    const copy = SOURCE_COPY[ui.source];
    within(card, '.source-page').classList.toggle('is-active', ui.source !== Source.Off);
    within(card, '[data-source-kicker]').textContent = copy.kicker;
    within(card, '[data-source-title]').textContent = copy.title;
    within(card, '[data-source-body]').textContent = copy.body;
    within(card, '[data-source-controls]').innerHTML = copy.controls;
  }

  function render(): void {
    const panel = currentPanel();
    const zones = visibleZones(partitions, panel);
    const shownWalls = new Set(visibleWalls(partitions, panel));
    const key = `${panel}:${zones.map((zone) => zone.id).join(',')}`;

    const masterUi = panel === 'master';
    must('#app').classList.toggle('is-master', masterUi);
    must('#app').classList.toggle('is-satellite', !masterUi);
    must('#panel-role').textContent = masterUi ? 'Master panel' : `Room ${homeRoom} panel`;
    must('#config-label').textContent = summarize(partitions);
    must('#partition-summary').textContent = summarize(partitions);
    must('#master-actions').hidden = !masterUi;
    must('#master-actions').classList.toggle('is-hidden', !masterUi);
    must('#dock-rule').textContent = masterUi
      ? 'Last sensor change, wall toggle, or Combine all / Divide all wins. A cannot join C unless B is in the same space.'
      : partitions.wallABOpen && partitions.wallBCOpen && panel === 'A'
        ? 'When all three are combined, close B|C before A|B so B+C are not left combined.'
        : partitions.wallABOpen && partitions.wallBCOpen && panel === 'C'
          ? 'When all three are combined, close A|B before B|C so A+B are not left combined.'
          : 'Toggle any wall touching this space. Combine all / Divide all is master-only.';

    paintHeaderWall('AB', partitions.wallABOpen);
    paintHeaderWall('BC', partitions.wallBCOpen);
    paintWall(
      'AB',
      partitions.wallABOpen,
      shownWalls.has('AB'),
      canToggleWall(partitions, panel, 'AB'),
      wallCloseFirstHint(panel, 'AB'),
    );
    paintWall(
      'BC',
      partitions.wallBCOpen,
      shownWalls.has('BC'),
      canToggleWall(partitions, panel, 'BC'),
      wallCloseFirstHint(panel, 'BC'),
    );

    if (key !== mountedKey) {
      mountZoneCards(zones);
      mountedKey = key;
    }
    for (const zone of zones) {
      paintZone(zone);
    }
  }

  render();
  if (queryPartitions) {
    openPartitions();
  }
}

function paintHeaderWall(wall: WallId, open: boolean): void {
  const el = must(`[data-header-wall="${wall}"]`);
  el.classList.toggle('is-open', open);
  must(`[data-header-wall-state="${wall}"]`).textContent = open ? 'Open' : 'Closed';
}

function paintWall(wall: WallId, open: boolean, controllable: boolean, enabled: boolean, closeHint: string): void {
  const el = must(`.wall[data-wall="${wall}"]`);
  el.classList.toggle('is-open', open);
  el.classList.remove('is-hidden');
  must(`[data-wall-state="${wall}"]`).textContent = open ? 'Combined (open)' : 'Divided (closed)';
  const btn = el.querySelector<HTMLButtonElement>('[data-wall-toggle]');
  if (btn) {
    btn.hidden = !controllable;
    btn.textContent = open ? 'Divide' : 'Combine';
    btn.disabled = !enabled;
    btn.title = enabled || !open ? '' : closeHint;
  }
}

function asDigital(value: unknown): boolean {
  if (typeof value === 'number') {
    return value !== 0;
  }
  if (typeof value === 'string') {
    return value !== '0' && value !== '' && value.toLowerCase() !== 'false';
  }
  return Boolean(value);
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

function within<T extends HTMLElement = HTMLElement>(root: ParentNode, selector: string): T {
  const el = root.querySelector<T>(selector);
  if (!el) {
    throw new Error(`Missing element ${selector}`);
  }
  return el;
}
