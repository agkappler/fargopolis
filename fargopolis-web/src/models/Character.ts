import { DndClass } from "@/constants/DndClass";
import { DndRace } from "@/constants/DndRace";

export default class Character {
    characterId: string;
    name: string;
    race: DndRace;
    className: DndClass;
    subclassName: string;
    level: number;
    avatarId?: string | number;

    constructor(characterId: string, name: string, race: DndRace, className: DndClass, subclassName: string, level: number) {
        this.characterId = characterId;
        this.name = name;
        this.race = race;
        this.className = className;
        this.subclassName = subclassName;
        this.level = level;
    }
}