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

Same stack as Hello-World: vanilla TypeScript, Vite, CrComLib. One `.ch5z` on every panel. Room identity comes from **IP-ID**; **Master Mode** comes from that panel’s identity S+ module (digital 13).

| Panel | IP-ID | Identity S+ | What it shows |
|-------|-------|-------------|---------------|
| Room A | E1 | Divisible Room A | Zone containing A |
| Room B | E2 | Divisible Room B | Zone containing B |
| Room C | E3 | Divisible Room C | Zone containing C |
| Master | any (tie Master_Mode high, or use Master S+) | Divisible Room Master | A, B, and C always |

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

Volume has a slider plus up/down (hold to repeat). Power-off asks for confirmation; power-on does not. Selected sources open a placeholder page for later device info/controls.
