# Tasks

Same branch as the MUI migration (`feat/chakra-migrate`). Each group ends with
`pnpm build` (`tsc --noEmit && vite build`) + `pnpm lint` from `fargopolis-web/`,
then a commit. Gate: build passes, no lint errors beyond the 5 pre-existing
`no-explicit-any`. Mapping reference: [design.md](./design.md) D1/D2.

## 1. Layout tokens + `--fp-*` var call sites

- [x] 1.1 Added nested `sizes.fp` tokens to `chakra-theme.ts` — `fp.container` = `1180px`, `fp.containerNarrow` = `720px`, `fp.nav` = `64px` (nested form chosen over hyphenated key names).
- [x] 1.2 `var(--fp-container)` → `"fp.container"` in `PageHeader.tsx`, `AboutPage.tsx`, `BountiesPage.tsx`, `RecipesPage.tsx`.
- [x] 1.3 `var(--fp-container-narrow)` → `"fp.containerNarrow"` in `HomePage.tsx`.
- [x] 1.4 `var(--fp-nav-height)` → `"fp.nav"` in `Navbar.tsx` (2 sites).
- [x] 1.5 `pnpm build` passes (typegen picked up the tokens). Committed.

> **Order note:** `className` conversions (groups 3–5) run *before* deleting
> `globals.scss` (group 2, now folded into group 6), so no intermediate commit
> ships components whose Tailwind utilities have stopped being emitted.

## 2. _(moved into group 6 — teardown)_

## 3. `className` → style props: `constants/` + `App.tsx` + shared

- [x] 3.1 `constants/Projects.tsx` — 4 lucide icons `className="mr-1"` → `style={{ marginRight: "0.25rem" }}`.
- [x] 3.2 `App.tsx` — `<main className="flex-grow">` → `<Box as="main" flex="1">`.
- [x] 3.3 `ErrorMessage.tsx` (`mb={2}`), `ProjectHeader.tsx` (`display="flex" alignItems/justifyContent="center" w="full"`), `ProjectTodos.tsx` (`p={2} h="full"`).
- [x] 3.4 `pnpm build` + `pnpm lint` (5 pre-existing) + commit.

## 4. `className` → style props: dnd/

- [x] 4.1 `CharacterFormFields`, `WeaponForm`, `AbilityForm`, `RaceForm`, `SubclassForm` — Grid `className="mb-2"` → `mb={2}`.
- [x] 4.2 `SpellCard` (`p={2} display="flex" justifyContent="space-between"`), `RaceList` + `ClassList` (`p={2}`), `CustomRaceTraits` (`display="flex" justifyContent="flex-end"`, `p={2} m={2}`), `Subclasses` (`display="flex" justifyContent="flex-end"`).
- [x] 4.3 `RacialTraitCard` + `FeatureItem` — `my={2} p={2} pt={3}`.
- [x] 4.4 `pnpm build` + `pnpm lint` + commit.

## 5. `className` → style props: bounties/ + recipes/ + pages/

- [x] 5.1 `BountyForm`, `IngredientForm`, `RecipeForm` — Grid `mb={2}`.
- [x] 5.2 `RecipeSteps` (`justifySelf="center"`), `IngredientList` (`display="flex" alignItems="center" justifyContent="space-between" mt={2} w="full"`; `Table.Row fontWeight="bold"`).
- [x] 5.3 `ProjectsPage` (`display="flex" flexDirection="column" p={2} alignItems="center" h="full"`), `ProjectDetailPage` (`m={2}`, 4 × `p={2} h="full"`).
- [x] 5.4 `DndGlossaryPage` (2 × `px={2} mt={2}`), `DndPage` (`px={2}`, `mt={2}`), `RecipeDetailPage` (`p={2}`), `SplitCheckPage` (`m={2} p={2}`, `display="flex" alignItems="center"`, `p={2}`).
- [x] 5.5 `rg 'className="' fargopolis-web/src` → zero string-literal matches (only React `className={…}` prop-passing for the D&D "class name" domain concept). `pnpm build` + `pnpm lint` + commit.

## 6. Remove Tailwind tooling + `globals.scss`

- [x] 6.1 Deleted `src/globals.scss` + its `main.tsx` import.
- [x] 6.2 Deleted `tailwind.config.ts`.
- [x] 6.3 `postcss.config.js` → only `autoprefixer`.
- [x] 6.4 Removed `tailwindcss` (devDep) + `sass` (dep); `pnpm install` (both dropped from lockfile).
- [x] 6.5 `rg -i tailwind fargopolis-web` → only the 2 historical-context comments in `fieldStyle.ts` / `surfaceStyle.ts` (refreshed to note Tailwind is gone). Zero `className="` string literals.
- [x] 6.6 `pnpm build` passes (CSS bundle **22.48 kB → 14.16 kB**, gzip 5.02 → 2.67 — the removed preflight + utilities); `pnpm lint` = 5 pre-existing `no-explicit-any` only. Committed. Interactive `pnpm dev` smoke check not possible this session — see follow-up below.

## 7. Wrap-up

- [x] 7.1 Marked the "Tailwind stays" non-goal in `migrate-remaining-mui-to-chakra/design.md` as superseded by this change.
- [ ] 7.2 **Browser smoke check** (deferred — no interactive session): About timeline, a form modal (field borders — see `fieldStyle.ts` note), a card grid, Navbar height/sticky, page max-width. Then optionally drop the now-redundant `borderWidth`/`borderStyle` from `fieldStyle.ts` if Chakra's own field border renders.
- [ ] 7.3 Run `/opsx:archive` for this change.
