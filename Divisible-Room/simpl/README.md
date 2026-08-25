# Divisible Room — SIMPL

One **core** module owns walls, sources, and volume. Each **interface** has its own identity module so Master Mode is not shared across panels.

| File | Symbol | Role |
|---|---|---|
| `Divisible Room Logic v1.0.usp` | Divisible Room Logic v1.0 | Shared core. **One instance.** Fan AV/wall FB to every XPanel. |
| `Divisible Room Master.usp` | Divisible Room Master | Master panel identity (`Master_Mode_FB` always 1, `Room_Assign` 0) |
| `Divisible Room A.usp` | Divisible Room A | Room A panel, IP-ID **E1**, `Room_Assign` 1 |
| `Divisible Room B.usp` | Divisible Room B | Room B panel, IP-ID **E2**, `Room_Assign` 2 |
| `Divisible Room C.usp` | Divisible Room C | Room C panel, IP-ID **E3**, `Room_Assign` 3 |
| `Divisible Room.smw` | | Seed RMC4 program |

## Wiring

1. One **Divisible Room Logic v1.0** — join map in [docs/simpl.md](../docs/simpl.md). Fan its outputs to XPanels E1, E2, E3 (and a master XPanel if you add one).
2. On **each** XPanel, drop the matching identity module:
   - Digital 13 ← `Master_Mode_FB`
   - Analog 10 ← `Room_Assign`
3. Room modules: leave `Master_Mode` unwired (satellite). Tie it high only if that panel should become a master.
4. Master module: `Master_Mode_FB` is forced high.

Wall sensors: `Wall_AB_Sense` / `Wall_BC_Sense` held high while the sensor sees a wall. Combine/Divide presses still override. Last change wins.
