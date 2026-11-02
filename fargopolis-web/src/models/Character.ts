import { DndClass } from "@/constants/DndClass";
import { DndRace } from "@/constants/DndRace";
import { AbilityKey, SkillKey } from "@/constants/Skills";

export type AbilityScores = Record<AbilityKey, number>;
export type HitPoints = { current: number; max: number; temp: number };

export default class Character {
    characterId: string;
    name: string;
    race: DndRace;
    subrace?: string;
    className: DndClass;
    subclassName: string;
    level: number;
    avatarId?: string | number;
    abilityScores!: AbilityScores;
    hitPoints!: HitPoints;
    armorClass!: number;
    initiativeBonus!: number;
    speed!: number;
    savingThrowProficiencies!: AbilityKey[];
    skillProficiencies!: SkillKey[];

    constructor(characterId: string, name: string, race: DndRace, className: DndClass, subclassName: string, level: number) {
        this.characterId = characterId;
        this.name = name;
        this.race = race;
        this.className = className;
        this.subclassName = subclassName;
        this.level = level;
    }
}
