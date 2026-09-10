export function formatCurrency(value: number): string {
    return `$${value.toFixed(2)}`;
}

/** Uppercase the first character. Drop-in replacement for MUI's `capitalize`. */
export function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}
