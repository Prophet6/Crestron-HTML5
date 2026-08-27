# SIMPL pairing — Divisible-Room

**Join numbers for every digital / analog / serial:** [JOIN-MAP.md](../../docs/JOIN-MAP.md).

Three rooms in a line: **A — B — C**. A cannot join C unless B is in the same space.

## Modules

| Symbol | Count | Purpose |
|---|---|---|
| **Divisible Room Logic v1.0** | 1 | Shared walls, sources, volume. Fan FB to every XPanel. |
| **Divisible Room Identity** | 1 per panel | Parameter `Panel_Role` (0 master, 1 A, 2 B, 3 C). Optional analog `Assign_Override`. |
| **Power Shutdown Confirmation v1.0** | 1 per panel | [Crestron-Modules](https://github.com/Prophet6/Crestron-Modules/tree/main/power-shutdown-confirmation). OFF overlay + countdown. Do not fan. |

## Panels

| Panel | IP-ID | Identity parameter | Digital 13 | Analog 10 |
|-------|-------|--------------------|------------|-----------|
| Room A | **E1** | `Panel_Role` = 1 | `Master_Mode_FB` (leave `Master_Mode` low) | `Room_Assign` = 1 |
| Room B | **E2** | `Panel_Role` = 2 | `Master_Mode_FB` | `Room_Assign` = 2 |
| Room C | **E3** | `Panel_Role` = 3 | `Master_Mode_FB` | `Room_Assign` = 3 |
| Master | your choice | `Panel_Role` = 0 | always 1 | `Room_Assign` = 0 |

Same `.ch5z` on every panel. The UI uses IP-ID (or analog 10) for home room, and digital 13 for master layout. Drive `Master_Mode` high on a room identity to promote that panel. Analog `Assign_Override` 1–3 overrides the parameter at runtime (`0` / unwired = parameter).

## Core joins (Logic v1.0 ↔ every XPanel)

### Partitions

| Join | Panel → core | Core → panel |
|---|---|---|
| Digital 1 | | Wall_AB_Open |
| Digital 2 | | Wall_BC_Open |
| Digital 7 / 8 | Combine_All / Divide_All (master) | |
| Digital 13 | | Master_Mode_FB (from **Identity**, not core) |
| Analog 10 | | Room_Assign (from Identity) |
| Serial 1 / 2 / 3 | | Room_A_Name$ / B / C |

Sensors (`Wall_AB_Sense` / `Wall_BC_Sense`) and Combine all / Divide all last-wins. Room UI shows only walls in that panel's zone. Combine all / divide all is master-only in CH5; wire those two joins from the master XPanel only if you want that in SIMPL too.

### Power Shutdown Confirmation (per XPanel)

Drop **Power Shutdown Confirmation v1.0** on each HTML5 XPanel (E1, E2, E3, master). Same join numbers on every panel; each instance talks only to that XPanel.

| Join | Dir | Signal |
|------|-----|--------|
| Digital 14 | Panel → module | `Initiate` |
| Digital 15 | Panel → module | `Cancel` |
| Digital 16 | Panel → module | `Confirm` |
| Digital 17 | Module → panel | `Warning_Page_FB` |
| Digital 18 | Module → panel | `Shutdown_OS` |
| Analog 11 | Module → panel | `Analog_Count_FB` |
| Serial 4 | Module → panel | `Serial_Count_FB` |

OFF pulses `Initiate`. The overlay follows `Warning_Page_FB` and shows `Serial_Count_FB`. Confirm / Cancel pulse those inputs. When `Shutdown_OS` goes high, the interface pulses that zone’s Power join on Logic. Do not also tie `Shutdown_OS` into `A_Power` / `B_Power` / `C_Power` or power will toggle twice.

### Room A / B / C

| | A | B | C |
|---|---|---|---|
| Source analog | 21 | 31 | 41 |
| Volume analog | 22 | 32 | 42 |
| Power press + FB | 21 | 31 | 41 |
| Mute press + FB | 22 | 32 | 42 |
| Volume up / down | 23 / 24 | 33 / 34 | 43 / 44 |
| Laptop / Apple TV / HDMI | 25–27 | 35–37 | 45–47 |

Source analog: `0` off, `1` laptop, `2` Apple TV, `3` HDMI.

Selecting a source **powers the room on**. Powering off **clears the source**. Combined rooms: a press from **any** room in the zone (A, B, or C) copies source / power / mute / volume to the rest of that zone. Leftmost master is used only when walls first open.

## Compile

All `.usp` files in `simpl/` compile with `SPlusCC.exe \target series4`.
