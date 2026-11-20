// @vitest-environment jsdom
import "@/test/setup";
import { renderWithProviders } from "@/test/renderWithProviders";
import Quest from "@/models/Quest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QuestForm } from "./QuestForm";

const authState = vi.hoisted(() => ({ isLoaded: true, isSignedIn: true }));
vi.mock("@clerk/react", () => ({
    useAuth: () => ({ ...authState, getToken: () => Promise.resolve("tok") }),
}));

const postMock = vi.hoisted(() => vi.fn());
vi.mock("@/helpers/RequestManager", () => ({
    default: { post: (...args: unknown[]) => postMock(...args) },
}));

beforeEach(() => {
    authState.isLoaded = true;
    authState.isSignedIn = true;
    postMock.mockReset();
    postMock.mockResolvedValue(undefined);
});

describe("QuestForm", () => {
    it("shows a required-field error and does not submit when name is empty", async () => {
        const user = userEvent.setup();
        renderWithProviders(<QuestForm isOpen onClose={vi.fn()} updateQuests={vi.fn()} />);

        await user.click(screen.getByRole("button", { name: /submit/i }));

        expect(await screen.findByText("Name is required")).toBeInTheDocument();
        expect(postMock).not.toHaveBeenCalled();
    });

    it("calls createQuest with the entered fields when adding a new quest", async () => {
        const user = userEvent.setup();
        const updateQuests = vi.fn();
        renderWithProviders(<QuestForm isOpen onClose={vi.fn()} updateQuests={updateQuests} />);

        // Name, Point Value, Description render (in that DOM order) as the only `textbox`-role
        // fields in create mode (the Active switch only appears when editing).
        const [nameField, pointValueField] = screen.getAllByRole("textbox");
        await user.type(nameField, "Wash dishes");
        await user.type(pointValueField, "5");
        await user.click(screen.getByRole("button", { name: /submit/i }));

        await waitFor(() =>
            expect(postMock).toHaveBeenCalledWith(
                "/createQuest",
                expect.objectContaining({ name: "Wash dishes", pointValue: 5 }),
                expect.any(Function),
            ),
        );
        expect(updateQuests).toHaveBeenCalledTimes(1);
    });

    it("calls updateQuest (with the existing questId) when editing a quest", async () => {
        const user = userEvent.setup();
        const quest = new Quest("q1", "Wash dishes", "All of them", 5, true);
        renderWithProviders(<QuestForm isOpen onClose={vi.fn()} updateQuests={vi.fn()} quest={quest} />);

        await user.click(screen.getByRole("button", { name: /submit/i }));

        await waitFor(() =>
            expect(postMock).toHaveBeenCalledWith(
                "/updateQuest",
                expect.objectContaining({ questId: "q1", name: "Wash dishes" }),
                expect.any(Function),
            ),
        );
    });
});
