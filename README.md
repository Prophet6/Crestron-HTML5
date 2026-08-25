# Crestron HTML5

Public catalog of **custom Crestron HTML5 (CH5)** user interfaces — written outside Construct and outside the official shell template.

Each UI lives in its own folder, the same way [Crestron-Modules](https://github.com/Prophet6/Crestron-Modules) holds SIMPL+ / Simpl# modules.

This project is not affiliated with Crestron Electronics.

## Projects

| Folder | What it is | Hardware |
|--------|------------|----------|
| [Hello-World](Hello-World/) | First custom CH5 panel: vanilla TypeScript, Vite, CrComLib. Sources, volume, lights, power. Proven on Vite, TST-1080, and processor-hosted Web XPanel. | RMC4, TST-1080 (IP-ID C1), HTML5 XPanel (IP-ID E1) |

Docs and SIMPL pairing for each project live inside that folder.

## Related repositories

| Repo | Relationship |
|------|----------------|
| [Crestron-Modules](https://github.com/Prophet6/Crestron-Modules) | SIMPL+ / Simpl# modules |
| [crestron-cip-poc](https://github.com/Prophet6/crestron-cip-poc) | ESP32 CIP/SCIP proof of concept |

## Git hygiene

Track source, `package-lock.json`, and the lab `.smw` / `.lpz` under each project’s `simpl/` folder. Ignore `node_modules/`, `dist/`, `archive/`, `SPlsWork/`, and SIMPL autosaves.

## License

MIT
