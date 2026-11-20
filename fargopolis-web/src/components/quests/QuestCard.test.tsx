// @vitest-environment jsdom
import "@/test/setup";
import { renderWithProviders } from "@/test/renderWithProviders";
import Quest from "@/models/Quest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QuestCard } from "./QuestCard";

vi.mock("@clerk/react", () => ({ useAuth: () => ({ getToken: () => Promise.resolve("tok") }) }));

const postMock = vi.hoisted(() => vi.fn());
vi.mock("@/helpers/RequestManager", () => ({
    default: { post: (...args: unknown[]) => postMock(...args) },
}));

beforeEach(() => {
    postMock.mockReset();
    postMock.mockResolvedValue(undefined);
});

const quest = new Quest("q1", "Wash dishes", "All of them", 5, true);

describe("QuestCard", () => {
    it("renders the quest's name and point value, but not its description", () => {
        renderWithProviders(<QuestCard quest={quest} onComplete={vi.fn()} />);

        expect(screen.getByText("Wash dishes")).toBeInTheDocument();
        expect(screen.getByText("+5 pts")).toBeInTheDocument();
        expect(screen.queryByText("All of them")).not.toBeInTheDocument();
    });

    it("calls completeQuest and the onComplete prop when tapped", async () => {
        const user = userEvent.setup();
        const onComplete = vi.fn();
        renderWithProviders(<QuestCard quest={quest} onComplete={onComplete} />);

        await user.click(screen.getByText("Wash dishes"));

        await waitFor(() => expect(postMock).toHaveBeenCalledWith("/completeQuest", { questId: "q1" }, expect.any(Function)));
        expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("shows an Archived label and does not complete when tapped if inactive", async () => {
        const user = userEvent.setup();
        const onComplete = vi.fn();
        const archivedQuest = new Quest("q2", "Old chore", "", 5, false);
        renderWithProviders(<QuestCard quest={archivedQuest} onComplete={onComplete} />);

        expect(screen.getByText("Archived")).toBeInTheDocument();

        await user.click(screen.getByText("Old chore"));

        expect(postMock).not.toHaveBeenCalled();
        expect(onComplete).not.toHaveBeenCalled();
    });
});
