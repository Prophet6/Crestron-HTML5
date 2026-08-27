#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const target = process.argv[2];
const archive = resolve('archive/divisible-room-contracts.ch5z');
const processorHost = process.env.PROCESSOR_HOST ?? process.env.VITE_PROCESSOR_HOST ?? '192.168.86.200';
const panelHost = process.env.PANEL_HOST;

if (!existsSync(archive)) {
  console.error(`Missing ${archive}. Run npm run build:ch5z first.`);
  process.exit(1);
}

let host;
let deviceType;
const extra = [];

if (target === 'xpanel') {
  host = processorHost;
  deviceType = 'web';
} else if (target === 'panel') {
  if (!panelHost) {
    console.error('Set PANEL_HOST to the TST-1080 address, e.g. PANEL_HOST=192.168.86.201 npm run deploy:panel');
    process.exit(1);
  }
  host = panelHost;
  deviceType = 'touchscreen';
  extra.push('--slow-mode');
} else {
  console.error('Usage: node scripts/deploy.mjs <xpanel|panel>');
  process.exit(1);
}

function quote(value) {
  return /[\s"]/.test(value) ? `"${value.replaceAll('"', '\\"')}"` : value;
}

const localCli = join(
  process.cwd(),
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'ch5-cli.cmd' : 'ch5-cli',
);
const cli = existsSync(localCli) ? quote(localCli) : 'ch5-cli';
const prompt = process.env.CH5CLI_DEPLOY_USER && process.env.CH5CLI_DEPLOY_PW ? [] : ['-p'];
const args = ['deploy', ...prompt, '-H', host, '-t', deviceType, quote(archive), ...extra];
const command = [cli, ...args].join(' ');
console.log(command);

const child = spawn(command, { stdio: 'inherit', shell: true });
child.on('exit', (code) => process.exit(code ?? 1));
