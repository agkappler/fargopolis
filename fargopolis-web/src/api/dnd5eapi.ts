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

export interface LevelInfo {
    level: number;
    features: DndItem[];
    spellcasting: Spellcasting;
    class: DndItem;
    class_specific?: any;
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

export async function getRace(race: string): Promise<any> {
    return fetch(BASE_URL + "/races/" + race).then((response) => response.json());
}

export async function getSubraces(race: string): Promise<BaseDndResponse> {
    return fetch(BASE_URL + "/races/" + race + "/subraces").then((response) => response.json());
}

export async function getSubraceTraits(subrace: string): Promise<any> {
    return fetch(BASE_URL + "/subraces/" + subrace + "/traits").then((response) => response.json());
}