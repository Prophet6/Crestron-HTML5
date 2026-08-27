# Crestron HTML5

Public catalog of **custom Crestron HTML5 (CH5)** user interfaces — written outside Construct and outside the official shell template.

Each UI lives in its own folder, the same way [Crestron-Modules](https://github.com/Prophet6/Crestron-Modules) holds SIMPL+ / Simpl# modules.

This project is not affiliated with Crestron Electronics.

## Projects

| Folder | What it is | Hardware |
|--------|------------|----------|
| [Hello-World](Hello-World/) | First custom CH5 panel: vanilla TypeScript, Vite, CrComLib. Sources, volume, lights, power. Proven on Vite, TST-1080, and processor-hosted Web XPanel. | RMC4, TST-1080 (IP-ID C1), HTML5 XPanel (IP-ID E1) |
| [Divisible-Room](Divisible-Room/) | Three combinable rooms (A–B–C). Room identity from IP-ID (E1–E3) plus one reusable Identity S+ (`Panel_Role` parameter). | RMC4, XPanel E1/E2/E3 |
| [Divisible-Room-Contracts](Divisible-Room-Contracts/) | Fork of Divisible-Room using name-based CH5 contracts (`.cse2j` + `.chd`) instead of numbered joins. | Same hardware; rewire XPanel via GUI extender |

Docs and SIMPL pairing for each project live inside that folder.

**Full join map (both projects):** [docs/JOIN-MAP.md](docs/JOIN-MAP.md)

## Related repositories

| Repo | Relationship |
|------|----------------|
| [Crestron-Modules](https://github.com/Prophet6/Crestron-Modules) | SIMPL+ / Simpl# modules |
| [crestron-cip-poc](https://github.com/Prophet6/crestron-cip-poc) | ESP32 CIP/SCIP proof of concept |

## Git hygiene

Track source, `package-lock.json`, and the lab `.smw` / `.lpz` under each project’s `simpl/` folder. Ignore `node_modules/`, `dist/`, `archive/`, `SPlsWork/`, and SIMPL autosaves.

## License

MIT
