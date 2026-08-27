# Divisible-Room

Second project in the [Crestron-HTML5](https://github.com/Prophet6/Crestron-HTML5) catalog.

Three combinable rooms in a straight line:

```
A  |  B  |  C
```

Each room may combine only with a **neighbor**. A never joins C unless B is in the same combined space.

CIP uses **name-based CH5 contracts** (`RoomA.Laptop`, `Walls.ABOpen`, …), not numbered joins.

| Walls | Resulting zones |
|-------|-----------------|
| both closed | A, B, C |
| A\|B open | A+B, C |
| B\|C open | A, B+C |
| both open | A+B+C |
| A+C only | **illegal — no control for this** |

Same stack: vanilla TypeScript, Vite, CrComLib. One `.ch5z` on every panel. Room identity from **IP-ID** and that panel’s **Divisible Room Identity** instance.

| Panel | IP-ID | Identity `Panel_Role` | What it shows |
|-------|-------|----------------------|---------------|
| Room A | E1 | 1 | A's zone, full screen. Partitions: A/B wall (B/C after joining B) |
| Room B | E2 | 2 | B's zone, full screen. Partitions: both walls |
| Room C | E3 | 3 | C's zone, full screen. Partitions: B/C wall (A/B after joining B) |
| Master | any | 0 (or drive `Master_Mode` high on a room instance) | One column per zone. Partitions: both walls + combine/divide all |

Each zone is two cards: **OFF + sources** and **volume + mute**. **Partitions** is on the header. Combine all / divide all is master-only. Power-off uses [Power Shutdown Confirmation v1.0](https://github.com/Prophet6/Crestron-Modules/tree/main/power-shutdown-confirmation) (one instance per panel).

## Contract artifacts

`npm run generate:contract` writes:

| File | Use |
|------|-----|
| [`contracts/divisible-room.cse2j`](contracts/divisible-room.cse2j) | CH5 mapping (`ch5-cli archive -c`) |
| [`public/config/contract.cse2j`](public/config/contract.cse2j) | Runtime path CrComLib expects |
| [`contracts/divisible-room.chd`](contracts/divisible-room.chd) | SIMPL **Manage GUI Extenders** |

Signal list: [`docs/CONTRACT-MAP.md`](docs/CONTRACT-MAP.md). SIMPL wiring: [`docs/simpl.md`](docs/simpl.md). Lab program: [`simpl/Divisible Room with Contracts.smw`](simpl/).

On each HTML5 XPanel, attach the `.chd` and leave Control Join Ids **1–6** (Walls, Identity, PowerConfirm, RoomA, RoomB, RoomC). Do not also wire numbered joins for these signals.

## Run

```bash
cd Divisible-Room
npm install
npm run generate:contract
npm run dev
```

Vite is **http://localhost:5174**. Try `/?ipId=E1` and `/?master=1`.

```bash
npm run build:ch5z
npm run deploy:xpanel
```

```
https://192.168.86.200/divisible-room/index.html?ipID=E1&authToken=<token>
https://192.168.86.200/divisible-room/index.html?ipID=E2&authToken=<token>
```
