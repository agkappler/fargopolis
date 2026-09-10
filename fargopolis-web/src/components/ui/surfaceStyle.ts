/**
 * Shared style props for bordered non-form surfaces (former MUI `Paper`,
 * `Table` containers, `Accordion` items, etc.).
 *
 * Same rationale as `src/components/inputs/fieldStyle.ts`: Chakra v3 recipe-level
 * `borderWidth` doesn't reliably reach built-in components at runtime in this
 * project (Tailwind preflight's `border-width: 0` reset wins), so border width /
 * style / color are set explicitly as inline props rather than via a theme recipe.
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
