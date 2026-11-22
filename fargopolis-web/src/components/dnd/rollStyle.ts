/** Shared look for every roll affordance: soft pine tint, ember on hover, visible focus ring. */
export const rollButtonProps = {
    bg: "pine.100",
    color: "pine.700",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "transparent",
    cursor: "pointer",
    transition: "all 120ms",
    _hover: { bg: "ember.100", borderColor: "ember.500", color: "ember.700" },
    _focusVisible: { outline: "2px solid", outlineColor: "ember.500", outlineOffset: "2px" },
} as const;
