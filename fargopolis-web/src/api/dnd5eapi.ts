const RELATIVE_URL = "https://www.dnd5eapi.co"
const BASE_URL = RELATIVE_URL + "/api/2014";

export interface DndItem {
    index: string;
    name: string;
    url: string;
}

export interface Spell extends DndItem {
    level: number;
}
export interface BaseDndResponse {
    results: DndItem[]
}

export interface Spellcasting {
    cantrips_known: number;
    spells_known: number;
    spell_slots_level_1: number;
    spell_slots_level_2: number;
    spell_slots_level_3: number;
    spell_slots_level_4: number;
    spell_slots_level_5: number;
    spell_slots_level_6: number;
    spell_slots_level_7: number;
    spell_slots_level_8: number;
    spell_slots_level_9: number;
}

/** A single selectable entry in an `options_array` choice. */
export interface DndReferenceOption {
    option_type: string;
    item: DndItem;
}

export interface AbilityBonus {
    ability_score: DndItem;
    bonus: number;
}

export interface AbilityBonusOption extends AbilityBonus {
    option_type: string;
}

/** "Choose N of the following" — used for traits, languages and ability bonuses. */
export interface DndChoice<TOption = DndReferenceOption> {
    choose: number;
    type?: string;
    from: {
        option_set_type: string;
        options: TOption[];
    };
}

export interface DiceRoll {
    dice_count: number;
    dice_value: number;
}

export interface SorcerySpellSlot {
    spell_slot_level: number;
    sorcery_point_cost: number;
}

/**
 * Per-class level data. Every field is class-specific, so only the ones
 * belonging to the level's class are present.
 */
export interface ClassSpecific {
    action_surges?: number;
    arcane_recovery_levels?: number;
    aura_range?: number;
    bardic_inspiration_die?: number;
    brutal_critical_dice?: number;
    channel_divinity_charges?: number;
    creating_spell_slots?: SorcerySpellSlot[];
    destroy_undead_cr?: number;
    extra_attacks?: number;
    favored_enemies?: number;
    favored_terrain?: number;
    indomitable_uses?: number;
    invocations_known?: number;
    ki_points?: number;
    magical_secrets_max_5?: number;
    magical_secrets_max_7?: number;
    magical_secrets_max_9?: number;
    martial_arts?: DiceRoll;
    metamagic_known?: number;
    mystic_arcanum_level_6?: number;
    mystic_arcanum_level_7?: number;
    mystic_arcanum_level_8?: number;
    mystic_arcanum_level_9?: number;
    rage_count?: number;
    rage_damage_bonus?: number;
    sneak_attack?: DiceRoll;
    song_of_rest_die?: number;
    sorcery_points?: number;
    unarmored_movement?: number;
    wild_shape_fly?: boolean;
    wild_shape_max_cr?: number;
    wild_shape_swim?: boolean;
}

export interface LevelInfo {
    level: number;
    features: DndItem[];
    /** Absent for levels (and classes) with no spellcasting. */
    spellcasting?: Spellcasting;
    class: DndItem;
    class_specific?: ClassSpecific;
}

export interface Race extends DndItem {
    speed: number;
    age: string;
    alignment: string;
    size: string;
    size_description: string;
    language_desc: string;
    ability_bonuses: AbilityBonus[];
    ability_bonus_options?: DndChoice<AbilityBonusOption>;
    languages: DndItem[];
    language_options?: DndChoice;
    traits: DndItem[];
    subraces: DndItem[];
}

export async function getRelativeUrlInfo(url: string) {
    return fetch(RELATIVE_URL + url).then((response => response.json()));
}

export async function getAllSpells() {
    return fetch(BASE_URL + "/spells").then((response) => response.json());
}

export async function getClasses() {
    return fetch(BASE_URL + "/classes").then((response) => response.json());
}

export async function getClass(className: string) {
    return fetch(BASE_URL + "/classes/" + className).then((response) => response.json());
}

export async function getLevelInfoForClass(className: string) {
    return fetch(BASE_URL + "/classes/" + className + "/levels").then((response) => response.json());
}

export async function getSpellsForClass(className: string) {
    return fetch(BASE_URL + "/classes/" + className + "/spells").then((response) => response.json());
}

export async function getSubclasses(className: string): Promise<BaseDndResponse> {
    return fetch(BASE_URL + "/classes/" + className + "/subclasses").then((response) => response.json());
}

export async function getLevelInfoForSubclass(className: string) {
    return fetch(BASE_URL + "/subclasses/" + className + "/levels").then((response) => response.json());
}

/// RACES
export async function getRaces(): Promise<BaseDndResponse> {
    return fetch(BASE_URL + "/races").then((response) => response.json());
}

export async function getRace(race: string): Promise<Race> {
    return fetch(BASE_URL + "/races/" + race).then((response) => response.json());
}

export async function getSubraces(race: string): Promise<BaseDndResponse> {
    return fetch(BASE_URL + "/races/" + race + "/subraces").then((response) => response.json());
}

export async function getSubraceTraits(subrace: string): Promise<BaseDndResponse> {
    return fetch(BASE_URL + "/subraces/" + subrace + "/traits").then((response) => response.json());
}