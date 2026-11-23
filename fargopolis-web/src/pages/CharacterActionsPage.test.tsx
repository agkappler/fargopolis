// @vitest-environment jsdom
import "@/test/setup";
import { renderWithProviders } from "@/test/renderWithProviders";
import { fireEvent, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { SWRConfig } from "swr";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CharacterActionsPage } from "./CharacterActionsPage";

vi.mock("@clerk/react", () => ({
    useAuth: () => ({ isSignedIn: true, getToken: () => Promise.resolve("tok") }),
}));
vi.mock("@/helpers/Toasts", () => ({ rollToast: vi.fn(), errorToast: vi.fn(), successToast: vi.fn() }));

const character = {
    characterId: "c1",
    name: "Mira",
    race: "elf",
    subrace: "",
    className: "wizard",
    subclassName: "",
    level: 3,
    abilityScores: { str: 8, dex: 14, con: 12, int: 16, wis: 10, cha: 10 },
    hitPoints: { current: 15, max: 18, temp: 0 },
    armorClass: 12,
    initiativeBonus: 2,
    speed: 30,
    savingThrowProficiencies: ["int", "wis"],
    skillProficiencies: ["arcana"],
};

vi.mock("@/helpers/RequestManager", () => ({
    default: {
        post: vi.fn(() => Promise.resolve({})),
        get: (path: string) => {
            if (path === "/character/c1") return Promise.resolve(character);
            if (path === "/characterWeapons/c1") return Promise.resolve([
                { weaponId: "w1", characterId: "c1", name: "Dagger", damage: "1d4", range: "20/60", damageType: "piercing", description: "Finesse, light, thrown" },
            ]);
            if (path === "/characterAbilities/c1") return Promise.resolve([
                { abilityId: "a1", characterId: "c1", name: "Arcane Recovery", description: "Recover slots", source: "CLASS", sourceDescription: "", usage: "PASSIVE", recovery: "Long rest" },
            ]);
            if (path === "/character/c1/knownSpells") return Promise.resolve({
                "magic-missile": { spellKey: "magic-missile", spellName: "Magic Missile", spellLevel: 1, characterId: "c1" },
                "shield": { spellKey: "shield", spellName: "Shield", spellLevel: 1, characterId: "c1" },
            });
            return Promise.resolve(undefined);
        },
    },
}));

vi.mock("@/api/dnd5eapi", () => ({
    getLevelInfoForClass: () => Promise.resolve([
        { level: 3, features: [], class: { index: "wizard", name: "Wizard", url: "" }, spellcasting: {
            cantrips_known: 3, spells_known: 0,
            spell_slots_level_1: 4, spell_slots_level_2: 2, spell_slots_level_3: 0, spell_slots_level_4: 0,
            spell_slots_level_5: 0, spell_slots_level_6: 0, spell_slots_level_7: 0, spell_slots_level_8: 0, spell_slots_level_9: 0,
        } },
    ]),
    getSpellDetails: (index: string) => Promise.resolve(index === "shield"
        ? { index, name: "Shield", url: "", level: 1, casting_time: "1 reaction", concentration: false, ritual: false, range: "Self", duration: "1 round" }
        : { index, name: "Magic Missile", url: "", level: 1, casting_time: "1 action", concentration: false, ritual: false, range: "120 feet", duration: "Instantaneous" }),
}));

const renderPage = () => renderWithProviders(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        <MemoryRouter initialEntries={["/dnd/c1/actions"]}>
            <Routes><Route path="/dnd/:id/actions" element={<CharacterActionsPage />} /></Routes>
        </MemoryRouter>
    </SWRConfig>,
);

describe("CharacterActionsPage", () => {
    // Node's experimental global localStorage shadows jsdom's here, so use a small in-memory one.
    beforeEach(() => {
        const store = new Map<string, string>();
        vi.stubGlobal("localStorage", {
            getItem: (k: string) => store.get(k) ?? null,
            setItem: (k: string, v: string) => { store.set(k, String(v)); },
            removeItem: (k: string) => { store.delete(k); },
            clear: () => store.clear(),
        });
    });

    it("groups actions by economy and spends the lowest slot on Cast", async () => {
        renderPage();

        const action = await screen.findByRole("region", { name: "Action" });
        expect(within(action).getByText("Dagger")).toBeInTheDocument();
        expect(await within(action).findByText("Magic Missile")).toBeInTheDocument();
        const reaction = await screen.findByRole("region", { name: "Reaction" });
        expect(await within(reaction).findByText("Shield")).toBeInTheDocument();
        // Thrown dagger is melee, so it also gets an opportunity attack row.
        expect(within(reaction).getByText("Opportunity Attack · Dagger")).toBeInTheDocument();
        expect(screen.getByRole("region", { name: "Passive & Free" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Roll Dagger attack, +4" })).toBeInTheDocument();

        expect(await screen.findByText("Spell Slots")).toBeInTheDocument();
        fireEvent.click(within(action).getByRole("button", { name: "Cast Magic Missile using a 1st-level slot" }));

        expect(screen.getByRole("status")).toHaveTextContent("Cast Magic Missile");
        expect(screen.getByRole("status")).toHaveTextContent("spent a 1st-level slot, 3 left");
        expect(screen.getByRole("button", { name: "1st-level slot 1 of 4, spent. Tap to restore" })).toBeInTheDocument();
        expect(JSON.parse(window.localStorage.getItem("fargopolis.spellSlotsUsed.c1") ?? "[]")[0]).toBe(1);
        expect(screen.getByRole("button", { name: /Roll log \(1\)/ })).toBeInTheDocument();
    });

    it("filters to a single section", async () => {
        renderPage();
        await screen.findByRole("region", { name: "Action" });
        fireEvent.click(screen.getByRole("button", { name: /^Reaction/ }));
        expect(screen.queryByRole("region", { name: "Action" })).not.toBeInTheDocument();
        expect(screen.getByRole("region", { name: "Reaction" })).toBeInTheDocument();
    });
});
