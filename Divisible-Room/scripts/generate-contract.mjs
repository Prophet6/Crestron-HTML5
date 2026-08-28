#!/usr/bin/env node
/**
 * Builds Crestron contract artifacts from the named-signal table:
 *   contracts/divisible-room.cse2j  — CH5 / WebXPanel mapping
 *   public/config/contract.cse2j    — runtime copy (exact name CrComLib expects)
 *   contracts/divisible-room.chd    — SIMPL Windows GUI extender
 *
 * CHD layout matches Construct GUI-extender files (Sgntr=CHD).
 * Input cues = program → panel (states). Output cues = panel → program (events).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', '');
const contractName = 'DivisibleRoom';
const contractId = 'divisible-room-contracts-v1';

/** @typedef {{ name: string, type: 'b'|'n'|'s' }} Sig */

/**
 * @type {Array<{
 *   instance: string,
 *   smartObjectId: number,
 *   hint: string,
 *   states: Sig[],
 *   events: Sig[],
 * }>}
 */
const components = [
  {
    instance: 'Walls',
    smartObjectId: 1,
    hint: 'Partition walls, per-wall toggle, master combine/divide all',
    states: [
      { name: 'ABOpen', type: 'b' },
      { name: 'BCOpen', type: 'b' },
      { name: 'ABEnable', type: 'b' },
      { name: 'BCEnable', type: 'b' },
    ],
    events: [
      { name: 'CombineAll', type: 'b' },
      { name: 'DivideAll', type: 'b' },
      { name: 'ABToggle', type: 'b' },
      { name: 'BCToggle', type: 'b' },
    ],
  },
  {
    instance: 'Identity',
    smartObjectId: 2,
    hint: 'Per-panel identity (Master_Mode_FB, Room_Assign)',
    states: [
      { name: 'MasterMode', type: 'b' },
      { name: 'RoomAssign', type: 'n' },
    ],
    events: [],
  },
  {
    instance: 'PowerConfirm',
    smartObjectId: 3,
    hint: 'Power Shutdown Confirmation v1.0 (one instance per XPanel)',
    states: [
      { name: 'WarningPage', type: 'b' },
      { name: 'Shutdown', type: 'b' },
      { name: 'Count', type: 'n' },
      { name: 'CountText', type: 's' },
    ],
    events: [
      { name: 'Initiate', type: 'b' },
      { name: 'Cancel', type: 'b' },
      { name: 'Confirm', type: 'b' },
    ],
  },
  ...['A', 'B', 'C'].map((id, index) => ({
    instance: `Room${id}`,
    smartObjectId: 4 + index,
    hint: `Room ${id} AV`,
    states: [
      { name: 'Power', type: 'b' },
      { name: 'Mute', type: 'b' },
      { name: 'Laptop', type: 'b' },
      { name: 'AppleTv', type: 'b' },
      { name: 'Hdmi', type: 'b' },
      { name: 'Source', type: 'n' },
      { name: 'Volume', type: 'n' },
      { name: 'Name', type: 's' },
    ],
    events: [
      { name: 'Power', type: 'b' },
      { name: 'Mute', type: 'b' },
      { name: 'VolUp', type: 'b' },
      { name: 'VolDown', type: 'b' },
      { name: 'Laptop', type: 'b' },
      { name: 'AppleTv', type: 'b' },
      { name: 'Hdmi', type: 'b' },
      { name: 'Source', type: 'n' },
      { name: 'Volume', type: 'n' },
    ],
  })),
];

function numbered(sigs, type) {
  const ofType = sigs.filter((s) => s.type === type);
  const map = {};
  ofType.forEach((s, i) => {
    map[String(i + 1)] = s.name;
  });
  return map;
}

function eventEntries(instance, sigs, type, smartObjectId) {
  const ofType = sigs.filter((s) => s.type === type);
  const out = {};
  ofType.forEach((s, i) => {
    out[`${instance}.${s.name}`] = { joinId: i + 1, smartObjectId };
  });
  return out;
}

function buildCse2j() {
  const states = { boolean: {}, numeric: {}, string: {} };
  const events = { boolean: {}, numeric: {}, string: {} };
  const typeKey = { b: 'boolean', n: 'numeric', s: 'string' };

  for (const c of components) {
    const id = String(c.smartObjectId);
    for (const t of /** @type {const} */ (['b', 'n', 's'])) {
      const stateMap = numbered(c.states, t);
      if (Object.keys(stateMap).length) {
        const prefixed = {};
        for (const [join, name] of Object.entries(stateMap)) {
          prefixed[join] = `${c.instance}.${name}`;
        }
        states[typeKey[t]][id] = prefixed;
      }
      Object.assign(events[typeKey[t]], eventEntries(c.instance, c.events, t, c.smartObjectId));
    }
  }

  return {
    name: contractName,
    timestamp,
    version: '1.0.0.0',
    schema_version: 1,
    extra_value: 'Divisible-Room name-based CH5 contract',
    signals: { states, events },
  };
}

function crlf(text) {
  return text.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
}

function ofType(sigs, type) {
  return sigs.filter((s) => s.type === type);
}

function buildChdSymbol(c) {
  const dIn = ofType(c.states, 'b');
  const dOut = ofType(c.events, 'b');
  const aIn = ofType(c.states, 'n');
  const aOut = ofType(c.events, 'n');
  const sIn = ofType(c.states, 's');
  const sOut = ofType(c.events, 's');
  const id = c.smartObjectId;
  const lines = [
    '[',
    'ObjTp=Symbol',
    `Name=${c.instance}`,
    `SmplCName=${contractName}.${c.instance}`,
    `Hint=${c.instance} (Control Join Id ${id}) — ${c.hint}`,
    `Code=${id}`,
    'SMWRev=4.28.00',
    'Expand=expand_separately',
    `MinVariableInputs=${dIn.length}`,
    `MaxVariableInputs=${dIn.length}`,
    `MinVariableOutputs=${dOut.length}`,
    `MaxVariableOutputs=${dOut.length}`,
    `MinVariableInputsList2=${aIn.length}`,
    `MaxVariableInputsList2=${aIn.length}`,
    `MinVariableOutputsList2=${aOut.length}`,
    `MaxVariableOutputsList2=${aOut.length}`,
    `MinVariableInputsList3=${sIn.length}`,
    `MaxVariableInputsList3=${sIn.length}`,
    `MinVariableOutputsList3=${sOut.length}`,
    `MaxVariableOutputsList3=${sOut.length}`,
    'NumFixedParams=1',
    'ParamCue1=ControlJoinId',
    'ParamSigType1=UI_RO_String',
    `ControlJoinId=${id}d`,
    'MPp=1',
    `Pp1=${id}`,
    `ChdH=${id}`,
  ];

  dIn.forEach((s, i) => {
    const n = i + 1;
    lines.push(`InputCue${n}=${s.name}`);
    lines.push(`InputSigType${n}=Digital`);
    lines.push(`InputToolTip${n}=${c.instance}.${s.name} (program → panel)`);
  });
  dOut.forEach((s, i) => {
    const n = i + 1;
    lines.push(`OutputCue${n}=${s.name}`);
    lines.push(`OutputSigType${n}=Digital`);
    lines.push(`OutputToolTip${n}=${c.instance}.${s.name} (panel → program)`);
  });
  aIn.forEach((s, i) => {
    const n = i + 1;
    lines.push(`InputList2Cue${n}=${s.name}`);
    lines.push(`InputList2SigType${n}=Analog`);
    lines.push(`Input2ToolTip${n}=${c.instance}.${s.name} (program → panel)`);
  });
  aOut.forEach((s, i) => {
    const n = i + 1;
    lines.push(`OutputList2Cue${n}=${s.name}`);
    lines.push(`OutputList2SigType${n}=Analog`);
    lines.push(`Output2ToolTip${n}=${c.instance}.${s.name} (panel → program)`);
  });
  sIn.forEach((s, i) => {
    const n = i + 1;
    lines.push(`InputList3Cue${n}=${s.name}`);
    lines.push(`InputList3SigType${n}=Serial`);
    lines.push(`Input3ToolTip${n}=${c.instance}.${s.name} (program → panel)`);
  });
  sOut.forEach((s, i) => {
    const n = i + 1;
    lines.push(`OutputList3Cue${n}=${s.name}`);
    lines.push(`OutputList3SigType${n}=Serial`);
    lines.push(`Output3ToolTip${n}=${c.instance}.${s.name} (panel → program)`);
  });
  lines.push(']');
  lines.push('[');
  lines.push('ObjTp=Dp');
  lines.push('Tp=1');
  lines.push('HD=TRUE');
  lines.push('NF=1');
  lines.push('DNF=1');
  lines.push('EncFmt=0');
  lines.push('DVLF=1');
  lines.push('Sgn=0');
  lines.push(`H=${id}`);
  lines.push(`DV=${id}d`);
  lines.push(']');
  lines.push('[');
  lines.push('ObjTp=CHD');
  lines.push(`H=${id}`);
  lines.push(`ChdCode=${id}`);
  lines.push('ParentChdFolder=0');
  lines.push(']');
  return lines.join('\n');
}

function buildChd() {
  const header = [
    '[',
    'ObjTp=FSgntr',
    'Sgntr=CHD',
    'RelVrs=1',
    'Schema=1',
    ']',
    '[',
    'ObjTp=Hd',
    'Schema=1',
    `ProjectFile=${contractName}`,
    `ContractID=${contractId}`,
    'CEProjectVer=1.0.0.0',
    `DateTimeUTC=${timestamp}`,
    ']',
  ].join('\n');
  return [header, ...components.map(buildChdSymbol)].join('\n');
}

const cse2j = `${JSON.stringify(buildCse2j(), null, '\t')}\n`;
const chd = crlf(`${buildChd()}\n`);

mkdirSync(join(root, 'contracts'), { recursive: true });
mkdirSync(join(root, 'public', 'config'), { recursive: true });
writeFileSync(join(root, 'contracts', 'divisible-room.cse2j'), cse2j, 'utf8');
writeFileSync(join(root, 'public', 'config', 'contract.cse2j'), cse2j, 'utf8');
writeFileSync(join(root, 'contracts', 'divisible-room.chd'), chd, 'utf8');

console.log('Wrote contracts/divisible-room.cse2j');
console.log('Wrote public/config/contract.cse2j');
console.log('Wrote contracts/divisible-room.chd');
