// @vitest-environment jsdom
import "@/test/setup";
import { renderWithProviders } from "@/test/renderWithProviders";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BasicForm } from "./BasicForm";
import { TextInput } from "./TextInput";

const authState = vi.hoisted(() => ({ isLoaded: true, isSignedIn: true }));
vi.mock("@clerk/react", () => ({ useAuth: () => authState }));

beforeEach(() => {
    authState.isLoaded = true;
    authState.isSignedIn = true;
});

function renderForm(onSubmit = vi.fn().mockResolvedValue(undefined), onDelete?: () => Promise<void>) {
    renderWithProviders(
        <BasicForm errorMessage={undefined} onSubmit={onSubmit} onDelete={onDelete}>
            <TextInput label="Name" fieldName="name" requiredMessage="Name is required" />
        </BasicForm>,
    );
    return onSubmit;
}

describe("BasicForm", () => {
    it("shows the Submit button when signed in", () => {
        renderForm();

        expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
    });

    it("shows the required message and does not submit an empty field", async () => {
        const user = userEvent.setup();
        const onSubmit = renderForm();

        await user.click(screen.getByRole("button", { name: /submit/i }));

        expect(await screen.findByText("Name is required")).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it("submits the typed value", async () => {
        const user = userEvent.setup();
        const onSubmit = renderForm();

        // TextInput passes `onChange={undefined}`, which overrides RHF's register onChange,
        // so the value is only committed on blur. The user-event click on Submit causes that
        // blur. Don't switch to `fireEvent.submit`.
        await user.type(screen.getByRole("textbox"), "Rope");
        await user.click(screen.getByRole("button", { name: /submit/i }));

        await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: "Rope" }));
    });

    it("hides the Submit button when signed out", () => {
        authState.isSignedIn = false;
        renderForm();

        expect(screen.queryByRole("button", { name: /submit/i })).toBeNull();
    });

    it("shows a Delete button that calls onDelete", async () => {
        const user = userEvent.setup();
        const onDelete = vi.fn().mockResolvedValue(undefined);
        renderForm(undefined, onDelete);

        await user.click(screen.getByRole("button", { name: /delete/i }));

        expect(onDelete).toHaveBeenCalledTimes(1);
    });
});
