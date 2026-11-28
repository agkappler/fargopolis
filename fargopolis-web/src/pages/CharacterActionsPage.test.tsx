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
                "fire-bolt": { spellKey: "fire-bolt", spellName: "Fire Bolt", spellLevel: 0, characterId: "c1" },
                "burning-hands": { spellKey: "burning-hands", spellName: "Burning Hands", spellLevel: 1, characterId: "c1" },
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
    getRelativeUrlInfo: (url: string) => Promise.resolve({
        index: url.split("/").pop(), name: "Magic Missile", level: 1, casting_time: "1 action", range: "120 feet",
        duration: "Instantaneous", desc: ["Three glowing darts of magical force."],
    }),
    getSpellDetails: (index: string) => Promise.resolve(index === "fire-bolt"
        ? { index, name: "Fire Bolt", url: "", level: 0, casting_time: "1 action", concentration: false, ritual: false, range: "120 feet", duration: "Instantaneous", attack_type: "ranged" }
        : index === "burning-hands"
        ? { index, name: "Burning Hands", url: "", level: 1, casting_time: "1 action", concentration: false, ritual: false, range: "Self", duration: "Instantaneous", dc: { dc_type: { index: "dex", name: "DEX" }, dc_success: "half" } }
        : index === "shield"
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
        // Level 3 wizard, INT 16: DC 8 + 2 + 3 = 13, spell attack +5 (rollable) in the slots header.
        expect(screen.getByText("DC 13")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Roll spell attack, +5" }));
        expect(screen.getByRole("status")).toHaveTextContent("Spell attack");
        fireEvent.click(within(action).getByRole("button", { name: "Cast Magic Missile using a 1st-level slot" }));

        expect(screen.getByRole("status")).toHaveTextContent("Cast Magic Missile");
        expect(screen.getByRole("status")).toHaveTextContent("spent a 1st-level slot, 3 left");
        expect(screen.getByRole("button", { name: "1st-level slot 1 of 4, spent. Tap to restore" })).toBeInTheDocument();
        expect(JSON.parse(window.localStorage.getItem("fargopolis.spellSlotsUsed.c1") ?? "[]")[0]).toBe(1);
        expect(screen.getByRole("button", { name: /Roll log \(2\)/ })).toBeInTheDocument();
    });

    it("opens the spell details modal from a spell row name", async () => {
        renderPage();
        const action = await screen.findByRole("region", { name: "Action" });
        fireEvent.click(await within(action).findByRole("button", { name: "Magic Missile details" }));
        const dialog = await screen.findByRole("dialog");
        expect(await within(dialog).findByText("Three glowing darts of magical force.")).toBeInTheDocument();
        // Read-only here: no add/remove known spell buttons on the Play page.
        expect(within(dialog).queryByRole("button", { name: /known spells/ })).not.toBeInTheDocument();
    });

    it("opens the ability details modal from an ability row name", async () => {
        renderPage();
        const passive = await screen.findByRole("region", { name: "Passive & Free" });
        fireEvent.click(within(passive).getByRole("button", { name: "Arcane Recovery details" }));
        const dialog = await screen.findByRole("dialog");
        expect(within(dialog).getByText("Recover slots")).toBeInTheDocument();
        expect(within(dialog).getByText("Recovery: Long rest")).toBeInTheDocument();
    });

    it("shows a spell attack roll on attack spells and the save DC on save spells", async () => {
        renderPage();
        const action = await screen.findByRole("region", { name: "Action" });
        // INT 16, level 3: attack +5, DC 13.
        fireEvent.click(await within(action).findByRole("button", { name: "Roll Fire Bolt spell attack, +5" }));
        expect(screen.getByRole("status")).toHaveTextContent("Fire Bolt spell attack");
        expect(await within(action).findByText("DC 13 DEX · ½")).toBeInTheDocument();
        expect(within(action).queryByRole("button", { name: /Burning Hands spell attack/ })).not.toBeInTheDocument();
    });

    it("filters to a single section", async () => {
        renderPage();
        await screen.findByRole("region", { name: "Action" });
        fireEvent.click(screen.getByRole("button", { name: /^Reaction/ }));
        expect(screen.queryByRole("region", { name: "Action" })).not.toBeInTheDocument();
        expect(screen.getByRole("region", { name: "Reaction" })).toBeInTheDocument();
    });
});
