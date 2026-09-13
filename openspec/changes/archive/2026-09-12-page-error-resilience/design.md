## Context

All four affected pages (`CampingPage`, `RecipesPage`, `BountiesPage`, `DndPage`) fetch their list data with `useSWR` + `RequestManager.get`. `RequestManager.handleResponse` throws on a non-ok response, and SWR catches that and surfaces it as its `error` value — it's never an unhandled rejection or a render-time throw, so there's no React error-boundary concern here (there is no error boundary in the app today — `grep -rn "ErrorBoundary"` is empty). The bug is purely in how each page branches on `error`:

- `CampingPage.tsx:23-26` and `RecipesPage.tsx:23-26`: an early `return <ErrorMessage/>` before `<PageHeader>` renders, blanking the whole page on fetch failure.
- `BountiesPage.tsx:44-46`: a single combined check (`bountiesError || bountyCategoriesError`) that early-returns before `<PageHeader>`, so either of two independent fetches blanks the entire page.
- `DndPage.tsx:21`: doesn't destructure `error` from `useSWR` at all, so a failed fetch just leaves `characters` `undefined` and the grid silently renders empty.

The codebase already has the right shape for scoping *loading* state: `LoadingWrapper` (`src/components/ui/LoadingWrapper.tsx`) wraps a section and swaps in a spinner while `isLoading` is true, used today in `BountiesPage` and `DndPage`. There's no equivalent for errors — `ErrorMessage` (`src/components/ui/ErrorMessage.tsx`) exists but is only ever used as a full-page early return.

## Goals / Non-Goals

**Goals:**
- Reuse the existing `LoadingWrapper` shape for a new `ErrorWrapper`, so the two compose the same way call sites already expect.
- Fix all four pages with the minimal restructuring needed: move `<PageHeader>` above any early return, and scope each page's error check(s) to the section(s) that depend on them.

**Non-Goals:**
- No change to `RequestManager`, SWR configuration, or retry behavior — error surfacing at that layer is already correct.
- No introduction of a React error boundary — not needed since nothing here throws during render.
- No change to About/Home pages (no data fetching) or to write-path forms (`CampsiteForm`, `RecipeForm`, `BountyForm`, `CharacterForm`) — this change is scoped to initial list-fetch rendering.

## Decisions

**New `ErrorWrapper` component, mirroring `LoadingWrapper`.** Same props shape (`error`/`children`) so a section can be wrapped as `<LoadingWrapper isLoading={...}><ErrorWrapper error={...}>{content}</ErrorWrapper></LoadingWrapper>` — loading takes precedence, then error, then content. Alternative considered: extend `LoadingWrapper` itself to also take an optional `error` prop. Rejected — conflates two concerns in one component's props and would force every existing `LoadingWrapper` call site (which have no error to pass) to reason about the new prop; a small sibling component is more consistent with the codebase's existing pattern of single-purpose `ui/` wrapper components.

**Per-page restructuring is mechanical, not uniform code.** Each page keeps its own early-return removed and replaced with unconditional `<PageHeader>` + wrapped section(s):
- `CampingPage` / `RecipesPage`: single section, single `ErrorWrapper` around the grid (replacing the current top-level `if (error...) return`).
- `BountiesPage`: two independent `ErrorWrapper`s — one around the category badges `LoadingWrapper`, one around the bounty grid `LoadingWrapper` — replacing the single combined check.
- `DndPage`: destructure `error` from its existing `useSWR` call and add an `ErrorWrapper` around the grid's `LoadingWrapper` (this page has no prior error handling to remove).

**Error message content**: reuse each page's existing fallback message text (e.g. "Failed to load campsites.") passed to `ErrorMessage` via `error?.message ?? "<fallback>"`, unchanged from current behavior — only *where* it renders changes.

## Risks / Trade-offs

- Bounties page still calls `mutate`/`mutateCategories` and renders `BountyForm`/`BountyCategoryForm` unconditionally today after the removed early return; need to confirm those forms tolerate `bounties`/`bountyCategories` being `undefined` on error (they already default with `?? []` at line 97, so no change needed there).
- `ErrorWrapper` swallows the distinction between "loading" and "error" only insofar as call sites nest it inside `LoadingWrapper` — if a call site wraps in the wrong order (`ErrorWrapper` outside `LoadingWrapper`), a stale error from a previous request could flash before loading resolves. Mitigation: consistently nest `LoadingWrapper` outermost, `ErrorWrapper` inside, matching SWR's own precedence (`isLoading` implies no usable `error` yet for that request).
