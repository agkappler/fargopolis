// @vitest-environment jsdom
import "@/test/setup";
import { renderWithProviders } from "@/test/renderWithProviders";
import { questCacheKey } from "@/helpers/QuestCache";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { SWRConfig } from "swr";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QuestsPage } from "./QuestsPage";

// Mutable auth state so tests can simulate not-yet-loaded auth, sign-out, and account switches.
const authRef = vi.hoisted(() => ({ isLoaded: true, isSignedIn: true, userId: "user_a" as string | null }));
vi.mock("@clerk/react", () => ({
    useAuth: () => ({
        isLoaded: authRef.isLoaded,
        isSignedIn: authRef.isSignedIn,
        userId: authRef.userId,
        getToken: () => Promise.resolve("tok"),
    }),
}));

// Per-test control of the RequestManager mock: `overrides` returns a fixed value for a path;
// `pending` makes a path's request hang (counting calls) until the test resolves it.
type PendingEntry = { calls: number; resolve?: (v: unknown) => void };
const api = vi.hoisted(() => ({
    overrides: new Map<string, unknown>(),
    pending: new Map<string, { calls: number; resolve?: (v: unknown) => void }>(),
}));

vi.mock("@/helpers/RequestManager", () => ({
    default: {
        get: (path: string) => {
            const entry = api.pending.get(path);
            if (entry) {
                entry.calls += 1;
                return new Promise((res) => {
                    entry.resolve = res;
                });
            }
            if (api.overrides.has(path)) {
                return Promise.resolve(api.overrides.get(path));
            }
            if (path === "/quests") {
                return Promise.resolve([{ questId: "q1", name: "Wash dishes", description: "", pointValue: 5, active: true }]);
            }
            if (path === "/questBalance") {
                return Promise.resolve({ total: 5 });
            }
            if (path === "/questRewards" || path === "/questRewards?includeInactive=true") {
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

const washDishes = [{ questId: "q1", name: "Wash dishes", description: "", pointValue: 5, active: true }];

function setPending(path: string): PendingEntry {
    const entry: PendingEntry = { calls: 0 };
    api.pending.set(path, entry);
    return entry;
}

async function resolvePending(path: string, value: unknown) {
    const entry = api.pending.get(path);
    api.pending.delete(path);
    await act(async () => {
        entry?.resolve?.(value);
    });
}

function seed(userId: string, url: string, name: string, questId = "q-seed", pointValue = 2) {
    localStorage.setItem(
        questCacheKey(userId, url),
        JSON.stringify([{ questId, name, description: "", pointValue, active: true }]),
    );
}

/** Render with a fresh, isolated SWR cache per test; rerenders keep the same cache. */
function renderPage() {
    const cache = new Map();
    const tree = () => (
        <SWRConfig value={{ provider: () => cache, dedupingInterval: 0 }}>
            <MemoryRouter>
                <QuestsPage />
            </MemoryRouter>
        </SWRConfig>
    );
    const result = renderWithProviders(tree());
    return { ...result, rerenderPage: () => result.rerender(tree()) };
}

function toggleShowArchived() {
    fireEvent.click(screen.getByLabelText("Show archived"));
}

describe("QuestsPage quest persistence and sorting", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(async () => {
        // Settle any dangling requests so nothing resolves after the test.
        for (const entry of api.pending.values()) {
            await act(async () => {
                entry.resolve?.([]);
            });
        }
        api.pending.clear();
        api.overrides.clear();
        localStorage.clear();
        authRef.isLoaded = true;
        authRef.isSignedIn = true;
        authRef.userId = "user_a";
    });

    it("renders persisted quests on mount while the request is pending, then swaps in and persists fresh data", async () => {
        seed("user_a", "/quests", "Persisted chore", "q-old");
        const entry = setPending("/quests");

        renderPage();

        expect(await screen.findByText("Persisted chore")).toBeInTheDocument();
        expect(screen.getByText("Add Quest")).toBeInTheDocument();
        await waitFor(() => expect(entry.calls).toBeGreaterThan(0));

        await resolvePending("/quests", washDishes);

        expect(await screen.findByText("Wash dishes")).toBeInTheDocument();
        expect(screen.queryByText("Persisted chore")).not.toBeInTheDocument();
        const stored = JSON.parse(localStorage.getItem(questCacheKey("user_a", "/quests")) ?? "[]");
        expect(stored[0].questId).toBe("q1");
    });

    it("never renders another user's persisted quests", async () => {
        seed("user_b", "/quests", "Other user chore");
        const entry = setPending("/quests");

        renderPage();

        await waitFor(() => expect(entry.calls).toBeGreaterThan(0));
        expect(screen.queryByText("Other user chore")).not.toBeInTheDocument();
        expect(screen.queryByText("Add Quest")).not.toBeInTheDocument();

        await resolvePending("/quests", washDishes);

        expect(await screen.findByText("Wash dishes")).toBeInTheDocument();
        expect(screen.queryByText("Other user chore")).not.toBeInTheDocument();
    });

    it("shows only the new user's persisted quests after an account switch while mounted", async () => {
        const { rerenderPage } = renderPage();
        expect(await screen.findByText("Wash dishes")).toBeInTheDocument();

        seed("user_b", "/quests", "B chore", "q-b");
        const entry = setPending("/quests");
        authRef.userId = "user_b";
        rerenderPage();

        expect(await screen.findByText("B chore")).toBeInTheDocument();
        expect(screen.queryByText("Wash dishes")).not.toBeInTheDocument();
        await waitFor(() => expect(entry.calls).toBeGreaterThan(0));
    });

    it("shows the spinner, not the previous user's quests, after switching to a user with nothing persisted", async () => {
        const { rerenderPage } = renderPage();
        expect(await screen.findByText("Wash dishes")).toBeInTheDocument();

        const entry = setPending("/quests");
        authRef.userId = "user_b";
        rerenderPage();

        await waitFor(() => expect(entry.calls).toBeGreaterThan(0));
        expect(screen.queryByText("Wash dishes")).not.toBeInTheDocument();
        expect(screen.queryByText("Add Quest")).not.toBeInTheDocument();
    });

    it("hides quests after sign-out while mounted", async () => {
        const { rerenderPage } = renderPage();
        expect(await screen.findByText("Wash dishes")).toBeInTheDocument();

        authRef.isSignedIn = false;
        authRef.userId = null;
        rerenderPage();

        expect(screen.queryByText("Wash dishes")).not.toBeInTheDocument();
    });

    it("renders nothing from storage and fetches nothing before auth loads", async () => {
        authRef.isLoaded = false;
        authRef.isSignedIn = false;
        authRef.userId = null;
        seed("user_a", "/quests", "Persisted chore");
        const entry = setPending("/quests");

        renderPage();

        expect(await screen.findByText("Add Quest")).toBeInTheDocument();
        expect(screen.queryByText("Persisted chore")).not.toBeInTheDocument();
        expect(entry.calls).toBe(0);
    });

    it("still loads quests when storage is unavailable", async () => {
        vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
            throw new Error("unavailable");
        });
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("unavailable");
        });

        renderPage();

        expect(await screen.findByText("Wash dishes")).toBeInTheDocument();
    });

    it("shows the spinner when toggling Show archived with no persisted archived copy", async () => {
        const entry = setPending("/quests?includeInactive=true");
        renderPage();
        expect(await screen.findByText("Wash dishes")).toBeInTheDocument();

        toggleShowArchived();

        await waitFor(() => expect(entry.calls).toBeGreaterThan(0));
        expect(screen.queryByText("Wash dishes")).not.toBeInTheDocument();
        expect(screen.queryByText("Add Quest")).not.toBeInTheDocument();

        await resolvePending("/quests?includeInactive=true", [
            { questId: "q-arch", name: "Old chore", description: "", pointValue: 1, active: false },
        ]);
        expect(await screen.findByText("Old chore")).toBeInTheDocument();
    });

    it("shows the persisted archived copy while revalidating after toggling Show archived", async () => {
        seed("user_a", "/quests?includeInactive=true", "Archived persisted", "q-ap");
        const entry = setPending("/quests?includeInactive=true");
        renderPage();
        expect(await screen.findByText("Wash dishes")).toBeInTheDocument();

        toggleShowArchived();

        expect(await screen.findByText("Archived persisted")).toBeInTheDocument();
        await waitFor(() => expect(entry.calls).toBeGreaterThan(0));
        expect(entry.resolve).toBeDefined();
    });

    it("renders quests in ascending point order after the Add Quest card", async () => {
        api.overrides.set("/quests", [
            { questId: "q-high", name: "High", description: "", pointValue: 20, active: true },
            { questId: "q-mid-b", name: "Mid", description: "", pointValue: 7, active: true },
            { questId: "q-low", name: "Low", description: "", pointValue: 1, active: true },
            { questId: "q-mid-a", name: "Alpha mid", description: "", pointValue: 7, active: true },
        ]);

        renderPage();
        await screen.findByText("High");

        const order = ["Add Quest", "Low", "Alpha mid", "Mid", "High"].map((t) => screen.getByText(t));
        for (let i = 0; i < order.length - 1; i++) {
            expect(order[i].compareDocumentPosition(order[i + 1]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        }
    });
});
