// @vitest-environment jsdom
import "@/test/setup";
import { renderWithProviders } from "@/test/renderWithProviders";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useRoller } from "../rollContext";
import { RollLogProvider } from "../RollLogProvider";

vi.mock("@/helpers/Toasts", () => ({ rollToast: vi.fn() }));

let counter = 0;
const Roller: React.FC = () => {
    const { rollD20 } = useRoller();
    return <button type="button" onClick={() => rollD20(`Test ${++counter}`, 2)}>roll</button>;
};

const renderHarness = () => {
    counter = 0;
    renderWithProviders(<RollLogProvider><Roller /></RollLogProvider>);
};

describe("RollLogProvider", () => {
    it("shows a toast for a roll and opens the modal log from it", async () => {
        renderHarness();
        fireEvent.click(screen.getByRole("button", { name: "roll" }));

        const toast = screen.getByRole("status");
        expect(toast).toHaveTextContent("Test 1");
        expect(toast).toHaveTextContent(/d20 \d+ \+ 2/);

        fireEvent.click(within(toast).getByRole("button", { name: "Log" }));
        const dialog = await screen.findByRole("dialog");
        expect(dialog).toHaveAttribute("aria-modal", "true");
        expect(within(dialog).getByText("Test 1")).toBeInTheDocument();

        fireEvent.click(within(dialog).getByRole("button", { name: "Clear" }));
        expect(within(dialog).getByText("No rolls yet")).toBeInTheDocument();

        fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });

    it("keeps the newest 20 rolls, newest first", async () => {
        renderHarness();
        const button = screen.getByRole("button", { name: "roll" });
        for (let i = 0; i < 25; i++) fireEvent.click(button);

        fireEvent.click(within(screen.getByRole("status")).getByRole("button", { name: "Log" }));
        const dialog = await screen.findByRole("dialog");
        const items = within(dialog).getAllByRole("listitem");
        expect(items).toHaveLength(20);
        expect(items[0]).toHaveTextContent("Test 25");
        expect(items[19]).toHaveTextContent("Test 6");
    });
});
