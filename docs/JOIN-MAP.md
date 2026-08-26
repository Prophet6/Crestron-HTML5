# Join map

Join numbers are **HTML5 XPanel / TST** joins used by CrComLib (`publishEvent` / `subscribeState`). Wire those joins to the named SIMPL+ signals in SIMPL Windows.

- **Press / analog from panel / serial from panel** → module **inputs**
- **Module outputs** → panel **FB / analog to panel / serial to panel**
- Signal names are always strings in CH5 (`'21'`, not `21`)

`_SKIP_` on a SIMPL+ symbol is padding only. It is not a join.

---

## Divisible-Room

Source of truth for module pins: [`Divisible-Room/simpl/Divisible Room Logic v1.0.usp`](../Divisible-Room/simpl/Divisible%20Room%20Logic%20v1.0.usp)  
CH5 names: [`Divisible-Room/src/crestron/joins.ts`](../Divisible-Room/src/crestron/joins.ts)

### Panels

| Panel | IP-ID | Identity S+ | Shows |
|-------|-------|-------------|--------|
| Room A | **E1** (`0xE1`) | Divisible Room A | Zone containing A |
| Room B | **E2** (`0xE2`) | Divisible Room B | Zone containing B |
| Room C | **E3** (`0xE3`) | Divisible Room C | Zone containing C |
| Master | any | Divisible Room Master | A, B, and C always |

Same `.ch5z` on every panel. Fan **Logic v1.0** outputs to every XPanel. Put **one identity module** on each XPanel (not fanned).

### Identity module (per XPanel)

| XPanel join | Type | Dir | S+ signal | Values |
|-------------|------|-----|-----------|--------|
| Digital 13 | Digital | Program → panel | `Master_Mode_FB` | `1` = show all rooms |
| Analog 10 | Analog | Program → panel | `Room_Assign` | `0` master, `1` A, `2` B, `3` C |
| Digital 13 | Digital | Panel side input on identity S+ | `Master_Mode` | Room A/B/C: leave low. Master symbol forces FB high. |

Identity symbols: `Divisible Room Master`, `Divisible Room A`, `Divisible Room B`, `Divisible Room C`.

### Sensors (not panel joins)

Wire room partition sensors to the **core** module. Held high while the sensor **sees a wall** (wall present → rooms divided).

| Core S+ input | Type | Dir | Behavior |
|---------------|------|-----|----------|
| `Wall_AB_Sense` | Digital | Sensor → core | High = wall A\|B present. CHANGE: last event wins vs override. |
| `Wall_BC_Sense` | Digital | Sensor → core | High = wall B\|C present. |

Do **not** wire these to the XPanel unless you are simulating a sensor from software.

### Core Logic v1.0 — digital (XPanel)

| Join | Dir | CH5 | Core S+ | Notes |
|------|-----|-----|---------|--------|
| 1 | Core → panel | `wallAB` | `Wall_AB_Open` | Held. `1` = combined / air wall open |
| 2 | Core → panel | `wallBC` | `Wall_BC_Open` | Held. `1` = combined / air wall open |
| 7 | Panel → core | `combineAll` | `Combine_All` | Pulse. Opens both walls (override) |
| 8 | Panel → core | `divideAll` | `Divide_All` | Pulse. Closes both walls (override) |
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

Single-wall Combine/Divide in the UI is **local until FB**. The current Logic module has **no** `Combine_AB` / `Divide_AB` / `Combine_BC` / `Divide_BC` pins. Processor wall state comes from **sensors** and **Combine_All / Divide_All**.

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
| 3 | Combine_AB override press (appended on Logic module) |
| 4 | Divide_AB override press |
| 5 | Combine_BC override press |
| 6 | Divide_BC override press |
| 7 | Combine_All press |
| 8 | Divide_All press |
| 9–10 | Open |
| 11–12 | Open |
| 13 | Master_Mode_FB |
| 14–20 | Open |
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
| 11–20 | Open |
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
| 4–10 | Open |

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
