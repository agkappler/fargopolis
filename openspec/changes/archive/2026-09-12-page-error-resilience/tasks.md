## 1. Shared component

- [x] 1.1 Create `fargopolis-web/src/components/ui/ErrorWrapper.tsx` mirroring `LoadingWrapper.tsx`'s shape: props `{ error: Error | undefined; errorMessage?: string; children }`, rendering `ErrorMessage` (with `error?.message ?? errorMessage`) in place of `children` when `error` is present, otherwise rendering `children`.

## 2. CampingPage

- [x] 2.1 Remove the early `if (isLoading) return <LoadingSpinner/>` / `if (error || campsites === undefined) return <ErrorMessage/>` block so `<PageHeader>` always renders first.
- [x] 2.2 Wrap the campsite `<Grid>` in `LoadingWrapper` (isLoading) and `ErrorWrapper` (error), matching the design's nesting (`LoadingWrapper` outer, `ErrorWrapper` inner), passing the existing fallback message "Failed to load campsites.".
- [x] 2.3 Guard the `campsites.map(...)` / `existingRegions` derivation for the `campsites === undefined` case now that the top-level early return is gone (e.g. `campsites?.map(...)`, `(campsites ?? []).map(...)` for regions).

## 3. RecipesPage

- [x] 3.1 Remove the early `if (isLoading) return <LoadingSpinner/>` / `if (error || recipes === undefined) return <ErrorMessage/>` block so `<PageHeader>` always renders first.
- [x] 3.2 Wrap the recipe `<Grid>` in `LoadingWrapper` (isLoading) and `ErrorWrapper` (error), fallback message "Failed to load recipes.".
- [x] 3.3 Guard `recipes.map(...)` for the `recipes === undefined` case (e.g. `recipes?.map(...)`).

## 4. BountiesPage

- [x] 4.1 Remove the combined `if (bountiesError || bountyCategoriesError) return <ErrorMessage/>` early return so `<PageHeader>` always renders first.
- [x] 4.2 Wrap the category badges section's existing `LoadingWrapper` in an `ErrorWrapper` using `bountyCategoriesError`.
- [x] 4.3 Wrap the bounty grid section's existing `LoadingWrapper` in an `ErrorWrapper` using `bountiesError`.
- [x] 4.4 Verify `bountyCategoryMap`, `bounties?.map(...)`, and the `BountyForm`/`BountyCategoryForm` props (`bountyCategories ?? []`) all still tolerate `bounties`/`bountyCategories` being `undefined` now that the early return no longer guards them.

## 5. DndPage

- [x] 5.1 Destructure `error` from the existing `useSWR<Character[]>("/characters", ...)` call.
- [x] 5.2 Wrap the character `<Grid>` (inside the existing `LoadingWrapper`) in an `ErrorWrapper` using that `error`, with a fallback message such as "Failed to load characters."

## 6. Verification

- [x] 6.1 Run `pnpm build` and `pnpm lint` in `fargopolis-web/` to confirm type-checking and lint pass. (`pnpm build` passes; `pnpm lint` has 5 pre-existing errors in unrelated dnd files — the 5 files touched by this change lint clean on their own.)
- [x] 6.2 Manually verify each page (Camping, Recipes, Bounties, Dnd) with the dev server: temporarily force a fetch failure (e.g. stop/break `VITE_API_URL` or throw in `RequestManager.get`) and confirm the header stays visible and only the affected section shows an error, then revert the temporary change. (Verified via headless Chromium against the dev server, mocking each page's API route to return 200 vs. 500: header renders and no error is shown on success; header stays visible and the correct error message replaces the list/grid section on failure. Bounties' two independent sections (categories, bounty grid) confirmed to error independently. Screenshots confirmed visually. No temporary source changes were needed/left behind — routes were mocked at the network layer.)
