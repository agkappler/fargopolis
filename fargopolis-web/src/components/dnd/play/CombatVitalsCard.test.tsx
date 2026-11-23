// @vitest-environment jsdom
import "@/test/setup";
import RequestManager from "@/helpers/RequestManager";
import Character from "@/models/Character";
import { renderWithProviders } from "@/test/renderWithProviders";
import { act, fireEvent, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { testCharacter } from "../testCharacter";
import { CombatVitalsCard } from "./CombatVitalsCard";
import { useHitPointsTracker } from "./useHitPointsTracker";

const auth = vi.hoisted(() => ({ isSignedIn: true }));
vi.mock("@clerk/react", () => ({
    useAuth: () => ({ isSignedIn: auth.isSignedIn, getToken: () => Promise.resolve("tok") }),
}));
vi.mock("@/helpers/RequestManager", () => ({ default: { post: vi.fn(() => Promise.resolve({})), get: vi.fn() } }));
vi.mock("@/helpers/Toasts", () => ({ rollToast: vi.fn(), errorToast: vi.fn(), successToast: vi.fn() }));

const post = vi.mocked(RequestManager.post);

const Harness: React.FC<{ character: Character }> = ({ character }) => {
    const tracker = useHitPointsTracker(character);
    return <CombatVitalsCard character={character} tracker={tracker} />;
};

const renderCard = () => renderWithProviders(
    <MemoryRouter>
        <Harness character={testCharacter({ hitPoints: { current: 10, max: 20, temp: 3 }, armorClass: 15, speed: 30 })} />
    </MemoryRouter>,
);

const hpButton = () => screen.getByRole("button", { name: /^Hit points \d+ of 20/ });

describe("CombatVitalsCard", () => {
    beforeEach(() => {
        auth.isSignedIn = true;
        post.mockClear();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it("shows the temp pill and stat tiles", () => {
        renderCard();
        expect(screen.getByText("+3 temp")).toBeInTheDocument();
        expect(hpButton()).toHaveTextContent("10 / 20");
        expect(screen.getByText("15")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Roll initiative, +0" })).toBeInTheDocument();
        expect(screen.getByText("Passive Perception")).toBeInTheDocument();
    });

    it("steppers take temp HP first and save once after the debounce", async () => {
        vi.useFakeTimers();
        renderCard();

        fireEvent.click(screen.getByRole("button", { name: "Take 1 damage" }));
        fireEvent.click(screen.getByRole("button", { name: "Take 1 damage" }));
        expect(screen.getByText("+1 temp")).toBeInTheDocument();
        expect(hpButton()).toHaveTextContent("10 / 20");
        expect(post).not.toHaveBeenCalled();

        await act(async () => { await vi.advanceTimersByTimeAsync(600); });
        expect(post).toHaveBeenCalledTimes(1);
        expect(post.mock.calls[0][0]).toBe("/updateCharacter");
        expect(post.mock.calls[0][1]).toMatchObject({ hitPoints: { current: 10, max: 20, temp: 1 } });
    });

    it("applies keypad damage (temp first) and healing right away", async () => {
        renderCard();

        fireEvent.click(hpButton());
        fireEvent.click(await screen.findByRole("button", { name: "5" }));
        fireEvent.click(screen.getByRole("button", { name: "Damage" }));
        expect(hpButton()).toHaveTextContent("8 / 20");
        await act(async () => {});
        expect(post).toHaveBeenCalledTimes(1);
        expect(post.mock.calls[0][1]).toMatchObject({ hitPoints: { current: 8, max: 20, temp: 0 } });

        fireEvent.click(hpButton());
        const nine = await screen.findByRole("button", { name: "9" });
        fireEvent.click(nine);
        fireEvent.click(screen.getByRole("button", { name: "9" }));
        fireEvent.click(screen.getByRole("button", { name: "Heal" }));
        expect(hpButton()).toHaveTextContent("20 / 20");
        await act(async () => {});
        expect(post).toHaveBeenCalledTimes(2);
    });

    it("disables the steppers when signed out", () => {
        auth.isSignedIn = false;
        renderCard();
        expect(screen.getByRole("button", { name: "Take 1 damage" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Heal 1" })).toBeDisabled();
    });
});
