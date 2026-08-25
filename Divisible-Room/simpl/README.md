# Divisible Room — SIMPL

Seeded from Hello-World `Testing HTML5 Interfaces.smw` (RMC4, TST-1080 @ C1). The HTML5 XPanel IP-ID is **E2**.

| File | What it is |
|---|---|
| `Divisible Room.smw` | SIMPL Windows program (Hello-World seed, XPanel moved to E2) |
| `Divisible Room Logic v1.0.usp` / `.ush` | SIMPL+ logic: walls, sources, volume echo, zone follow |
| `Divisible Room.smft` / `.dip` | Hardware tree / IP table |

The `.smw` still contains the original Hello-World test symbols (Analog Ramp, source interlock on joins 11–13, etc.). Those do **not** match this UI. Add the SIMPL+ module and wire it to the HTML5 XPanel as in [docs/simpl.md](../docs/simpl.md), then compile and load.

Do not load the Hello-World `.lpz` for this panel.
