// @vitest-environment jsdom
import "@/test/setup";
import { renderWithProviders } from "@/test/renderWithProviders";
import QuestLedgerEntry from "@/models/QuestLedgerEntry";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QuestHistoryList } from "./QuestHistoryList";

describe("QuestHistoryList", () => {
    it("renders 'No activity yet.' when history is empty", () => {
        renderWithProviders(<QuestHistoryList history={[]} />);

        expect(screen.getByText("No activity yet.")).toBeInTheDocument();
    });

    it("shows the denormalized quest name for a COMPLETION entry", () => {
        const entry = new QuestLedgerEntry("l1", "COMPLETION", 5, "2024-01-01T00:00:00Z", "q1", undefined, "Wash dishes");
        renderWithProviders(<QuestHistoryList history={[entry]} />);

        expect(screen.getByText("Completed Wash dishes")).toBeInTheDocument();
    });

    it("shows the denormalized reward name for a REDEMPTION entry", () => {
        const entry = new QuestLedgerEntry("l1", "REDEMPTION", -4, "2024-01-01T00:00:00Z", undefined, "r1", undefined, "Snack");
        renderWithProviders(<QuestHistoryList history={[entry]} />);

        expect(screen.getByText("Redeemed Snack")).toBeInTheDocument();
    });

    it("falls back to generic text for a pre-existing COMPLETION entry without questName", () => {
        // Simulates a ledger row written before denormalization: the field is simply absent
        // from the object, not present-but-undefined.
        const entry: QuestLedgerEntry = {
            ledgerId: "l1",
            type: "COMPLETION",
            pointsDelta: 5,
            occurredAt: "2024-01-01T00:00:00Z",
            questId: "q1",
        };
        renderWithProviders(<QuestHistoryList history={[entry]} />);

        expect(screen.getByText("Completed a quest")).toBeInTheDocument();
    });

    it("falls back to generic text for a pre-existing REDEMPTION entry without rewardName", () => {
        const entry: QuestLedgerEntry = {
            ledgerId: "l1",
            type: "REDEMPTION",
            pointsDelta: -4,
            occurredAt: "2024-01-01T00:00:00Z",
            rewardId: "r1",
        };
        renderWithProviders(<QuestHistoryList history={[entry]} />);

        expect(screen.getByText("Redeemed a reward")).toBeInTheDocument();
    });
});
