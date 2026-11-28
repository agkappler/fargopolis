// @vitest-environment jsdom
import "@/test/setup";
import { renderWithProviders } from "@/test/renderWithProviders";
import QuestReward from "@/models/QuestReward";
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RewardCard } from "../RewardCard";

vi.mock("@clerk/react", () => ({ useAuth: () => ({ getToken: () => Promise.resolve("tok") }) }));

const postMock = vi.hoisted(() => vi.fn());
vi.mock("@/helpers/RequestManager", () => ({
    default: { post: (...args: unknown[]) => postMock(...args) },
}));

const reward = new QuestReward("r1", "Snack", "A tasty snack", 10, true);

describe("RewardCard", () => {
    it("enables the Redeem button when the balance covers the point cost", () => {
        renderWithProviders(<RewardCard reward={reward} balance={10} onRedeem={vi.fn()} />);

        expect(screen.getByRole("button", { name: /redeem/i })).toBeEnabled();
    });

    it("disables the Redeem button when the balance is less than the point cost", () => {
        renderWithProviders(<RewardCard reward={reward} balance={9} onRedeem={vi.fn()} />);

        expect(screen.getByRole("button", { name: /redeem/i })).toBeDisabled();
    });

    it("shows an Archived label and disables Redeem even with enough balance if inactive", () => {
        const archivedReward = new QuestReward("r2", "Old snack", "", 10, false);
        renderWithProviders(<RewardCard reward={archivedReward} balance={100} onRedeem={vi.fn()} />);

        expect(screen.getByText("Archived")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /redeem/i })).toBeDisabled();
    });
});
