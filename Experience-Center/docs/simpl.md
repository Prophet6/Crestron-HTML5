# SIMPL pairing — Experience Center

The TSW-1070 uses the GUI extender from [`contracts/experience-center.chd`](../contracts/experience-center.chd).

## Panel

IP-ID **C1** is one device in the program.

| Who is connecting | Symbol in SIMPL Windows |
|-------------------|-------------------------|
| TSW-1070 with the `.ch5z` loaded | **TSW-1070** at C1. The panel’s own CIP session brings the IP table online. The UI then reads **Panel**, not Connecting. |
| Browser (Vite or the processor web page) | **XPanel 3.0 Crestron HTML5** at C1. WebXPanel joins over secure WebSocket port 49200. A TSW-1070 symbol does not accept that session, so the IP table stays offline and the header stays on Connecting. |

One IP-ID cannot be both symbols at once. Use the XPanel symbol while working in the browser. Put the TSW-1070 symbol back when the panel is the client.

Browser URL, after the project is on the processor:

```
https://<processor>/experience-center/index.html?ipID=C1&authToken=<token>
```

From Vite (`http://localhost:5175`), the token is requested from `https://<processor>/cws/websocket/getWebSocketToken`, not from Vite. The processor address is `?host=` if it is not `192.168.86.200`. Open `https://<processor>` once and accept the certificate. On the console: `webserver allowsharedsession`, and `userpageauth` / SSL enabled. Sign in if the status line says so.

## Attach the contract

1. **Project → Manage GUI Extenders** → browse to `Experience-Center/contracts/experience-center.chd` → Commit.
2. On the C1 symbol, confirm Control Join Ids: **1 Mode, 2 PowerConfirm, 3 Lighting, 4 Sound**.

The extender is a SIMPL symbol grid. Blank rows are `[~UNUSED~]` (the same pad as `_SKIP_` in a `.usp`). A press sits on the same row as its feedback. Those blanks are not contract joins. The `.cse2j` numbers only the real signals, separately on the input side and the output side.

```
Mode            SystemOn |
                -------- | --------
                Shutdown | Shutdown
                Startup  | Startup
                Neutral  | Neutral
                Gallery  | Gallery
                Screening| Screening
                Presentation | Presentation
                -------- | --------
                RoomName |
                Status   |
                MarkFile |

PowerConfirm             | Initiate
                         | Cancel
                         | Confirm
                -------- | --------
                WarningPage |
                Shutdown |
                CountText |

Lighting presets are stored by the program's own SIMPL lighting preset logic, which is not published in Crestron-Modules. See Modules.

Lighting      PresetN | PresetNRecall
                       | PresetNSave
                -------- | --------   (repeated for presets 1–6)
                Level    | Level
                -------- |
                PresetNName

Sound           MuteN    | MuteN
                VisibleN |
                EnableN  |
                -------- | --------   (repeated for strips 1–6)
                LevelN   | LevelN
                -------- |
                NameN    |
```

## Modules

| Symbol | Count | Wiring |
|--------|-------|--------|
| Power Shutdown Confirmation v1.0 | 1 on this panel | `Initiate` / `Cancel` / `Confirm` from PowerConfirm outputs. `Warning_Page_FB` → `WarningPage`. `Shutdown_OS` → `Shutdown`. `Serial_Count_FB` → `CountText`. Leave the count analog unwired. |
| Mode interlock | 1 | Hold exactly one of `Startup`, `Shutdown`, `Neutral`, `Gallery`, `Screening`, `Presentation` high into the Mode inputs. |
| `Mode.SystemOn` | | High after startup has finished. Low when the system is off. The UI does not infer this from the mode digitals. |
| ISAAC Serial Variable Control v1.1 | job program | `Unique_ID` `System_Mode`. The string is the mode name. Not a panel join. |
| Lighting preset logic (program's own SIMPL, not in Crestron-Modules) | 1 | `Lighting.PresetNRecall` → `PresetN_Recall`. `Lighting.PresetNSave` → `PresetN_Save` (held for the whole press, not a pulse). `PresetN_FB` → `Lighting.PresetN`. Live analogs to `Ain1`–`Ain16`. Recalled values come out `Aout1`–`Aout16`. A channel counts when `Ain` or `Aout` has a signal. `PresetN_FB` is high only when every one of those values equals the stored preset. Recall checks immediately. A later analog change clears feedback, then checks again after about 1 second. Several presets may match. Save stores at 2.5s and erases that preset to 0 at 10s. |

`PowerConfirm.Shutdown` rising is the moment the UI pulses `Mode.Shutdown`. You can also tie `Shutdown_OS` straight into the shutdown sequence; the UI pulse is the panel’s mode request.

`Countdown_Time` on the confirmation module is the time limit (default 30 seconds). Confirm, or the timer reaching 0, pulses `Shutdown_OS`. Cancel does not.

The job program already lives outside this repo, in the Experience Center control-system folder. This folder does not edit it.

## Owner mark

`Mode.MarkFile` is the only filename. It is the path inside the processor HTML directory. That directory is the web root, so a file in `HTML/logos` is the serial `logos/brand.png`, and the panel requests `https://<processor>/logos/brand.png`. `Mode.RoomName` and `Mode.Status` are the header lines.

Signal names: [`CONTRACT-MAP.md`](CONTRACT-MAP.md).
