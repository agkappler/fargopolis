import Character from "@/models/Character";

/** A raw API-shaped character for component tests (new-character defaults unless overridden). */
export function testCharacter(fields: Record<string, unknown> = {}): Character {
    return {
        characterId: "char-1",
        name: "Test",
        race: "elf",
        subrace: "",
        className: "fighter",
        subclassName: "",
        level: 1,
        abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        hitPoints: { current: 0, max: 0, temp: 0 },
        armorClass: 0,
        initiativeBonus: 0,
        speed: 0,
        savingThrowProficiencies: [],
        skillProficiencies: [],
        ...fields,
    } as unknown as Character;
}
