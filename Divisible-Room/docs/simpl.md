# SIMPL pairing — Divisible-Room

Three rooms in a line: **A — B — C**. A cannot join C unless B is in the same space.

## Modules

| Symbol | Count | Purpose |
|---|---|---|
| **Divisible Room Logic v1.0** | 1 | Shared walls, sources, volume. Fan FB to every XPanel. |
| **Divisible Room Master** | 0–1 | Identity for a master panel (`Master_Mode_FB` = 1) |
| **Divisible Room A / B / C** | 1 each | Identity for that room’s panel |

## Panels

| Panel | IP-ID | Identity S+ | Digital 13 | Analog 10 |
|-------|-------|-------------|------------|-----------|
| Room A | **E1** | Divisible Room A | Master_Mode_FB (leave input low) | Room_Assign = 1 |
| Room B | **E2** | Divisible Room B | Master_Mode_FB | Room_Assign = 2 |
| Room C | **E3** | Divisible Room C | Master_Mode_FB | Room_Assign = 3 |
| Master | your choice | Divisible Room Master | always 1 | Room_Assign = 0 |

Same `.ch5z` on every panel. The UI uses IP-ID (or analog 10) for home room, and digital 13 for master layout.

## Core joins (Logic v1.0 ↔ every XPanel)

### Partitions

| Join | Panel → core | Core → panel |
|---|---|---|
| Digital 1 | Wall_AB_Sense (held high = sensor sees wall) | |
| Digital 2 | Wall_BC_Sense | |
| Digital 3 | Combine_AB (override pulse) | |
| Digital 4 | Divide_AB | |
| Digital 5 | Combine_BC | |
| Digital 6 | Divide_BC | |
| Digital 7 | Combine_All | |
| Digital 8 | Divide_All | |
| Digital 11 | | Wall_AB_Open |
| Digital 12 | | Wall_BC_Open |
| Digital 13 | | Master_Mode_FB (from **identity** module, not core) |
| Analog 10 | | Room_Assign (from identity module) |
| Serial 1 / 2 / 3 | | Room_A_Name$ / B / C |

Last **sensor change** or **override press** wins.

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

Selecting a source **powers the room on**. Powering off **clears the source**. Combined rooms follow the leftmost master.

## Compile

All `.usp` files in `simpl/` compile with `SPlusCC.exe \target series4`.
