/**
 * Chakra's default field recipes border on `colors.border` (our subtle
 * 14%-opacity hairline, tuned for card outlines) which reads as invisible
 * against the parchment background, so we override to `border.strong` on
 * each field element rather than via a theme recipe override — overriding
 * `theme.recipes.input` et al. in chakra-theme.ts silently didn't reach the
 * built-in Input/Textarea/Select/Combobox components at runtime.
 *
 * `borderWidth`/`borderStyle` are set explicitly too. These originally
 * worked around Tailwind preflight's `border-width: 0` reset; Tailwind has
 * since been removed (see openspec/changes/remove-tailwind-from-web), so
 * these two lines are likely redundant now — safe to drop once a browser
 * check confirms Chakra's own field border renders.
 */
export const fieldBorderProps = {
    bg: "bg.raised",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.strong",
} as const;
