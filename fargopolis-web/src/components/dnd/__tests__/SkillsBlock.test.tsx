// @vitest-environment jsdom
import "@/test/setup";
import { renderWithProviders } from "@/test/renderWithProviders";
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SkillsBlock } from "../SkillsBlock";
import { testCharacter } from "./testCharacter";

const rollToastMock = vi.hoisted(() => vi.fn());
vi.mock("@/helpers/Toasts", () => ({ rollToast: (...args: unknown[]) => rollToastMock(...args) }));

const skillButtons = () => screen.getAllByRole("button", { name: /^Roll / });

describe("SkillsBlock", () => {
    it("renders all 18 skills by default (Detail page)", () => {
        renderWithProviders(<SkillsBlock character={testCharacter({ skillProficiencies: ["stealth"] })} />);
        expect(skillButtons()).toHaveLength(18);
        expect(screen.getAllByText("DEX").length).toBeGreaterThan(0);
        fireEvent.click(screen.getByRole("button", { name: "Roll Stealth, +2, proficient" }));
        expect(rollToastMock.mock.calls[0][0]).toMatch(/^Stealth: d20\+2/);
    });

    it("compact shows proficient skills only, with a toggle", () => {
        renderWithProviders(
            <SkillsBlock variant="compact" character={testCharacter({ skillProficiencies: ["stealth", "perception"] })} />,
        );
        expect(skillButtons()).toHaveLength(2);
        fireEvent.click(screen.getByRole("button", { name: "Show all 18" }));
        expect(skillButtons()).toHaveLength(18);
        fireEvent.click(screen.getByRole("button", { name: "Proficient only" }));
        expect(skillButtons()).toHaveLength(2);
    });

    it("compact shows all skills and no toggle without proficiencies", () => {
        renderWithProviders(<SkillsBlock variant="compact" character={testCharacter()} />);
        expect(skillButtons()).toHaveLength(18);
        expect(screen.queryByRole("button", { name: "Show all 18" })).not.toBeInTheDocument();
    });
});
