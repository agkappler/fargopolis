## Why

On the Camping, Recipes, and Bounties pages, a failed data fetch replaces the *entire* page — including the header/title — with a bare error alert, because each page's `useSWR` error check is an early `return` placed before `<PageHeader>` renders. The Dnd page has the opposite problem: it doesn't read the SWR `error` at all, so a failed fetch silently renders an empty catalog with no indication anything went wrong. In both cases the user loses context (what page they're on) or gets no feedback that something failed. A single failed request for one section of a page shouldn't take out the whole page.

## What Changes

- Add a reusable `ErrorWrapper` UI component (mirroring the existing `LoadingWrapper` pattern) that renders `ErrorMessage` in place of its children when an error is present, otherwise renders children.
- **CampingPage**: render `<PageHeader>` unconditionally; move the `campsites` fetch error out of the top-level early return and into a section-scoped `ErrorWrapper` (and `LoadingWrapper`) around the campsite grid, so the header stays visible on error. The grid (including the "Add a campsite" card) is swapped for the error message while the section is in an error state, mirroring how `LoadingWrapper` already swaps the same grid for a spinner while loading.
- **RecipesPage**: same restructuring — unconditional `<PageHeader>`, section-scoped loading/error wrapping around the recipe grid.
- **BountiesPage**: replace the single combined `if (bountiesError || bountyCategoriesError) return <ErrorMessage/>` (which currently blanks the whole page, including the header) with two independent `ErrorWrapper`s — one around the category badges section, one around the bounty grid — so an error in one section doesn't hide the other or the header.
- **DndPage**: start reading `error` from its `useSWR` call (currently discarded) and wrap the character grid in the new `ErrorWrapper` so a failed fetch shows a visible error message instead of silently rendering an empty catalog.
- No changes to About/Home pages — they have no data fetching.

## Capabilities

### New Capabilities
- `page-error-resilience`: pages that fetch data must render their header/title regardless of fetch outcome, and must confine a failed data fetch to the specific section that depends on it, showing a visible error message in that section instead of blanking the page or failing silently.

### Modified Capabilities
(none — no existing spec covers frontend page-rendering behavior)

## Impact

- New: `fargopolis-web/src/components/ui/ErrorWrapper.tsx`
- Modified: `fargopolis-web/src/pages/CampingPage.tsx`, `RecipesPage.tsx`, `BountiesPage.tsx`, `DndPage.tsx`
- No API, IaC, or DynamoDB changes. No backend impact — `RequestManager`/SWR error surfacing is already correct; this is purely how each page component branches on that error.
