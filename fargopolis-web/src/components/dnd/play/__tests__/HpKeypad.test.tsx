// @vitest-environment jsdom
import "@/test/setup";
import { renderWithProviders } from "@/test/renderWithProviders";
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HpKeypad } from "../HpKeypad";

const press = (name: string) => fireEvent.click(screen.getByRole("button", { name }));
const display = () => screen.getByTestId("hp-keypad-display");

describe("HpKeypad", () => {
    it("types up to 3 digits, backspaces, clears and applies damage", () => {
        const onApply = vi.fn();
        renderWithProviders(<HpKeypad onApply={onApply} />);

        ["1", "2", "3", "4"].forEach(press);
        expect(display()).toHaveTextContent("123");
        press("Backspace");
        expect(display()).toHaveTextContent("12");
        press("Clear");
        expect(display()).toHaveTextContent("0");
        expect(screen.getByRole("button", { name: "Damage" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Heal" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Temp" })).toBeDisabled();

        press("7");
        press("Damage");
        expect(onApply).toHaveBeenCalledWith("damage", 7);
        expect(display()).toHaveTextContent("0");
    });

    it("applies heal and temp with the typed amount", () => {
        const onApply = vi.fn();
        renderWithProviders(<HpKeypad onApply={onApply} />);

        press("5");
        press("Heal");
        press("3");
        press("Temp");
        expect(onApply.mock.calls).toEqual([["heal", 5], ["temp", 3]]);
    });
});
