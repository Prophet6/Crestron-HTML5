# SIMPL pairing — Divisible-Room

Three physical rooms in a line: **A — B — C**.

- A neighbors B. B neighbors C.
- There is no A–C air wall. **A cannot combine with C unless B is in the same space.**
- Legal layouts: `A | B | C`, `A+B | C`, `A | B+C`, `A+B+C`.

HTML5 XPanel IP-ID: **E2** (`0xE2`). Hello-World stays on **E1**.

## Volume

In the browser, the slider is **optimistic**: it moves immediately without a processor. That is a UI simulation.

On the processor, `Divisible Room Logic v1.0` **echoes** the analog from the panel back as FB (`A_Volume` → `A_Volume_FB`). Combined rooms copy the leftmost master. It is not a timed Analog Ramp; drag the slider and FB follows.

## Seed program

[`simpl/Divisible Room.smw`](../simpl/Divisible%20Room.smw) is a copy of the Hello-World RMC4 program with the HTML5 XPanel moved to **E2**. It still contains the old Hello-World test logic (joins 11–13 sources, analog 2 volume, etc.). **Do not load that as-is for this UI.**

Add [`simpl/Divisible Room Logic v1.0.usp`](../simpl/Divisible%20Room%20Logic%20v1.0.usp) (symbol already compiled to `.ush`) and wire it to the XPanel as below. You can leave the old Hello-World symbols unwired or delete them.

## Join map (XPanel 3.0 HTML5 @ E2)

Panel **press / analog-from-panel / serial-from-panel** → module **inputs**.  
Module **outputs** → panel **FB / analog-to-panel / serial-to-panel**.

### Partitions

| Join | Panel → program | Program → panel |
|---|---|---|
| Digital 1 | Combine_AB | |
| Digital 2 | Divide_AB | |
| Digital 3 | Combine_BC | |
| Digital 4 | Divide_BC | |
| Digital 5 | Combine_All | |
| Digital 6 | Divide_All | |
| Digital 11 | | Wall_AB_Open |
| Digital 12 | | Wall_BC_Open |
| Serial 1 / 2 / 3 | | Room_A_Name$ / B / C |

### Room A / B / C

| | A | B | C |
|---|---|---|---|
| Source analog (both directions) | 21 | 31 | 41 |
| Volume analog (both directions) | 22 | 32 | 42 |
| Power press + FB | 21 | 31 | 41 |
| Mute press + FB | 22 | 32 | 42 |
| Laptop / Apple TV / HDMI press + FB | 25–27 | 35–37 | 45–47 |

Source analog: `0` off, `1` laptop, `2` Apple TV, `3` HDMI.

When A+B (or all three) are combined, the module copies **A** onto B (and C). When B+C, it copies **B** onto C.

## Compile / load

1. Open `simpl/Divisible Room.smw` in SIMPL Windows.
2. Insert **Divisible Room Logic v1.0** (same folder as the `.ush`).
3. Wire the HTML5 XPanel @ E2 to the module using the table above.
4. Compile for 4-Series and load the RMC4.

The SIMPL+ module itself was compiled with `SPlusCC.exe \target series4` (0 errors).
