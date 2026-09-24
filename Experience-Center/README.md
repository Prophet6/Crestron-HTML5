# Experience Center

Staff touchpanel for the Experience Center. Crestron is the mode authority. This UI sets the mode and trims lighting and sound. The Docent iPad selects video. ISAAC owns scheduled playback.

Same stack as [Divisible-Room](../Divisible-Room/): vanilla TypeScript, Vite, CrComLib, name-based CH5 contract.

| | |
|---|---|
| Panel | TSW-1070-B-S, 10.1 in, 1920×1200 |
| IP-ID | **C1** — the TSW and the browser XPanel share this symbol |
| Processor web | `https://192.168.86.200/experience-center/index.html?ipID=C1&authToken=<token>` |
| Vite | http://localhost:5175 — add `?host=<processor>` when it is not `192.168.86.200` |

The layout fills the browser window. It is designed at 1920×1200 and still fits a smaller XPanel window.

## Pages

Bottom nav: **System**, **Lighting**, **Sound**.

- **System off:** the placeholder wordmark. Touching it starts the system. Sound in the nav is dimmed.
- **System on:** Neutral, Gallery, Screening, and Presentation are the large selections. Startup is not shown. Shutdown is a smaller control and opens the verification layer only when the processor raises `PowerConfirm.WarningPage`.
- **Lighting:** six presets. A short press recalls. A 2.5 second hold saves and the button blinks. One Level fader.
- **Sound:** up to six faders, mute under each. A strip with Visible low is omitted. Enable low dims the strip and ignores it.

Mode buttons light from digital feedback. A press does not light itself.

Offline preview: `/?system=off`, `/?system=on`, `/?mode=Screening`. `?debug=1` opens Eruda. There is no local shutdown countdown.

## Owner mark

The off page shows a placeholder wordmark until `Mode.MarkFile` supplies a filename. The serial may include one folder (`mark1.png` or `Logo/mark2.jpg`). The panel requests `https://<processor>/` plus that path. That path is in the processor HTML directory. If the file is missing, the placeholder stays.

## Contract

`npm run generate:contract` writes:

| File | Use |
|------|-----|
| [`contracts/experience-center.cse2j`](contracts/experience-center.cse2j) | CH5 mapping (`ch5-cli archive -c`) |
| [`public/config/contract.cse2j`](public/config/contract.cse2j) | Runtime path CrComLib expects |
| [`contracts/experience-center.chd`](contracts/experience-center.chd) | SIMPL **Manage GUI Extenders** |

Signal list: [`docs/CONTRACT-MAP.md`](docs/CONTRACT-MAP.md). SIMPL wiring: [`docs/simpl.md`](docs/simpl.md).

Control Join Ids: **1 Mode, 2 PowerConfirm, 3 Lighting, 4 Sound**.

## Run

```bash
cd Experience-Center
npm install
npm run generate:contract
npm run dev
```

```bash
npm run build:ch5z
npm run deploy:xpanel
PANEL_HOST=<panel-ip> npm run deploy:panel
```

`build:ch5z` writes the compiled files with the local date appended:

```text
archive/experience-center-YYYYMMDD.chd
archive/experience-center-YYYYMMDD.ch5z
```

## License

MIT
