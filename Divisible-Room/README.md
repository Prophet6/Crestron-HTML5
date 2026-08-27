# Divisible-Room

Second project in the [Crestron-HTML5](https://github.com/Prophet6/Crestron-HTML5) catalog.

Three combinable rooms in a straight line:

```
A  |  B  |  C
```

Each room may combine only with a **neighbor**. A never joins C unless B is in the same combined space.

| Walls | Resulting zones |
|-------|-----------------|
| both closed | A, B, C |
| A\|B open | A+B, C |
| B\|C open | A, B+C |
| both open | A+B+C |
| A+C only | **illegal — no control for this** |

Same stack as Hello-World: vanilla TypeScript, Vite, CrComLib. One `.ch5z` on every panel. Room identity comes from **IP-ID** and that panel’s **Divisible Room Identity** instance (`Panel_Role` parameter, analog 10, digital 13).

| Panel | IP-ID | Identity `Panel_Role` | What it shows |
|-------|-------|----------------------|---------------|
| Room A | E1 | 1 | A's zone, full screen. Partitions: A/B wall (B/C after joining B) |
| Room B | E2 | 2 | B's zone, full screen. Partitions: both walls |
| Room C | E3 | 3 | C's zone, full screen. Partitions: B/C wall (A/B after joining B) |
| Master | any | 0 (or drive `Master_Mode` high on a room instance) | One column per zone. Partitions: both walls + combine/divide all |

Each zone is two cards: **OFF + sources** (with a filling idle/source page) and **volume + mute**. **Partitions** lives on the header next to the combined-room text. Room panels only see walls in their zone. Combine all / divide all is master-only.

When rooms are combined, source / power / mute / volume from **any** room in that zone drives the whole zone. Divided rooms stay independent. Satellites never show other zones.

Shared walls/AV: one **Divisible Room Logic v1.0**. Vite preview without a processor: `?ipId=E1` (Room A) or `?master=1` (master layout).

## Run

```bash
cd Divisible-Room
npm install
npm run dev
```

Vite is on **http://localhost:5174**. Try `/?ipId=E1` (Room A) and `/?master=1` (master).

```bash
npm run build:ch5z
npm run deploy:xpanel
```

```
https://192.168.86.200/divisible-room/index.html?ipID=E1&authToken=<token>
https://192.168.86.200/divisible-room/index.html?ipID=E2&authToken=<token>
```

Join map (complete): [`docs/JOIN-MAP.md`](../docs/JOIN-MAP.md). SIMPL wiring: [`docs/simpl.md`](docs/simpl.md). Modules: [`simpl/`](simpl/).

Volume has a slider plus up/down (hold to repeat) and mute, on their own card. OFF sits with the source buttons. Power-off uses [Power Shutdown Confirmation v1.0](https://github.com/Prophet6/Crestron-Modules/tree/main/power-shutdown-confirmation) (one instance per panel) for the overlay and countdown; power-on does not. The idle/source page fills the rest of the source card.
