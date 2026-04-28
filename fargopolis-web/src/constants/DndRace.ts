import { capitalize } from "@mui/material";

export enum DndRace {
    Dragonborn = "dragonborn",
    Dwarf = "dwarf",
    Elf = "elf",
    Gnome = "gnome",
    HalfElf = "half-elf",
    HalfOrc = "half-orc",
    Halfling = "halfling",
    Human = "human",
    Tiefling = "tiefling"
}

export function getNameForRace(dndRace: DndRace) {
    switch (dndRace) {
        case DndRace.HalfElf:
            return "Half-Elf";
        case DndRace.HalfOrc:
            return "Half-Orc";
        default:
            return capitalize(dndRace);
    }
}
