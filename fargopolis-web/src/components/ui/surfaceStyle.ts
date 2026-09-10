/**
 * Shared style props for bordered non-form surfaces (former MUI `Paper`,
 * `Table` containers, `Accordion` items, etc.) — explicit border + bg so the
 * surface is styled consistently without leaning on component recipes, which
 * didn't reliably reach built-in components at runtime in this project.
 *
 * The explicit `borderWidth`/`borderStyle` originally also worked around
 * Tailwind preflight's `border-width: 0` reset; Tailwind has since been removed
 * (see openspec/changes/remove-tailwind-from-web).
 */
export const surfaceBorderProps = {
    bg: "bg.raised",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.DEFAULT",
    borderRadius: "md",
} as const;

/** Card-like raised surface: `surfaceBorderProps` + a subtle shadow. */
export const surfaceCardProps = {
    ...surfaceBorderProps,
    boxShadow: "sm",
} as const;
