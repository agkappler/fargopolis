export const getErrorMessage = (error: unknown) => {
    return error instanceof Error ? error.message : 'An unexpected error occurred.';
}