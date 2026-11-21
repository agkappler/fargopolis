// @vitest-environment jsdom
import "@/test/setup";
import { renderWithProviders } from "@/test/renderWithProviders";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
                    {
                        ledgerId: "l1",
                        type: "COMPLETION",
                        pointsDelta: 5,
                        occurredAt: "2024-01-01T00:00:00Z",
                        questId: "q1",
                        questName: "Wash dishes",
                    },
                ]);
            }
            return Promise.resolve(undefined);
        },
    },
}));

// `vi.mock` is hoisted to the top of the module regardless of where it's written, so a single
// mutable flag (toggled per-test below) is needed to switch `useMediaQuery` between desktop and
// mobile across tests in this one file -- a partial mock, preserving every other Chakra export
// (`Box`, `Switch`, `Tabs`, `Text`, etc.) the real page still uses.
const isMobileRef = vi.hoisted(() => ({ current: false }));
vi.mock("@chakra-ui/react", async () => {
    const actual = await vi.importActual<typeof import("@chakra-ui/react")>("@chakra-ui/react");
    return { ...actual, useMediaQuery: () => [isMobileRef.current] };
});

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
        // History entry now self-describes with the denormalized quest name, not generic text.
        expect(await screen.findByText("Completed Wash dishes")).toBeInTheDocument();
    });
});

describe("QuestsPage on mobile", () => {
    beforeEach(() => {
        isMobileRef.current = true;
    });

    afterEach(() => {
        isMobileRef.current = false;
    });

    it("shows Quests/Rewards/History tabs, defaulting to the Quests tab", async () => {
        renderWithProviders(
            <MemoryRouter>
                <QuestsPage />
            </MemoryRouter>,
        );

        expect(await screen.findByText("Wash dishes")).toBeInTheDocument();
        expect(screen.getByRole("tab", { name: "Quests" })).toBeInTheDocument();
        expect(screen.getByRole("tab", { name: "Rewards" })).toBeInTheDocument();
        expect(screen.getByRole("tab", { name: "History" })).toBeInTheDocument();

        // Default activeSection is "quests": the reward card and history content aren't rendered.
        expect(screen.queryByText("Snack")).not.toBeInTheDocument();
        expect(screen.queryByText("Completed Wash dishes")).not.toBeInTheDocument();
    });

    it("switches to the History tab and shows the denormalized history entry", async () => {
        renderWithProviders(
            <MemoryRouter>
                <QuestsPage />
            </MemoryRouter>,
        );

        await screen.findByText("Wash dishes");
        const historyTab = screen.getByRole("tab", { name: "History" });

        // Chakra v3/Ark Tabs.Trigger + userEvent.click is unverified in this repo's existing
        // tests; try it first, then fall back to firing native pointer events if the click
        // doesn't actually flip `activeSection` (observable via content not changing).
        const user = userEvent.setup();
        await user.click(historyTab);

        if (screen.queryByText("Completed Wash dishes") === null) {
            fireEvent.pointerDown(historyTab);
            fireEvent.pointerUp(historyTab);
            fireEvent.click(historyTab);
        }

        await waitFor(() => expect(screen.getByText("Completed Wash dishes")).toBeInTheDocument());
        expect(screen.queryByText("Snack")).not.toBeInTheDocument();
    });
});
