export type RoomId = 'A' | 'B' | 'C';
export type ZoneId = 'A' | 'B' | 'C' | 'AB' | 'BC' | 'ABC';
export type WallId = 'AB' | 'BC';

export interface PartitionState {
  wallABOpen: boolean;
  wallBCOpen: boolean;
}

export interface Zone {
  id: ZoneId;
  rooms: RoomId[];
}

/** Neighbor rule: A touches B, B touches C. A never touches C. */
export function zonesFromWalls(state: PartitionState): Zone[] {
  const { wallABOpen, wallBCOpen } = state;
  if (wallABOpen && wallBCOpen) {
    return [{ id: 'ABC', rooms: ['A', 'B', 'C'] }];
  }
  if (wallABOpen) {
    return [
      { id: 'AB', rooms: ['A', 'B'] },
      { id: 'C', rooms: ['C'] },
    ];
  }
  if (wallBCOpen) {
    return [
      { id: 'A', rooms: ['A'] },
      { id: 'BC', rooms: ['B', 'C'] },
    ];
  }
  return [
    { id: 'A', rooms: ['A'] },
    { id: 'B', rooms: ['B'] },
    { id: 'C', rooms: ['C'] },
  ];
}

export function zoneForRoom(state: PartitionState, room: RoomId): Zone {
  const zone = zonesFromWalls(state).find((item) => item.rooms.includes(room));
  if (!zone) {
    return { id: room, rooms: [room] };
  }
  return zone;
}

export function zoneLabel(id: ZoneId): string {
  switch (id) {
    case 'ABC':
      return 'A + B + C combined';
    case 'AB':
      return 'A + B combined';
    case 'BC':
      return 'B + C combined';
    default:
      return `Room ${id} independent`;
  }
}

export function summarize(state: PartitionState): string {
  if (state.wallABOpen && state.wallBCOpen) {
    return 'All three rooms combined';
  }
  if (state.wallABOpen) {
    return 'A+B combined · C independent';
  }
  if (state.wallBCOpen) {
    return 'A independent · B+C combined';
  }
  return 'Three independent rooms';
}

/** Master (leftmost) room of a zone — processor AV joins for the group. */
export function masterRoom(zone: Zone): RoomId {
  return zone.rooms[0];
}

export type PanelId = 'master' | 'A' | 'B' | 'C';

/** Master sees every room. A room panel sees only rooms in its current zone. */
export function visibleRooms(state: PartitionState, panel: PanelId): RoomId[] {
  if (panel === 'master') {
    return ['A', 'B', 'C'];
  }
  return zoneForRoom(state, panel).rooms;
}

/** One control surface per zone. Master sees every zone; a room panel sees only its own. */
export function visibleZones(state: PartitionState, panel: PanelId): Zone[] {
  if (panel === 'master') {
    return zonesFromWalls(state);
  }
  return [zoneForRoom(state, panel)];
}

/**
 * Walls touching any room in the panel's zone. Independent A sees A|B only.
 * After A joins B, A also sees B|C (to bring C in). Master always sees both.
 */
export function visibleWalls(state: PartitionState, panel: PanelId): WallId[] {
  if (panel === 'master') {
    return ['AB', 'BC'];
  }
  const rooms = new Set(visibleRooms(state, panel));
  const walls: WallId[] = [];
  if (rooms.has('A') || rooms.has('B')) {
    walls.push('AB');
  }
  if (rooms.has('B') || rooms.has('C')) {
    walls.push('BC');
  }
  return walls;
}
