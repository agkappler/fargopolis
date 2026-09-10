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

- [ ] 3.1 `constants/Projects.tsx` — 4 × `<Icon className="mr-1" />` → `style={{ marginRight: "0.25rem" }}` on the lucide icons.
- [ ] 3.2 `App.tsx` — `<main className="flex-grow">` → `<Box as="main" flex="1">` (import `Box`).
- [ ] 3.3 `components/ui/ErrorMessage.tsx` (`mb-2`), `components/home/ProjectHeader.tsx` (`flex items-center justify-center w-full`), `components/home/ProjectTodos.tsx` (`p-2 h-full`).
- [ ] 3.4 `pnpm build` + `pnpm lint` + commit.

## 4. `className` → style props: dnd/

- [ ] 4.1 `dnd/CharacterFormFields.tsx`, `dnd/weapons/WeaponForm.tsx`, `dnd/abilities/AbilityForm.tsx`, `dnd/race/RaceForm.tsx`, `dnd/class/SubclassForm.tsx` — `mb-2` → `mb={2}` on the `<Grid>`.
- [ ] 4.2 `dnd/spells/SpellCard.tsx` (`p-2 flex justify-between`), `dnd/race/RaceList.tsx` + `dnd/class/ClassList.tsx` (`p-2`), `dnd/race/CustomRaceTraits.tsx` (`flex justify-end`, `p-2 m-2`) + `dnd/class/Subclasses.tsx` (`flex justify-end`).
- [ ] 4.3 `dnd/race/RacialTraitCard.tsx` + `dnd/class/FeatureItem.tsx` — `my-2 p-2 pt-3` → `my={2} p={2} pt={3}`.
- [ ] 4.4 `pnpm build` + `pnpm lint` + commit.

## 5. `className` → style props: bounties/ + recipes/ + pages/

- [ ] 5.1 `bounties/BountyForm.tsx`, `recipes/IngredientForm.tsx`, `recipes/RecipeForm.tsx` — `mb-2` → `mb={2}`.
- [ ] 5.2 `recipes/RecipeSteps.tsx` (`justify-self-center`), `recipes/IngredientList.tsx` (`flex items-center justify-between mt-2 w-full`, `font-bold` on `Table.Row`).
- [ ] 5.3 `pages/ProjectsPage.tsx` (`flex flex-col p-2 items-center h-full`), `pages/ProjectDetailPage.tsx` (`m-2`, 4 × `p-2 h-full`).
- [ ] 5.4 `pages/DndGlossaryPage.tsx` (2 × `px-2 mt-2`), `pages/DndPage.tsx` (`px-2`, `mt-2`), `pages/RecipeDetailPage.tsx` (`p-2`), `pages/SplitCheckPage.tsx` (`m-2 p-2`, `flex items-center`, `p-2`).
- [ ] 5.5 `rg 'className=' fargopolis-web/src` → confirm zero matches. `pnpm build` + `pnpm lint` + commit.

## 6. Remove Tailwind tooling + `globals.scss`

- [ ] 6.1 Delete `fargopolis-web/src/globals.scss` and remove its `import "./globals.scss";` from `src/main.tsx`.
- [ ] 6.2 Delete `fargopolis-web/tailwind.config.ts`.
- [ ] 6.3 Edit `postcss.config.js` — remove the `tailwindcss: {}` plugin entry, keep `autoprefixer: {}`.
- [ ] 6.4 Remove `tailwindcss` (devDep) and `sass` (dep) from `package.json`; `pnpm install`.
- [ ] 6.5 `rg -i 'tailwind' fargopolis-web` and `rg 'className=' fargopolis-web/src` → confirm zero matches (src, configs, lockfile).
- [ ] 6.6 Full `pnpm build` + `pnpm lint` + `pnpm dev` smoke check of About (timeline), a form modal, a card grid, Navbar → commit.

## 7. Wrap-up

- [ ] 7.1 Note the reverted "Tailwind stays" non-goal in `migrate-remaining-mui-to-chakra/design.md` (or leave a pointer), if that change is not yet archived.
- [ ] 7.2 Run `/opsx:archive` for this change.
