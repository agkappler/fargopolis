import { ThemeRegistry } from "@/components/ThemeRegistry";
import { render, RenderOptions } from "@testing-library/react";
import React from "react";

/** Render a component inside the app's Chakra theme provider. */
export function renderWithProviders(ui: React.ReactElement, options?: Omit<RenderOptions, "wrapper">) {
    return render(ui, { wrapper: ThemeRegistry, ...options });
}
