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

Same stack as Hello-World: vanilla TypeScript, Vite, CrComLib. One `.ch5z`, four views:

| View | URL | Default IP-ID |
|------|-----|----------------|
| Master (sees every room always) | `?panel=master` (default) | E2 |
| Room A | `?panel=A` | E3 |
| Room B | `?panel=B` | E4 |
| Room C | `?panel=C` | E5 |

A room panel only shows rooms currently combined with it. Neighbor Combine/Divide stays available so that panel can still open its air wall.

## Run

```bash
cd Divisible-Room
npm install
npm run dev
```

Vite is on **http://localhost:5174**. Try `/` (master) and `/?panel=B`.

```bash
npm run build:ch5z
npm run deploy:xpanel
```

```
https://192.168.86.200/divisible-room/index.html?panel=master&ipID=E2&authToken=<token>
https://192.168.86.200/divisible-room/index.html?panel=A&ipID=E3&authToken=<token>
```

Join map and SIMPL wiring: [`docs/simpl.md`](docs/simpl.md). Seed program + SIMPL+ module: [`simpl/`](simpl/).

Volume has a slider plus up/down (hold to repeat). Power-off asks for confirmation; power-on does not. Selected sources open a placeholder page for later device info/controls.
