# SIMPL pairing — Divisible-Room

The HTML5 XPanel uses the **GUI extender** from [`contracts/divisible-room.chd`](../contracts/divisible-room.chd), not numbered joins.

## Attach the contract

1. Add an HTML5 XPanel (E1 / E2 / E3 / master).
2. **Project → Manage GUI Extenders** → browse to `Divisible-Room/contracts/divisible-room.chd` → Commit.
3. Confirm Control Join Ids: **1 Walls, 2 Identity, 3 PowerConfirm, 4 RoomA, 5 RoomB, 6 RoomC**.

## Modules (unchanged)

| Symbol | Count |
|--------|-------|
| Divisible Room Logic v1.0 | 1 (fan AV/wall **to extender inputs**, take presses **from extender outputs**) |
| Divisible Room Identity | 1 per panel |
| Power Shutdown Confirmation v1.0 | 1 per panel |

Wire Identity `Master_Mode_FB` → extender Identity `MasterMode`, `Room_Assign` → `RoomAssign`.

Wire Shutdown `Initiate`/`Cancel`/`Confirm` from PowerConfirm extender outputs; `Warning_Page_FB` / `Shutdown_OS` / counts to extender inputs.

Signal names: [`CONTRACT-MAP.md`](CONTRACT-MAP.md).
