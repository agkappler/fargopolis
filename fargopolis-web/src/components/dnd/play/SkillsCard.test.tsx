// @vitest-environment jsdom
import "@/test/setup";
import { renderWithProviders } from "@/test/renderWithProviders";
import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { testCharacter } from "../testCharacter";
import { SkillsCard } from "./SkillsCard";

const skillButtons = () => screen.getAllByRole("button", { name: /^Roll / });

describe("SkillsCard", () => {
    it("puts the show-all toggle in the card header, not under the grid", () => {
        renderWithProviders(
            <SkillsCard character={testCharacter({ skillProficiencies: ["stealth", "perception"] })} />,
        );
        expect(skillButtons()).toHaveLength(2);
        expect(screen.getAllByRole("button", { name: /Show all 18|Proficient only/ })).toHaveLength(1);

        // The toggle shares a row with the "Skills" title.
        const titleRow = screen.getByText("Skills").parentElement as HTMLElement;
        fireEvent.click(within(titleRow).getByRole("button", { name: "Show all 18" }));
        expect(skillButtons()).toHaveLength(18);
        fireEvent.click(within(titleRow).getByRole("button", { name: "Proficient only" }));
        expect(skillButtons()).toHaveLength(2);
    });

    it("shows all skills and no toggle without proficiencies", () => {
        renderWithProviders(<SkillsCard character={testCharacter()} />);
        expect(skillButtons()).toHaveLength(18);
        expect(screen.queryByRole("button", { name: /Show all 18|Proficient only/ })).not.toBeInTheDocument();
    });
});
