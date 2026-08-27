# SIMPL pairing — Divisible-Room

The HTML5 XPanel uses the **GUI extender** from [`contracts/divisible-room.chd`](../contracts/divisible-room.chd), not numbered joins.

## Attach the contract

1. Add an HTML5 XPanel (E1 / E2 / E3 / **C1** master).
2. **Project → Manage GUI Extenders** → browse to `Divisible-Room/contracts/divisible-room.chd` → Commit.
3. Confirm Control Join Ids: **1 Walls, 2 Identity, 3 PowerConfirm, 4 RoomA, 5 RoomB, 6 RoomC**.

## Modules (unchanged)

| Symbol | Count |
|--------|-------|
| Divisible Room Logic v1.0 | 1 (fan AV/wall **to extender inputs**, take presses **from extender outputs**) |
| Divisible Room Identity | 1 per panel |
| Power Shutdown Confirmation v1.0 | 1 per panel |

Wire Identity `Master_Mode_FB` → extender Identity `MasterMode`, `Room_Assign` → `RoomAssign`.

Wire Walls extender outputs `CombineAll` / `DivideAll` / `ABToggle` / `BCToggle` to Logic `Wall_Combine_All` / `Wall_Divide_All` / `Wall_AB_Toggle` / `Wall_BC_Toggle`. **Fan** Logic `Wall_AB_Open_FB` / `Wall_BC_Open_FB` to **every** XPanel Walls `ABOpen` / `BCOpen` input. Those FBs are the global wall state (and later motor drive). Toggles invert FB; the UI does not keep a local wall state while CIP is online.

Room panels (E1–E3, `Master_Mode` off) get Combine / Divide on each wall in their zone only — never Combine all / Divide all. IP-ID **C1** and any panel with `Master_Mode` high get both wall toggles plus Combine all / Divide all.

When A+B+C, Room A must close B|C before A|B (else B+C stay combined). Room C must close A|B before B|C (else A+B stay combined). Master and Room B may close either wall. Enforced in the UI (Logic S+ does not know which panel pressed the shared toggle).

Wire Shutdown `Initiate`/`Cancel`/`Confirm` from PowerConfirm extender outputs; `Warning_Page_FB` / `Shutdown_OS` / counts to extender inputs.

Signal names: [`CONTRACT-MAP.md`](CONTRACT-MAP.md).
