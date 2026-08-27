# Divisible Room — SIMPL

CIP is the **GUI extender** in [`contracts/divisible-room.chd`](../contracts/divisible-room.chd), not numbered joins.

| File | Role |
|---|---|
| `Divisible Room Logic v1.0.usp` | Shared core. One instance. |
| `Divisible Room Identity.usp` | Per-panel identity. |
| `Divisible Room with Contracts.smw` | Lab program with the CHD on each XPanel. |

On each HTML5 XPanel: **Manage GUI Extenders** → `contracts/divisible-room.chd`. Control Join Ids 1–6. Wiring: [`docs/simpl.md`](../docs/simpl.md).
