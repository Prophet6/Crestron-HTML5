# SIMPL Windows pairing

This UI is a custom CH5 project. In SIMPL it is **not** a Smart Graphics panel.

## Symbols

1. **TST-1080** (HTML5 user project) — load `crestron-html5.ch5z` on the panel.
2. **HTML5 Web XPanel** on the 4-Series processor — IP-ID **E1** (`0xE1` = 225 decimal).

Use the same join map on both symbols so the panel and a browser XPanel stay in sync.

This project is **4-Series only**. Do not set a VC-4 Room ID.

## Processor setup

- SSL enabled on the control system (required for WebXPanel).
- For Vite / Chrome XPanel from a workstation, on the processor console:

```
webserver allowsharedsession
```

Accept the processor’s HTTPS certificate in the browser once (open the processor admin page).

## Join map

| Name | Type | Join | Direction | Notes |
|---|---|---|---|---|
| Room name | Serial | 1 | Processor → UI | Header title |
| Source | Analog | 1 | Both | `0` welcome, `1` laptop, `2` Apple TV, `3` HDMI |
| Volume | Analog | 2 | Both | `0–65535`. RCB object subscription uses the same join |
| Mute | Digital | 10 | Both | Toggle / feedback |
| Laptop | Digital | 11 | UI pulse → processor | Interlock with 12 / 13 |
| Apple TV | Digital | 12 | UI pulse → processor | |
| HDMI | Digital | 13 | UI pulse → processor | |
| Volume up | Digital | 14 | Repeat digital | `{repeatdigital:true}` every 250 ms |
| Volume down | Digital | 15 | Repeat digital | |
| Lights on | Digital | 31 | UI pulse → processor | |
| Lights dim | Digital | 32 | UI pulse → processor | |
| Lights off | Digital | 33 | UI pulse → processor | |
| Light level | Analog | 3 | Both | `0–65535` |
| Power off | Digital | 40 | UI pulse → processor | Shutdown confirm |

## Suggested SIMPL

- **Interlock** on digitals 11–13, driving analog source `1–3`.
- Analog **0** on the source analog when the room is off.
- **Analog Ramp** / **Analog Preset** on volume (2) and lights (3) so the UI can animate Ramp Control Blocks.
- Serial **1** = room name (`Lab` is the UI fallback).

## Deploy

```bash
npm run build:ch5z
npm run deploy:xpanel
PANEL_HOST=<tst-1080-ip> npm run deploy:panel
```
