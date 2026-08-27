# Join map

Join numbers are **HTML5 XPanel / TST** joins used by CrComLib (`publishEvent` / `subscribeState`). Wire those joins to the named SIMPL+ signals in SIMPL Windows.

- **Press / analog from panel / serial from panel** → module **inputs**
- **Module outputs** → panel **FB / analog to panel / serial to panel**
- Signal names are always strings in CH5 (`'21'`, not `21`)

`_SKIP_` on a SIMPL+ symbol is padding only. It is not a join.

---

Name-based contract fork (no numbered joins): [Divisible-Room-Contracts](../Divisible-Room-Contracts/docs/CONTRACT-MAP.md).

## Divisible-Room

Source of truth for module pins: [`Divisible-Room/simpl/Divisible Room Logic v1.0.usp`](../Divisible-Room/simpl/Divisible%20Room%20Logic%20v1.0.usp)  
CH5 names: [`Divisible-Room/src/crestron/joins.ts`](../Divisible-Room/src/crestron/joins.ts)

### Panels

| Panel | IP-ID | Identity `Panel_Role` | Shows |
|-------|-------|----------------------|--------|
| Room A | **E1** (`0xE1`) | 1 | Zone containing A. Partition page: A/B, then B/C after joining B |
| Room B | **E2** (`0xE2`) | 2 | Zone containing B. Partition page: both walls |
| Room C | **E3** (`0xE3`) | 3 | Zone containing C. Partition page: B/C, then A/B after joining B |
| Master | any | 0 | One card column per zone. Partition page: both walls |

Same `.ch5z` on every panel. Fan **Logic v1.0** outputs to every XPanel. Put **one Divisible Room Identity** on each XPanel (not fanned). Set `Panel_Role` on that instance.

### Identity module (per XPanel)

Symbol: **Divisible Room Identity** ([`Divisible Room Identity.usp`](../Divisible-Room/simpl/Divisible%20Room%20Identity.usp)). Replaces the old A / B / C / Master copies.

| XPanel join | Type | Dir | S+ signal | Values |
|-------------|------|-----|-----------|--------|
| Digital 13 | Digital | Program → panel | `Master_Mode_FB` | `1` = show all rooms |
| Analog 10 | Analog | Program → panel | `Room_Assign` | `0` master, `1` A, `2` B, `3` C |
| — | Digital | Panel → identity | `Master_Mode` | High promotes a room panel to master layout. Unwired = low. Role 0 keeps FB high. |
| — | Analog | Program → identity | `Assign_Override` | `0` / unwired = use `Panel_Role`. `1`/`2`/`3` force A/B/C at runtime. |

Parameter `Panel_Role` is a SIMPL Windows **list**: Master Panel (`0d`), Room A (`1d`), Room B (`2d`), Room C (`3d`). Default Master Panel. Runtime analog `Assign_Override` 1–3 still wins over the parameter.

### Power Shutdown Confirmation v1.0 (per XPanel)

Symbol from [Crestron-Modules](https://github.com/Prophet6/Crestron-Modules/tree/main/power-shutdown-confirmation). **One instance per HTML5 panel** — do not fan one instance to E1/E2/E3.

| XPanel join | Type | Dir | S+ signal | Notes |
|-------------|------|-----|-----------|--------|
| Digital 14 | Digital | Panel → module | `Initiate` | OFF while the zone is on |
| Digital 15 | Digital | Panel → module | `Cancel` | Dismiss, no power off |
| Digital 16 | Digital | Panel → module | `Confirm` | User confirmed |
| Digital 17 | Digital | Module → panel | `Warning_Page_FB` | Overlay visibility |
| Digital 18 | Digital | Module → panel | `Shutdown_OS` | CH5 pulses that zone’s Power join |
| Analog 11 | Analog | Module → panel | `Analog_Count_FB` | Seconds remaining |
| Serial 4 | Serial | Module → panel | `Serial_Count_FB` | Countdown text |

Optional `Time_Override` (analog in on the module) is not a panel join. `Countdown_Time` / `String_Format` are parameters. Do **not** also wire `Shutdown_OS` to Logic `A_Power` / `B_Power` / `C_Power` — the interface already pulses the zone Power join.

### Sensors (not panel joins)

Wire room partition sensors to the **core** module. Held high while the sensor **sees a wall** (wall present → rooms divided).

| Core S+ input | Type | Dir | Behavior |
|---------------|------|-----|----------|
| `Wall_AB_Sense` | Digital | Sensor → core | High = wall A/B present (rooms divided). Last event wins vs override. |
| `Wall_BC_Sense` | Digital | Sensor → core | High = wall B/C present (rooms divided). |

Do **not** wire these to the XPanel unless you are simulating a sensor from software.

### Core Logic v1.0 — digital (XPanel)

| Join | Dir | CH5 | Core S+ | Notes |
|------|-----|-----|---------|--------|
| 1 | Core → panel | `wallAB` | `Wall_AB_Open` | Held. `1` = combined / air wall open |
| 2 | Core → panel | `wallBC` | `Wall_BC_Open` | Held. `1` = combined / air wall open |
| 7 | Panel → core | `combineAll` | `Combine_All` | Pulse. **Master UI only.** Optional: wire master XPanel only |
| 8 | Panel → core | `divideAll` | `Divide_All` | Pulse. **Master UI only.** Optional: wire master XPanel only |
| 13 | Identity → panel | `masterMode` | `Master_Mode_FB` | See identity table |
| 21 | Both | `RoomJoins.A.power` | `A_Power` / `A_Power_FB` | Pulse in, held FB. Off clears source |
| 22 | Both | `RoomJoins.A.mute` | `A_Mute` / `A_Mute_FB` | Pulse in, held FB |
| 23 | Panel → core | `RoomJoins.A.volUp` | `A_Vol_Up` | Repeat digital / pulse, ~5% |
| 24 | Panel → core | `RoomJoins.A.volDown` | `A_Vol_Down` | Repeat digital / pulse, ~5% |
| 25 | Both | `RoomJoins.A.laptop` | `A_Laptop` / `A_Laptop_FB` | Pulse in, held FB. Also powers on |
| 26 | Both | `RoomJoins.A.appleTv` | `A_AppleTV` / `A_AppleTV_FB` | Pulse in, held FB. Also powers on |
| 27 | Both | `RoomJoins.A.hdmi` | `A_HDMI` / `A_HDMI_FB` | Pulse in, held FB. Also powers on |
| 31 | Both | `RoomJoins.B.power` | `B_Power` / `B_Power_FB` | |
| 32 | Both | `RoomJoins.B.mute` | `B_Mute` / `B_Mute_FB` | |
| 33 | Panel → core | `RoomJoins.B.volUp` | `B_Vol_Up` | |
| 34 | Panel → core | `RoomJoins.B.volDown` | `B_Vol_Down` | |
| 35 | Both | `RoomJoins.B.laptop` | `B_Laptop` / `B_Laptop_FB` | |
| 36 | Both | `RoomJoins.B.appleTv` | `B_AppleTV` / `B_AppleTV_FB` | |
| 37 | Both | `RoomJoins.B.hdmi` | `B_HDMI` / `B_HDMI_FB` | |
| 41 | Both | `RoomJoins.C.power` | `C_Power` / `C_Power_FB` | |
| 42 | Both | `RoomJoins.C.mute` | `C_Mute` / `C_Mute_FB` | |
| 43 | Panel → core | `RoomJoins.C.volUp` | `C_Vol_Up` | |
| 44 | Panel → core | `RoomJoins.C.volDown` | `C_Vol_Down` | |
| 45 | Both | `RoomJoins.C.laptop` | `C_Laptop` / `C_Laptop_FB` | |
| 46 | Both | `RoomJoins.C.appleTv` | `C_AppleTV` / `C_AppleTV_FB` | |
| 47 | Both | `RoomJoins.C.hdmi` | `C_HDMI` / `C_HDMI_FB` | |

Sensors and Combine all / Divide all last-wins. Room panels show only walls in their zone (status). Combine all / divide all is master-only in the UI; in SIMPL you can wire those two joins from the master XPanel only.

### Core Logic v1.0 — analog (XPanel)

| Join | Dir | CH5 | Core S+ | Values |
|------|-----|-----|---------|--------|
| 10 | Identity → panel | `roomAssign` | `Room_Assign` | `0` master, `1` A, `2` B, `3` C |
| 21 | Both | `RoomJoins.A.source` | `A_Source` / `A_Source_FB` | `0` off, `1` laptop, `2` Apple TV, `3` HDMI |
| 22 | Both | `RoomJoins.A.volume` | `A_Volume` / `A_Volume_FB` | `0–65535` (0–100%) |
| 31 | Both | `RoomJoins.B.source` | `B_Source` / `B_Source_FB` | same enum |
| 32 | Both | `RoomJoins.B.volume` | `B_Volume` / `B_Volume_FB` | `0–65535` |
| 41 | Both | `RoomJoins.C.source` | `C_Source` / `C_Source_FB` | same enum |
| 42 | Both | `RoomJoins.C.volume` | `C_Volume` / `C_Volume_FB` | `0–65535` |

When rooms are combined, the core copies the **leftmost** master onto the other rooms (A→B→C for A+B or all three; B→C for B+C).

### Core Logic v1.0 — serial (XPanel)

| Join | Dir | CH5 | Core S+ | Default |
|------|-----|-----|---------|---------|
| 1 | Core → panel | `nameA` | `Room_A_Name$` | `Room A` |
| 2 | Core → panel | `nameB` | `Room_B_Name$` | `Room B` |
| 3 | Core → panel | `nameC` | `Room_C_Name$` | `Room C` |

### Digital joins 1–50 (Divisible-Room XPanel)

| Join | Use |
|------|-----|
| 1 | Wall_AB_Open FB |
| 2 | Wall_BC_Open FB |
| 3–6 | Open |
| 7 | Combine_All (master) |
| 8 | Divide_All (master) |
| 9–12 | Open |
| 13 | Master_Mode_FB |
| 14 | Shutdown Initiate |
| 15 | Shutdown Cancel |
| 16 | Shutdown Confirm |
| 17 | Warning_Page_FB |
| 18 | Shutdown_OS |
| 19–20 | Open |
| 21–27 | Room A (power, mute, vol ±, laptop, ATV, HDMI) |
| 28–30 | Open |
| 31–37 | Room B |
| 38–40 | Open |
| 41–47 | Room C |
| 48–50 | Open |

### Analog joins 1–50 (Divisible-Room XPanel)

| Join | Use |
|------|-----|
| 1–9 | Open |
| 10 | Room_Assign FB |
| 11 | Analog_Count_FB (seconds remaining) |
| 12–20 | Open |
| 21 | A source |
| 22 | A volume |
| 23–30 | Open |
| 31 | B source |
| 32 | B volume |
| 33–40 | Open |
| 41 | C source |
| 42 | C volume |
| 43–50 | Open |

### Serial joins 1–10 (Divisible-Room XPanel)

| Join | Use |
|------|-----|
| 1 | Room A name |
| 2 | Room B name |
| 3 | Room C name |
| 4 | Serial_Count_FB (shutdown countdown) |
| 5–10 | Open |

---

## Hello-World

Source of truth: [`Hello-World/src/crestron/joins.ts`](../Hello-World/src/crestron/joins.ts)

Lab hardware: RMC4, TST-1080 **C1**, HTML5 XPanel **E1** (conflicts with Divisible-Room A if both programs use E1).

| Join | Type | Dir | CH5 | Lab signal |
|------|------|-----|-----|------------|
| 1 | Serial | Program → panel | `roomName` | `Room_Name$` |
| 1 | Analog | Both | `source` | `Press_Source` — `0` off, `1` laptop, `2` Apple TV, `3` HDMI |
| 2 | Analog | Both | `volume` | `Volume` — `0–65535`. Object subscribe = ramp (`volumeRamp`) |
| 3 | Analog | Both | `lightLevel` | `Lights` — `0–65535`. Object subscribe = ramp |
| 10 | Digital | Both | `mute` | `Volume_Mute` / `Volume_Mute_FB` |
| 11 | Digital | Both | `laptop` | `Press_Laptop` / `Press_Laptop_FB` |
| 12 | Digital | Both | `appleTv` | `Press_AppleTV` / `Press_AppleTV_FB` |
| 13 | Digital | Both | `hdmi` | `Press_HDMI` / `Press_HDMI_FB` |
| 14 | Digital | Panel → program | `volumeUp` | `Volume_Up` (repeat digital) |
| 15 | Digital | Panel → program | `volumeDown` | `Volume_Down` (repeat digital) |
| 31 | Digital | Both | `lightsOn` | `Lights_On` |
| 32 | Digital | Both | `lightsDim` | `Lights_Dim` |
| 33 | Digital | Both | `lightsOff` | `Lights_Off` |
| 40 | Digital | Panel → program | `powerOff` | `Press_Off` |
