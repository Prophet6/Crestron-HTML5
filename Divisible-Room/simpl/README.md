# Divisible Room — SIMPL

CIP is the **GUI extender** in [`contracts/divisible-room.chd`](../contracts/divisible-room.chd), not numbered joins.

| File | Role |
|---|---|
| `Divisible Room Logic v1.0.usp` | Shared core. One instance. |
| `Divisible Room Identity.usp` | Per-panel identity. |
| `Divisible Room.smw` | Lab program with the CHD on each XPanel. |

Logic wall inputs (do not restack): `Wall_AB_Sense`, `Wall_BC_Sense`, `Wall_Combine_All`, `Wall_Divide_All`, `Wall_AB_Toggle`, `Wall_BC_Toggle`. FB: `Wall_AB_Open_FB`, `Wall_BC_Open_FB`.

On each HTML5 XPanel: **Manage GUI Extenders** → `contracts/divisible-room.chd`. Control Join Ids 1–6. Wiring: [`docs/simpl.md`](../docs/simpl.md).
