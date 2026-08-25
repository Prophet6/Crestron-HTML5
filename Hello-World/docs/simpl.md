# SIMPL Windows pairing

Lab program: [`simpl/Testing HTML5 Interfaces.smw`](../simpl/Testing%20HTML5%20Interfaces.smw) (Hello-World project).

This UI is a custom CH5 project. In SIMPL it is **not** a Smart Graphics panel.

## Hardware (this lab)

| | |
|---|---|
| Processor | **RMC4** |
| TST-1080 | Ethernet IP-ID **C1** |
| HTML5 Web XPanel | Ethernet IP-ID **E1** (`0xE1` / 225) |

IP table in the `.dip` currently points both devices at `127.0.0.1`. Toolbox / the processor fill real addresses at load time.

4-Series only. No VC-4 Room ID.

## Symbols in the program

- **TST-1080** (HTML5 user project) — load `crestron-html5.ch5z` on the panel
- **XPanel 3.0 Crestron HTML5** at E1 — browser XPanel / `npm run dev`

Both symbols share the join map below so the panel and Chrome stay in sync.

Logic used to prove the pipe:

- Analog Initialize / Analog Equate (source select + feedback)
- Analog Ramp (volume, lights)
- Toggle (mute)
- Serial I/O + Make String Permanent (room name)
- Buffer

## Processor setup

- SSL enabled (required for WebXPanel).
- For Vite / Chrome from a workstation, on the processor console:

```
webserver allowsharedsession
```

Accept the processor’s HTTPS certificate once (open `https://192.168.86.200` in the browser).

## Join map

UI names are from `src/crestron/joins.ts`. SIMPL names are from the lab program.

| UI | Type | Join | SIMPL signal | Notes |
|---|---|---|---|---|
| `roomName` | Serial | 1 | `Room_Name$` / `Room_Name_Send` | Header title |
| `source` | Analog | 1 | `Press_Source` | `0` off, `1` laptop, `2` Apple TV, `3` HDMI |
| `volume` | Analog | 2 | `Volume` | `0–65535`. Object subscription `volumeRamp` is the same join |
| `mute` | Digital | 10 | `Volume_Mute` / `Volume_Mute_FB` | Toggle |
| `laptop` | Digital | 11 | `Press_Laptop` / `Press_Laptop_FB` | Interlock with 12 / 13 |
| `appleTv` | Digital | 12 | `Press_AppleTV` / `Press_AppleTV_FB` | |
| `hdmi` | Digital | 13 | `Press_HDMI` / `Press_HDMI_FB` | |
| `volumeUp` | Digital | 14 | `Volume_Up` | Repeat digital every 250 ms while held |
| `volumeDown` | Digital | 15 | `Volume_Down` | Repeat digital |
| `lightsOn` | Digital | 31 | `Lights_On` | |
| `lightsDim` | Digital | 32 | `Lights_Dim` | |
| `lightsOff` | Digital | 33 | `Lights_Off` | |
| `lightLevel` | Analog | 3 | `Lights` | `0–65535` |
| `powerOff` | Digital | 40 | `Press_Off` | Shutdown confirm |

## Load the program

1. Open `simpl/Testing HTML5 Interfaces.smw` in SIMPL Windows, **or** send `simpl/Testing HTML5 Interfaces.lpz` with Toolbox.
2. Confirm Ethernet IP-IDs: TST-1080 = **C1**, HTML5 XPanel = **E1**.
3. Load to the RMC4.

## Talk to it from this UI

Fastest path (no `.ch5z` on the processor):

```bash
cd Hello-World
npm run dev
```

Open http://localhost:5173. Header should go to **CIP online**. SIMPL Debugger should show the signals above.

Packaged XPanel on the processor (Toolbox **Web Pages and Mobility Projects** is the same as `npm run deploy:xpanel`):

```bash
npm run build:ch5z
npm run deploy:xpanel
```

Browser:

```
https://192.168.86.200/hello-world/index.html?ipID=E1&authToken=<token>
```

`ipID` / `ipId` and `authToken` / `authtoken` are accepted. Do not commit the JWT. `https://192.168.86.200/` may redirect to the last web project after Toolbox has deployed one.

Physical TST-1080:

```bash
PANEL_HOST=<tst-1080-ip> npm run deploy:panel
```

## What we learned in the lab

- Custom CH5 (Vite + CrComLib, no Construct) does talk to a 4-Series HTML5 XPanel at a non-default IP-ID.
- WebXPanel from the Vite dev server is enough to prove joins; deploy to the panel only after Debugger looks right.
- Press-and-hold volume uses CrComLib object `{repeatdigital:true}` on digitals 14/15, not a single pulse.
- Analog ramps can be subscribed as type `o` on the same join number as the analog.
