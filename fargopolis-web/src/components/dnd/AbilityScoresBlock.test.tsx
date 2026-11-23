// @vitest-environment jsdom
import "@/test/setup";
import { renderWithProviders } from "@/test/renderWithProviders";
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AbilityScoresBlock } from "./AbilityScoresBlock";
import { testCharacter } from "./testCharacter";

const rollToastMock = vi.hoisted(() => vi.fn());
vi.mock("@/helpers/Toasts", () => ({ rollToast: (...args: unknown[]) => rollToastMock(...args) }));

const NOTE = "Default scores (all 10). Set real scores in Edit.";

describe("AbilityScoresBlock", () => {
    it("shows the defaults note for all-10 scores when asked", () => {
        renderWithProviders(<AbilityScoresBlock character={testCharacter()} showDefaultsNote />);

        expect(screen.getByText(NOTE)).toBeInTheDocument();
    });

    it("hides the defaults note without showDefaultsNote", () => {
        renderWithProviders(<AbilityScoresBlock character={testCharacter()} />);

        expect(screen.queryByText(NOTE)).not.toBeInTheDocument();
    });

    it("renders roll pills with modifier and proficiency in their names, and rolls on click", () => {
        renderWithProviders(
            <AbilityScoresBlock
                showDefaultsNote
                character={testCharacter({
                    level: 5,
                    abilityScores: { str: 12, dex: 16, con: 10, int: 10, wis: 10, cha: 10 },
                    savingThrowProficiencies: ["dex"],
                })}
            />,
        );

        expect(screen.queryByText(NOTE)).not.toBeInTheDocument();
        expect(screen.getByText("Strength")).toBeInTheDocument();
        expect(screen.getByText("tap to roll")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Roll Dexterity save, +6, proficient" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Roll Strength save, +1" })).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Roll Strength check, +1" }));
        expect(rollToastMock).toHaveBeenCalledTimes(1);
        expect(rollToastMock.mock.calls[0][0]).toMatch(/^Strength check: d20\+1/);
    });
});
