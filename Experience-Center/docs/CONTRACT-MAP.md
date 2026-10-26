# Contract map — Experience Center

CH5 `publishEvent` / `subscribeState` names. CHD extender **Input** = program → panel. **Output** = panel → program.

Rebuild with `npm run generate:contract`.

The `.chd` inserts `[~UNUSED~]` so each output shares a row with the input it belongs to, and a blank row separates groups. Same pad as `_SKIP_` on a SIMPL+ symbol. Names in this table do not change.

Contract name `ExperienceCenter`. Control Join Ids are fixed.

## Mode (Control Join Id 1)

Digital feedback high draws that selection pressed. The same six names are also press outputs. Three serials follow the digitals.

| CH5 name | Type | CHD | Notes |
|----------|------|-----|-------|
| `Mode.SystemOn` | digital state | Input `SystemOn` | High = system on. Off shows the mark screen. |
| `Mode.Startup` | digital both | Input + Output `Startup` | Output is a pulse. Shown only while SystemOn is low. |
| `Mode.Shutdown` | digital both | Input + Output `Shutdown` | UI pulses the output when `PowerConfirm.Shutdown` rises. |
| `Mode.Neutral` | digital both | Input + Output `Neutral` | |
| `Mode.Gallery` | digital both | Input + Output `Gallery` | |
| `Mode.Screening` | digital both | Input + Output `Screening` | |
| `Mode.Presentation` | digital both | Input + Output `Presentation` | |
| `Mode.RoomName` | serial state | Serial in `RoomName` | Header title. Empty shows “Room Name Here”. |
| `Mode.Status` | serial state | Serial in `Status` | Line under the room name, up to 64 characters. Empty shows “Waiting for a system status update”. |
| `Mode.MarkFile` | serial state | Serial in `MarkFile` | The only filename. Path inside the processor HTML directory. `logos/brand.png` is requested as `https://<processor>/logos/brand.png`. |

Hold one mode digital high. That lights the matching System button. `Mode.Status` is the header line; it is not derived from the mode digitals.

## PowerConfirm (Control Join Id 2)

One **Power Shutdown Confirmation v1.0** per panel. The UI does not run its own countdown.

| CH5 name | Type | CHD | Shutdown S+ |
|----------|------|-----|-------------|
| `PowerConfirm.Initiate` | digital event | Output `Initiate` | `Initiate` |
| `PowerConfirm.Cancel` | digital event | Output `Cancel` | `Cancel` |
| `PowerConfirm.Confirm` | digital event | Output `Confirm` | `Confirm` |
| `PowerConfirm.WarningPage` | digital state | Input `WarningPage` | `Warning_Page_FB` |
| `PowerConfirm.Shutdown` | digital state | Input `Shutdown` | `Shutdown_OS` |
| `PowerConfirm.CountText` | serial state | Serial in `CountText` | `Serial_Count_FB` |

No count analog. The opaque box displays `CountText` as sent. `WarningPage` high shows the blurred layer. `Shutdown` rising edge makes the UI pulse `Mode.Shutdown` once.

## Lighting (Control Join Id 3)

| CH5 name | Type | CHD | Notes |
|----------|------|-----|-------|
| `Lighting.Level` | analog both | Analog in+out `Level` | `0–65535`. Object subscribe is the ramp on the same name. |
| `Lighting.PresetN` | digital state | Input `PresetN` | From module `PresetN_FB`. High only when every defined analog matches preset N. More than one may be high. The press itself does not light the button. N = 1–6. |
| `Lighting.PresetNName` | serial state | Serial in `PresetNName` | Empty shows “Preset N”. |
| `Lighting.PresetNRecall` | digital event | Output `PresetNRecall` | Short press. Wire to module `PresetN_Recall`. |
| `Lighting.PresetNSave` | digital level | Output `PresetNSave` | High from finger down to finger up. Wire to module `PresetN_Save`. The gauge appears after 1 second and fills over the next 1.5 seconds. The blink at 2.5 seconds is local. The module stores then, and erases that preset at 10 seconds. |

Recall does not change the system mode.

## Sound (Control Join Id 4)

Six slots. N = 1–6.

| CH5 name | Type | CHD | Notes |
|----------|------|-----|-------|
| `Sound.LevelN` | analog both | Analog in+out `LevelN` | `0–65535`. Ramp object uses the same name. |
| `Sound.MuteN` | digital both | Input + Output `MuteN` | Held feedback, pulse in |
| `Sound.NameN` | serial state | Serial in `NameN` | Empty shows “Level N” |
| `Sound.VisibleN` | digital state | Input `VisibleN` | Low omits the strip. The rest reflow. |
| `Sound.EnableN` | digital state | Input `EnableN` | Low dims the strip and ignores fader and mute |

Until the first `Visible` feedback, all six strips show and are enabled, so the page can be valued before the list is programmed.
