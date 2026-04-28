import { capitalize } from "@mui/material";

export enum DndClass {
    Barbarian = 'barbarian',
    Bard = 'bard',
    Cleric = 'cleric',
    Druid = 'druid',
    Fighter = 'fighter',
    Monk = 'monk',
    Paladin = 'paladin',
    Ranger = 'ranger',
    Rogue = 'rogue',
    Sorcerer = 'sorcerer',
    Warlock = 'warlock',
    Wizard = 'wizard'
}

export function getNameForClass(dndClass: DndClass) {
    return capitalize(dndClass);
}