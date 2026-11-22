// @vitest-environment jsdom
import "@/test/setup";
import { renderWithProviders } from "@/test/renderWithProviders";
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CombatStatsBlock } from "./CombatStatsBlock";
import { testCharacter } from "./testCharacter";

const rollToastMock = vi.hoisted(() => vi.fn());
vi.mock("@/helpers/Toasts", () => ({ rollToast: (...args: unknown[]) => rollToastMock(...args) }));

describe("CombatStatsBlock", () => {
    it("shows the empty state for a character with no vitals and opens Edit from it", () => {
        const onEdit = vi.fn();
        renderWithProviders(<CombatStatsBlock character={testCharacter()} onEdit={onEdit} />);

        expect(screen.getByText("AC, initiative and speed aren't set yet")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /roll initiative/i })).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Set up vitals" }));
        expect(onEdit).toHaveBeenCalledTimes(1);
    });

    it("has no Set up vitals button without onEdit", () => {
        renderWithProviders(<CombatStatsBlock character={testCharacter()} />);

        expect(screen.getByText("AC, initiative and speed aren't set yet")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Set up vitals" })).not.toBeInTheDocument();
    });

    it("shows AC/initiative/speed tiles and no spell rows for a fighter", () => {
        renderWithProviders(
            <CombatStatsBlock character={testCharacter({ armorClass: 16, speed: 30, initiativeBonus: 2 })} />,
        );

        expect(screen.getByText("16")).toBeInTheDocument();
        expect(screen.getByText("30 ft")).toBeInTheDocument();
        const init = screen.getByRole("button", { name: "Roll initiative, +2" });
        fireEvent.click(init);
        expect(rollToastMock).toHaveBeenCalledTimes(1);
        expect(rollToastMock.mock.calls[0][0]).toMatch(/^Initiative: d20\+2/);
        expect(screen.queryByText("Spell Save DC")).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /roll spell attack/i })).not.toBeInTheDocument();
    });

    it("shows Spell Save DC and a Spell Attack roll for a wizard", () => {
        renderWithProviders(
            <CombatStatsBlock
                character={testCharacter({
                    className: "wizard",
                    level: 5,
                    armorClass: 12,
                    speed: 30,
                    abilityScores: { str: 8, dex: 14, con: 12, int: 16, wis: 10, cha: 10 },
                })}
            />,
        );

        expect(screen.getByText("Spell Save DC")).toBeInTheDocument();
        expect(screen.getByText("14")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Roll spell attack, +6" })).toBeInTheDocument();
    });
});
