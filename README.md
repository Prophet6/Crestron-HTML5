# Crestron HTML5

Custom **Crestron HTML5 (CH5)** user interface **outside Construct** and outside the official shell template.

Vanilla TypeScript + Vite. The only required Crestron runtime is **CrComLib**. **WebXPanel** is initialized in the browser so Chrome can talk to a 4-Series processor. On a **TST-1080**, WebXPanel stays inactive and the panel’s native CIP stack is used.

## Lab defaults

| | |
|---|---|
| Processor | `192.168.86.200` (4-Series) |
| IP-ID | `E1` (`0xE1` / 225) — experimental |
| VC-4 room | none |
| Panel | TST-1080, **1920×1200** (16:10) |

Override host / IP-ID with `.env` (`VITE_PROCESSOR_HOST`, `VITE_IP_ID`) or URL query (`?host=192.168.86.200&ipId=0xE1`). Add `?debug=1` to open Eruda on the panel.

## Why this stack

Crestron Construct emits CH5; it is not CH5. A `.ch5z` is a zip of a web app. This repo is that web app, written by hand:

- `CrComLib.publishEvent` / `subscribeState` for joins
- Named map in `src/crestron/joins.ts` so UI code never hardcodes `"11"`
- Native HTML/CSS (no `<ch5-button>` unless a hardware widget later earns its keep)

Docs: [CH5 developer microsite](https://sdkcon78221.crestron.com/sdk/Crestron_HTML5UI/Content/Topics/Home.htm), especially [custom (non-template) XPanel](https://sdkcon78221.crestron.com/sdk/Crestron_HTML5UI/Content/Topics/Platforms/X-Custom.htm).

## Requirements

- Node.js 24+ and npm 11+ (Crestron CH5 2.19 documents 24.18.0 / 11.16.0)
- Global CLI: `npm i -g @crestron/ch5-utilities-cli`
- 4-Series processor with SSL; for workstation XPanel, `webserver allowsharedsession` on the console
- Optional: TST-1080 for native panel load

## Scripts

```bash
npm install
npm run dev              # Vite at http://localhost:5173
npm run build:ch5z       # dist/ + archive/crestron-html5.ch5z
npm run deploy:xpanel    # processor 192.168.86.200 as Web XPanel
PANEL_HOST=<panel-ip> npm run deploy:panel
```

`ch5-cli deploy` prompts for credentials unless `CH5CLI_DEPLOY_USER` / `CH5CLI_DEPLOY_PW` are set. Do not commit those.

## Join layer

```ts
pulse(Joins.laptop);
publishAnalog(Joins.source, Source.Laptop);
subscribeSerial(Joins.roomName, (name) => { ... });
```

Full SIMPL wiring is in [`docs/simpl.md`](docs/simpl.md).

## Project layout

```
src/crestron/   WebXPanel first, CrComLib on window, join helpers
src/ui/         AV-room shell (sources, volume, lights, power)
src/styles/     TST-1080 1920×1200 layout
scripts/        ch5-cli deploy wrappers
```

Init order matters:

1. `index.html` loads `cr-com-lib.js` (UMD → `window.CrComLib`)
2. Native `bridgeReceive*FromNative` hooks are copied onto `window` (TST-1080)
3. If `isActive`, WebXPanel initializes with host + IP-ID (no room ID)

## License

MIT
