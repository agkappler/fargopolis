import type { IProject } from "@/constants/Projects";

/** True for undefined, empty, or whitespace-only strings. */
export function isBlank(s?: string): boolean {
    return !s || s.trim() === "";
}

/** Collapse hard-wrapped / indented template-literal prose into a single paragraph. */
export function normalizeProse(s: string): string {
    return s.replace(/\s+/g, " ").trim();
}

/** Split a comma/semicolon/newline separated tech list into chip labels. */
export function splitTechnology(s?: string): string[] {
    if (!s) return [];
    return s
        .split(/[,;\n]/)
        .map((part) => part.trim())
        .filter((part) => part !== "");
}

/** Whether the project has a page worth linking to (not blank, not the home page). */
export function hasExternalPage(p: IProject): boolean {
    return !isBlank(p.url) && p.url !== "/";
}
