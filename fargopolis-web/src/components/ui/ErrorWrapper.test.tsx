// @vitest-environment jsdom
import "@/test/setup";
import { renderWithProviders } from "@/test/renderWithProviders";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ErrorWrapper } from "./ErrorWrapper";

describe("ErrorWrapper", () => {
    it("renders its children when there is no error", () => {
        renderWithProviders(<ErrorWrapper error={undefined}>content</ErrorWrapper>);

        expect(screen.getByText("content")).toBeInTheDocument();
    });

    it("renders the error message instead of its children", () => {
        renderWithProviders(<ErrorWrapper error={new Error("Boom")}>content</ErrorWrapper>);

        expect(screen.getByText("Boom")).toBeInTheDocument();
        expect(screen.queryByText("content")).not.toBeInTheDocument();
    });
});
