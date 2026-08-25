# SIMPL pairing — Divisible-Room

Three physical rooms in a line: **A — B — C**.

- A neighbors B. B neighbors C.
- There is no A–C air wall. **A cannot combine with C unless B is in the same space.**
- Legal layouts: `A | B | C`, `A+B | C`, `A | B+C`, `A+B+C`.

Suggested HTML5 XPanel IP-ID: **E2** (`0xE2`) so Hello-World can stay on **E1**.

## Partition joins

| UI | Type | Join | Meaning |
|---|---|---|---|
| `combineAB` | Digital | 1 | Pulse: open wall A\|B |
| `divideAB` | Digital | 2 | Pulse: close wall A\|B |
| `combineBC` | Digital | 3 | Pulse: open wall B\|C |
| `divideBC` | Digital | 4 | Pulse: close wall B\|C |
| `combineAll` | Digital | 5 | Pulse: open both walls |
| `divideAll` | Digital | 6 | Pulse: close both walls |
| `wallAB` | Digital | 11 | FB: wall A\|B open |
| `wallBC` | Digital | 12 | FB: wall B\|C open |
| `nameA` / `nameB` / `nameC` | Serial | 1 / 2 / 3 | Room labels |

## Per-room AV (master = leftmost room of a zone)

When A+B are combined, the UI drives **Room A** joins and copies state onto B locally. When B+C, master is B. When all three, master is A.

| | A | B | C |
|---|---|---|---|
| Source analog | 21 | 31 | 41 |
| Volume analog | 22 | 32 | 42 |
| Power digital | 21 | 31 | 41 |
| Mute digital | 22 | 32 | 42 |
| Laptop / Apple TV / HDMI | 25–27 | 35–37 | 45–47 |

Source analog: `0` off, `1` laptop, `2` Apple TV, `3` HDMI.

## Program notes

- Interlock or latches on wall FB 11/12. Do not create an A–C combine signal.
- Combining all three is both walls open, not a third wall.
- The UI also works locally (optimistic walls) so you can demo without a program.
