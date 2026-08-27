# Divisible Room — SIMPL

One **core** module owns walls, sources, and volume. One **identity** module is reused on every panel; a parameter (and optional analog) selects Master / A / B / C.

| File | Symbol | Role |
|---|---|---|
| `Divisible Room Logic v1.0.usp` | Divisible Room Logic v1.0 | Shared core. **One instance.** Fan AV/wall FB to every XPanel. |
| `Divisible Room Identity.usp` | Divisible Room Identity | Per-panel identity. Parameter `Panel_Role`: 0 master, 1 A, 2 B, 3 C. Analog `Assign_Override` 1–3 at runtime. |
| `Divisible Room.smw` | | Seed RMC4 program |

## Wiring

1. One **Divisible Room Logic v1.0** — join map in [docs/simpl.md](../docs/simpl.md). Fan its outputs to XPanels E1, E2, E3 (and a master XPanel if you add one).
2. On **each** XPanel, drop **Divisible Room Identity** (do not fan one instance to multiple panels):
   - Parameter `Panel_Role`: `1` on E1, `2` on E2, `3` on E3, `0` on a master panel
   - Digital 13 ← `Master_Mode_FB`
   - Analog 10 ← `Room_Assign`
3. Leave `Master_Mode` unwired on room panels. Tie it high to promote that panel to master layout.
4. Optional `Assign_Override`: analog `0` (or unwired) uses the parameter; `1` / `2` / `3` forces Room A / B / C at runtime.

Replace any leftover **Divisible Room A / B / C / Master** symbols with this one. Those files are removed.

Wall sensors: `Wall_AB_Sense` / `Wall_BC_Sense` held high while the sensor sees a wall. `Combine_All` / `Divide_All` override both walls (master panel). Last change wins. Wire those two from the **master** XPanel only if you do not want room panels to pulse them.
