#!/usr/bin/env node
/**
 * Builds Crestron contract artifacts from the named-signal table:
 *   contracts/experience-center.cse2j  — CH5 / WebXPanel mapping
 *   public/config/contract.cse2j            — runtime copy (exact name CrComLib expects)
 *   contracts/experience-center.chd    — SIMPL Windows GUI extender
 *
 * CHD layout matches Construct GUI-extender files (Sgntr=CHD).
 * Input cues = program → panel (states). Output cues = panel → program (events).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', '');
const contractName = 'ExperienceCenter';
const contractId = 'experience-center-contracts-v1';

/** Empty cell. Written as `[~UNUSED~]` in the CHD — the same blank SIMPL+ `_SKIP_` becomes. */
const SKIP = null;

const modeNames = ['Startup', 'Shutdown', 'Neutral', 'Gallery', 'Screening', 'Presentation'];
const presetCount = 6;
const soundCount = 6;

/**
 * Each list is one column of one signal type, top to bottom.
 * `SKIP` pads that column so a signal shares a row with its partner
 * on the other side. A `SKIP` on both sides is a blank row between groups.
 * Analog row 1 is the row after the last digital. Serial row 1 follows analog.
 *
 * @typedef {{ inputs: Array<string|null>, outputs: Array<string|null> }} Column
 * @type {Array<{
 *   instance: string,
 *   smartObjectId: number,
 *   hint: string,
 *   digital: Column,
 *   analog: Column,
 *   serial: Column,
 * }>}
 */
const components = [
  {
    instance: 'Mode',
    smartObjectId: 1,
    hint: 'System power, a blank row, then one row per mode (feedback | press). Blank row, then serials.',
    digital: {
      inputs: ['SystemOn', SKIP, ...modeNames, SKIP],
      outputs: [SKIP, SKIP, ...modeNames, SKIP],
    },
    analog: { inputs: [], outputs: [] },
    serial: {
      inputs: ['RoomName', 'Status', 'MarkFile'],
      outputs: [],
    },
  },
  {
    instance: 'PowerConfirm',
    smartObjectId: 2,
    hint: 'Presses, a blank row, then warning feedback. CountText follows.',
    digital: {
      inputs: [SKIP, SKIP, SKIP, SKIP, 'WarningPage', 'Shutdown'],
      outputs: ['Initiate', 'Cancel', 'Confirm', SKIP, SKIP, SKIP],
    },
    analog: { inputs: [], outputs: [] },
    serial: {
      inputs: ['CountText'],
      outputs: [],
    },
  },
  {
    instance: 'Lighting',
    smartObjectId: 3,
    hint: 'Preset recall, save, blank row. Then Active, Level, and names.',
    digital: {
      inputs: Array.from({ length: presetCount }, () => [SKIP, SKIP, SKIP]).flat(),
      outputs: Array.from({ length: presetCount }, (_, i) => [
        `Preset${i + 1}Recall`,
        `Preset${i + 1}Save`,
        SKIP,
      ]).flat(),
    },
    analog: {
      inputs: ['Active', 'Level', SKIP],
      outputs: [SKIP, 'Level'],
    },
    serial: {
      inputs: Array.from({ length: presetCount }, (_, i) => `Preset${i + 1}Name`),
      outputs: [],
    },
  },
  {
    instance: 'Sound',
    smartObjectId: 4,
    hint: 'Per strip: Mute lines up, Visible and Enable, then a blank row. Levels, then names.',
    digital: {
      inputs: Array.from({ length: soundCount }, (_, i) => [
        `Mute${i + 1}`,
        `Visible${i + 1}`,
        `Enable${i + 1}`,
        SKIP,
      ]).flat(),
      outputs: Array.from({ length: soundCount }, (_, i) => [`Mute${i + 1}`, SKIP, SKIP, SKIP]).flat(),
    },
    analog: {
      inputs: [...Array.from({ length: soundCount }, (_, i) => `Level${i + 1}`), SKIP],
      outputs: Array.from({ length: soundCount }, (_, i) => `Level${i + 1}`),
    },
    serial: {
      inputs: Array.from({ length: soundCount }, (_, i) => `Name${i + 1}`),
      outputs: [],
    },
  },
];

const columns = {
  b: 'digital',
  n: 'analog',
  s: 'serial',
};

/** Contract join ids count real signals only. `[~UNUSED~]` is a visual row, not a join. */
function namedJoins(list) {
  const map = {};
  let join = 1;
  for (const name of list) {
    if (!name) {
      continue;
    }
    map[String(join)] = name;
    join += 1;
  }
  return map;
}

function eventEntries(instance, list, smartObjectId) {
  const out = {};
  let join = 1;
  for (const name of list) {
    if (!name) {
      continue;
    }
    out[`${instance}.${name}`] = { joinId: join, smartObjectId };
    join += 1;
  }
  return out;
}

function buildCse2j() {
  const states = { boolean: {}, numeric: {}, string: {} };
  const events = { boolean: {}, numeric: {}, string: {} };
  const typeKey = { b: 'boolean', n: 'numeric', s: 'string' };

  for (const c of components) {
    const id = String(c.smartObjectId);
    for (const t of /** @type {const} */ (['b', 'n', 's'])) {
      const column = c[columns[t]];
      const stateMap = namedJoins(column.inputs);
      if (Object.keys(stateMap).length) {
        const prefixed = {};
        for (const [join, name] of Object.entries(stateMap)) {
          prefixed[join] = `${c.instance}.${name}`;
        }
        states[typeKey[t]][id] = prefixed;
      }
      Object.assign(events[typeKey[t]], eventEntries(c.instance, column.outputs, c.smartObjectId));
    }
  }

  return {
    name: contractName,
    timestamp,
    version: '1.0.0.0',
    schema_version: 1,
    extra_value: 'Experience Center name-based CH5 contract',
    signals: { states, events },
  };
}

function crlf(text) {
  return text.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
}

function writeColumn(lines, component, list, spec) {
  list.forEach((name, index) => {
    const n = index + 1;
    lines.push(`${spec.cue}${n}=${name ?? '[~UNUSED~]'}`);
    lines.push(`${spec.sigType}${n}=${spec.typeName}`);
    if (name) {
      lines.push(`${spec.tip}${n}=${component.instance}.${name} (${spec.direction})`);
    }
  });
}

function buildChdSymbol(c) {
  const dIn = c.digital.inputs;
  const dOut = c.digital.outputs;
  const aIn = c.analog.inputs;
  const aOut = c.analog.outputs;
  const sIn = c.serial.inputs;
  const sOut = c.serial.outputs;
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

  writeColumn(lines, c, dIn, {
    cue: 'InputCue',
    sigType: 'InputSigType',
    typeName: 'Digital',
    tip: 'InputToolTip',
    direction: 'program → panel',
  });
  writeColumn(lines, c, dOut, {
    cue: 'OutputCue',
    sigType: 'OutputSigType',
    typeName: 'Digital',
    tip: 'OutputToolTip',
    direction: 'panel → program',
  });
  writeColumn(lines, c, aIn, {
    cue: 'InputList2Cue',
    sigType: 'InputList2SigType',
    typeName: 'Analog',
    tip: 'Input2ToolTip',
    direction: 'program → panel',
  });
  writeColumn(lines, c, aOut, {
    cue: 'OutputList2Cue',
    sigType: 'OutputList2SigType',
    typeName: 'Analog',
    tip: 'Output2ToolTip',
    direction: 'panel → program',
  });
  writeColumn(lines, c, sIn, {
    cue: 'InputList3Cue',
    sigType: 'InputList3SigType',
    typeName: 'Serial',
    tip: 'Input3ToolTip',
    direction: 'program → panel',
  });
  writeColumn(lines, c, sOut, {
    cue: 'OutputList3Cue',
    sigType: 'OutputList3SigType',
    typeName: 'Serial',
    tip: 'Output3ToolTip',
    direction: 'panel → program',
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
writeFileSync(join(root, 'contracts', 'experience-center.cse2j'), cse2j, 'utf8');
writeFileSync(join(root, 'public', 'config', 'contract.cse2j'), cse2j, 'utf8');
writeFileSync(join(root, 'contracts', 'experience-center.chd'), chd, 'utf8');

console.log('Wrote contracts/experience-center.cse2j');
console.log('Wrote public/config/contract.cse2j');
console.log('Wrote contracts/experience-center.chd');
