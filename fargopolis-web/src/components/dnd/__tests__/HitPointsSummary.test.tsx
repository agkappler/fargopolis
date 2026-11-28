// @vitest-environment jsdom
import "@/test/setup";
import { renderWithProviders } from "@/test/renderWithProviders";
import { fireEvent, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { HitPointsSummary } from "../HitPointsSummary";
import { testCharacter } from "./testCharacter";

describe("HitPointsSummary", () => {
    it("shows the empty state when max HP is unset and opens Edit from it", () => {
        const onEdit = vi.fn();
        renderWithProviders(
            <MemoryRouter>
                <HitPointsSummary character={testCharacter()} onEdit={onEdit} />
            </MemoryRouter>,
        );

        expect(screen.getByText("No max HP yet")).toBeInTheDocument();
        expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Set max HP" }));
        expect(onEdit).toHaveBeenCalledTimes(1);
        expect(screen.getByRole("link", { name: /track hp on the play page/i })).toHaveAttribute("href", "/dnd/char-1/actions");
    });

    it("shows current / max, the temp pill and the progress bar when filled", () => {
        renderWithProviders(
            <MemoryRouter>
                <HitPointsSummary character={testCharacter({ hitPoints: { current: 12, max: 20, temp: 3 } })} />
            </MemoryRouter>,
        );

        expect(screen.getByText("12")).toBeInTheDocument();
        expect(screen.getByText("/ 20")).toBeInTheDocument();
        expect(screen.getByText("+3 temp")).toBeInTheDocument();
        const bar = screen.getByRole("progressbar");
        expect(bar).toHaveAttribute("aria-valuenow", "12");
        expect(bar).toHaveAttribute("aria-valuemax", "20");
        expect(screen.queryByText("No max HP yet")).not.toBeInTheDocument();
        expect(screen.getByRole("link", { name: /track hp on the play page/i })).toHaveAttribute("href", "/dnd/char-1/actions");
    });

    it("has no temp pill when temp is 0", () => {
        renderWithProviders(
            <MemoryRouter>
                <HitPointsSummary character={testCharacter({ hitPoints: { current: 12, max: 20, temp: 0 } })} />
            </MemoryRouter>,
        );

        expect(screen.queryByText(/temp/i)).not.toBeInTheDocument();
    });
});
