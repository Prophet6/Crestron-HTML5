# Contract map — Divisible-Room

CH5 `publishEvent` / `subscribeState` names. CHD extender **Input** = program → panel. **Output** = panel → program.

Rebuild with `npm run generate:contract`.

## Walls (Control Join Id 1)

| CH5 name | Type | CHD | Logic S+ |
|----------|------|-----|----------|
| `Walls.ABOpen` | digital state | Input `ABOpen` | `Wall_AB_Open_FB` |
| `Walls.BCOpen` | digital state | Input `BCOpen` | `Wall_BC_Open_FB` |
| `Walls.CombineAll` | digital event | Output `CombineAll` | `Wall_Combine_All` |
| `Walls.DivideAll` | digital event | Output `DivideAll` | `Wall_Divide_All` |
| `Walls.ABToggle` | digital event | Output `ABToggle` | `Wall_AB_Toggle` |
| `Walls.BCToggle` | digital event | Output `BCToggle` | `Wall_BC_Toggle` |

Logic wall inputs (user order — do not restack): `Wall_AB_Sense`, `Wall_BC_Sense`, skip, `Wall_Combine_All`, `Wall_Divide_All`, `Wall_AB_Toggle`, `Wall_BC_Toggle`. Combine/divide all is **Master_Mode only** on the UI; per-wall toggles are on every panel for walls that panel can see.

## Identity (Control Join Id 2)

| CH5 name | Type | CHD | Identity S+ |
|----------|------|-----|-------------|
| `Identity.MasterMode` | digital state | Input `MasterMode` | `Master_Mode_FB` |
| `Identity.RoomAssign` | analog state | Analog in `RoomAssign` | `Room_Assign` |

## PowerConfirm (Control Join Id 3)

One **Power Shutdown Confirmation v1.0** per XPanel.

| CH5 name | Type | CHD | Shutdown S+ |
|----------|------|-----|-------------|
| `PowerConfirm.Initiate` | digital event | Output `Initiate` | `Initiate` |
| `PowerConfirm.Cancel` | digital event | Output `Cancel` | `Cancel` |
| `PowerConfirm.Confirm` | digital event | Output `Confirm` | `Confirm` |
| `PowerConfirm.WarningPage` | digital state | Input `WarningPage` | `Warning_Page_FB` |
| `PowerConfirm.Shutdown` | digital state | Input `Shutdown` | `Shutdown_OS` |
| `PowerConfirm.Count` | analog state | Analog in `Count` | `Analog_Count_FB` |
| `PowerConfirm.CountText` | serial state | Serial in `CountText` | `Serial_Count_FB` |

## RoomA / RoomB / RoomC (Control Join Id 4 / 5 / 6)

Same shape on each room. Example for A:

| CH5 name | Type | CHD | Logic S+ |
|----------|------|-----|----------|
| `RoomA.Power` | digital both | Input + Output `Power` | `A_Power` / `A_Power_FB` |
| `RoomA.Mute` | digital both | Input + Output `Mute` | `A_Mute` / `A_Mute_FB` |
| `RoomA.VolUp` | digital event | Output `VolUp` | `A_Vol_Up` |
| `RoomA.VolDown` | digital event | Output `VolDown` | `A_Vol_Down` |
| `RoomA.Laptop` | digital both | Input + Output `Laptop` | `A_Laptop` / `A_Laptop_FB` |
| `RoomA.AppleTv` | digital both | Input + Output `AppleTv` | `A_AppleTV` / `A_AppleTV_FB` |
| `RoomA.Hdmi` | digital both | Input + Output `Hdmi` | `A_HDMI` / `A_HDMI_FB` |
| `RoomA.Source` | analog both | Analog in+out `Source` | `A_Source` / `A_Source_FB` |
| `RoomA.Volume` | analog both | Analog in+out `Volume` | `A_Volume` / `A_Volume_FB` |
| `RoomA.Name` | serial state | Serial in `Name` | `Room_A_Name$` |

Bidirectional names share one contract string in CH5 (`pulse` and `subscribeState` use `RoomA.Power`).
