/**
 * Chakra's default field recipes border on `colors.border` (our subtle
 * 14%-opacity hairline, tuned for card outlines) which reads as invisible
 * against the parchment background. Applied directly on each field element
 * rather than via a theme recipe override — overriding `theme.recipes.input`
 * et al. in chakra-theme.ts silently didn't reach the built-in Input/
 * Textarea/Select/Combobox components at runtime, and even the recipes'
 * own baked-in `borderWidth: "1px"` doesn't render (likely Tailwind's
 * preflight `border-width: 0` reset winning against the variant-level
 * recipe style in this project), so borderWidth is set explicitly too.
 */
export const fieldBorderProps = {
    bg: "bg.raised",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.strong",
} as const;
