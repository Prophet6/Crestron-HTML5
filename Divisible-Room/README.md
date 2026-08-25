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

Same stack as Hello-World: vanilla TypeScript, Vite, CrComLib. Default XPanel IP-ID is **E2** so Hello-World can stay on E1.

## Run

```bash
cd Divisible-Room
npm install
npm run dev
```

Vite is on **http://localhost:5174** (Hello-World uses 5173).

```bash
npm run build:ch5z
npm run deploy:xpanel
```

Processor URL after deploy:

```
https://192.168.86.200/divisible-room/index.html?ipID=E2&authToken=<token>
```

Join map: [`docs/simpl.md`](docs/simpl.md).
