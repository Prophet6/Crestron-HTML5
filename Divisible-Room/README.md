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
| Room A | E1 | 1 | A's zone. Partitions: walls this room can see. No Combine all / Divide all unless `Master_Mode` is high |
| Room B | E2 | 2 | B's zone. Partitions: both walls. No Combine all / Divide all unless `Master_Mode` is high |
| Room C | E3 | 3 | C's zone. Partitions: walls this room can see. No Combine all / Divide all unless `Master_Mode` is high |
| Master | **C1** | 0 (or `Master_Mode` high on a room panel) | One column per zone. Both wall toggles + Combine all / Divide all |

Each zone is two cards: **OFF + sources** and **volume + mute**. **Partitions** is on the header. Each visible wall has a Combine / Divide toggle (`Wall_AB_Toggle` / `Wall_BC_Toggle`) on every panel that can see that wall. Room A and Room C cannot close A\|B while B\|C is still open (that would leave B+C combined). Combine all / divide all (`Wall_Combine_All` / `Wall_Divide_All`) is shown only when that panel’s `Master_Mode` is high. Power-off uses [Power Shutdown Confirmation v1.0](https://github.com/Prophet6/Crestron-Modules/tree/main/power-shutdown-confirmation) (one instance per panel).

## Contract artifacts

`npm run generate:contract` writes:

| File | Use |
|------|-----|
| [`contracts/divisible-room.cse2j`](contracts/divisible-room.cse2j) | CH5 mapping (`ch5-cli archive -c`) |
| [`public/config/contract.cse2j`](public/config/contract.cse2j) | Runtime path CrComLib expects |
| [`contracts/divisible-room.chd`](contracts/divisible-room.chd) | SIMPL **Manage GUI Extenders** |

Signal list: [`docs/CONTRACT-MAP.md`](docs/CONTRACT-MAP.md). SIMPL wiring: [`docs/simpl.md`](docs/simpl.md). Lab program: [`simpl/Divisible Room.smw`](simpl/).

On each HTML5 XPanel, attach the `.chd` and leave Control Join Ids **1–6** (Walls, Identity, PowerConfirm, RoomA, RoomB, RoomC). Do not also wire numbered joins for these signals.

## Run

```bash
cd Divisible-Room
npm install
npm run generate:contract
npm run dev
```

Vite is **http://localhost:5174**. Try `/?ipId=E1`, `/?ipId=C1`, `/?master=1`, `/?partitions=1`, and `/?walls=abc`.

```bash
npm run build:ch5z
npm run deploy:xpanel
```

```
https://192.168.86.200/divisible-room/index.html?ipID=E1&authToken=<token>
https://192.168.86.200/divisible-room/index.html?ipID=E2&authToken=<token>
https://192.168.86.200/divisible-room/index.html?ipID=E3&authToken=<token>
https://192.168.86.200/divisible-room/index.html?ipID=C1&authToken=<token>
```
