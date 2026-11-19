// @vitest-environment jsdom
import "@/test/setup";
import { renderWithProviders } from "@/test/renderWithProviders";
import { screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { QuestsPage } from "./QuestsPage";

vi.mock("@clerk/react", () => ({
    useAuth: () => ({ isLoaded: true, isSignedIn: true, getToken: () => Promise.resolve("tok") }),
}));

vi.mock("@/helpers/RequestManager", () => ({
    default: {
        get: (path: string) => {
            if (path === "/quests") {
                return Promise.resolve([{ questId: "q1", name: "Wash dishes", description: "", pointValue: 5, active: true }]);
            }
            if (path === "/questBalance") {
                return Promise.resolve({ total: 5 });
            }
            if (path === "/questRewards") {
                return Promise.resolve([{ rewardId: "r1", name: "Snack", description: "", pointCost: 4, active: true }]);
            }
            if (path === "/questHistory") {
                return Promise.resolve([
                    { ledgerId: "l1", type: "COMPLETION", pointsDelta: 5, occurredAt: "2024-01-01T00:00:00Z", questId: "q1" },
                ]);
            }
            return Promise.resolve(undefined);
        },
    },
}));

describe("QuestsPage", () => {
    it("renders the catalog, rewards, balance, and history without throwing", async () => {
        // QuestsPage renders PageHeader, which calls useNavigate() -- needs a Router context.
        renderWithProviders(
            <MemoryRouter>
                <QuestsPage />
            </MemoryRouter>,
        );

        expect(await screen.findByText("Wash dishes")).toBeInTheDocument();
        await waitFor(() => expect(screen.getByText("Snack")).toBeInTheDocument());
        expect(screen.getByText("5")).toBeInTheDocument();
    });
});
