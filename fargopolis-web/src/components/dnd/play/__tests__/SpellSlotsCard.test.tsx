// @vitest-environment jsdom
import "@/test/setup";
import { renderWithProviders } from "@/test/renderWithProviders";
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SpellSlotsCard } from "../SpellSlotsCard";

const Z = [0, 0, 0, 0, 0, 0, 0, 0, 0];

describe("SpellSlotsCard", () => {
    it("shows all 9 levels and pips for a level-20 full caster", () => {
        const onTogglePip = vi.fn();
        renderWithProviders(<SpellSlotsCard max={[4, 3, 3, 3, 3, 2, 2, 1, 1]} used={[1, ...Z.slice(1)]} onTogglePip={onTogglePip} />);

        ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th"].forEach(l =>
            expect(screen.getByText(l)).toBeInTheDocument());
        expect(screen.getAllByRole("button", { name: /-level slot/ })).toHaveLength(22);
        expect(screen.getByRole("button", { name: "1st-level slot 1 of 4, spent. Tap to restore" })).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "2nd-level slot 1 of 3, available. Tap to spend" }));
        expect(onTogglePip).toHaveBeenCalledWith(2, 0);
    });

    it("renders nothing without slots", () => {
        renderWithProviders(<SpellSlotsCard max={Z} used={Z} onTogglePip={vi.fn()} />);
        expect(screen.queryByText("Spell Slots")).not.toBeInTheDocument();
    });
});
