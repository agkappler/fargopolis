export default class KnownSpell {
    spellName: string;
    characterId: string;
    spellKey: string;
    spellLevel: number;

    constructor(spellName: string, spellKey: string, characterId: string, spellLevel: number) {
        this.spellName = spellName;
        this.spellKey = spellKey;
        this.characterId = characterId;
        this.spellLevel = spellLevel;
    }
}