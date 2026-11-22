/** Shared row layout for a label+value line inside a stat card (StatRow, RollableStatRow, Ability Scores rows). */
export const rowProps = {
    justify: "space-between",
    align: "center",
    py: "1.5",
    borderBottomWidth: "1px",
    borderColor: "border.soft",
    _last: { borderBottomWidth: 0 },
} as const;
