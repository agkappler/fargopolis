// @vitest-environment jsdom
import "@/test/setup";
import { renderWithProviders } from "@/test/renderWithProviders";
import { describe, expect, it } from "vitest";
import { CharacterSubtitle } from "../CharacterSubtitle";
import { testCharacter } from "./testCharacter";

describe("CharacterSubtitle", () => {
    it("shows race, level, class and subclass", () => {
        const { container } = renderWithProviders(
            <CharacterSubtitle character={testCharacter({ race: "elf", subrace: "wood-elf", className: "ranger", subclassName: "hunter", level: 5 })} />,
        );

        expect(container).toHaveTextContent("Wood Elf · Level 5 Ranger (Hunter)");
    });

    it("omits the subclass when it is empty", () => {
        const { container } = renderWithProviders(
            <CharacterSubtitle character={testCharacter({ race: "human", className: "fighter", level: 2 })} />,
        );

        expect(container).toHaveTextContent("Human · Level 2 Fighter");
        expect(container.textContent).not.toContain("(");
    });
});
