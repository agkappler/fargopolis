import { DndClass } from "@/constants/DndClass";
import { DndRace } from "@/constants/DndRace";
import type { AbilityKey, SkillKey } from "@/constants/Skills";

export type AbilityScores = Record<AbilityKey, number>;
export type HitPoints = { current: number; max: number; temp: number };

export default class Character {
    characterId: string;
    name: string;
    race: DndRace;
    className: DndClass;
    subclassName: string;
    level: number;
    avatarId?: string | number;
    subrace?: string;
    abilityScores: AbilityScores;
    hitPoints: HitPoints;
    armorClass: number;
    initiativeBonus: number;
    speed: number;
    savingThrowProficiencies: AbilityKey[];
    skillProficiencies: SkillKey[];

    constructor(
        characterId: string,
        name: string,
        race: DndRace,
        className: DndClass,
        subclassName: string,
        level: number,
        subrace?: string,
        abilityScores: AbilityScores = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        hitPoints: HitPoints = { current: 0, max: 0, temp: 0 },
        armorClass = 10,
        initiativeBonus = 0,
        speed = 30,
        savingThrowProficiencies: AbilityKey[] = [],
        skillProficiencies: SkillKey[] = []
    ) {
        this.characterId = characterId;
        this.name = name;
        this.race = race;
        this.className = className;
        this.subclassName = subclassName;
        this.level = level;
        this.subrace = subrace;
        this.abilityScores = abilityScores;
        this.hitPoints = hitPoints;
        this.armorClass = armorClass;
        this.initiativeBonus = initiativeBonus;
        this.speed = speed;
        this.savingThrowProficiencies = savingThrowProficiencies;
        this.skillProficiencies = skillProficiencies;
    }
}
