# Tasks

Each numbered group is one PR-sized step. Every step ends by running `pnpm build`
(`tsc --noEmit && vite build`) and `pnpm lint` from `fargopolis-web/`, then
committing. No step may add a new `@mui/*` import. Work on `feat/chakra-migrate`.

> **Lint baseline note:** at branch HEAD `e966651`, `pnpm lint` already reports
> 7 pre-existing errors (5 × `no-explicit-any` in `dnd5eapi.ts`,
> `OptionsList.tsx`, `ClassFeatures.tsx`; unused imports in `Footer.tsx` and
> `Navbar.tsx`). The effective gate for each step is: **`pnpm build` passes and
> `pnpm lint` introduces no _new_ errors.** MUI-related unused imports get fixed
> as their files are converted; the `no-explicit-any` errors are out of scope
> for this UI-library migration.

Mapping reference: see [design.md](./design.md) — D3 (components), D4 (icons), D5 (`sx`).

## 1. Groundwork: local `capitalize` + icon audit

- [x] 1.1 Added `capitalize` to `fargopolis-web/src/helpers/Format.ts` (existing formatting-util module — preferred over a new `capitalize.ts` file per design.md Open Question).
- [x] 1.2 Replaced `import { capitalize } from "@mui/material"` with `@/helpers/Format` in `DndRace.ts`, `DndClass.ts`, `CharacterDetailPage.tsx`, `CharacterActionsPage.tsx`, `ClassFeatures.tsx`.
- [x] 1.3 Verified icon names against `lucide-react@1.31.0`. All map cleanly **except** brand icons — `Github`/`Linkedin` were dropped from lucide; design.md D4 updated to use inline SVG for those two.
- [x] 1.4 Added `src/components/ui/surfaceStyle.ts` (`surfaceBorderProps`, `surfaceCardProps`) for bordered non-form surfaces.
- [x] 1.5 `pnpm build` passes; `pnpm lint` no new errors (also cleared the pre-existing unused `Box` in `Footer.tsx`). Committed.

## 2. Icon-only files → lucide-react

Files whose only `@mui` import is icons — pure swap, no layout change.

- [x] 2.1 `src/constants/Projects.tsx` — icons → lucide (`Settings`, `List`, `ListChecks`, `FileText`).
- [x] 2.2 `GitHubButton.tsx`, `LinkedInButton.tsx` — inline brand SVGs + Chakra `IconButton asChild`.
- [x] 2.3 `LinkButton.tsx` — lucide chevrons, Chakra `Button asChild` (MUI `startIcon`/`endIcon`/`component` props gone; icons now children).
- [x] 2.4 `UnderConstructionAlert.tsx` — `Alert.Root`/`Alert.Indicator`/`Alert.Content`/`Alert.Title`; `Construction` from lucide.
- [x] 2.5 `ResumeWrapper.tsx` (`FileText` + Chakra `Link`), `FileWrapper.tsx` (`File` + Chakra `Link`).
- [x] 2.6 `pnpm build` passes; `pnpm lint` 6 pre-existing errors, no new. Committed.

## 3. Shared `ui/` wrappers — simple

Keep each component's public props identical; change internals only.

- [x] 3.1 `AlertMessage.tsx` + `ErrorMessage.tsx` — Chakra `Alert.*`; local `AlertStatus` type replaces `AlertColor`; `severity` → `status`; `sx` → style props.
- [x] 3.2 `LoadingSpinner.tsx` (`Spinner boxSize` + `Text`) + `LoadingWrapper.tsx` (`Box` → Chakra).
- [x] 3.3 `ImageBox.tsx` — `Avatar.Root`/`Avatar.Image`/`Avatar.Fallback`. (`FileWrapper.tsx` already done in 2.5.)
- [x] 3.4 `pnpm build` passes; `pnpm lint` 6 pre-existing, no new. Committed.

## 4. Shared `ui/` wrappers — compound

- [x] 4.1 `SimpleDialog.tsx` — Chakra `Dialog.*` + `Portal` + `CloseButton` in `Dialog.CloseTrigger`; `maxWidth: Breakpoint` → local `DialogSize` union → `size`; `onClose` → `onOpenChange`.
- [x] 4.2 `StyledAccordion.tsx` — Chakra `Accordion.*` (Root `collapsible` + `Item value` + `ItemTrigger`/`ItemIndicator`/`ItemContent`/`ItemBody`); MUI `&:before` reset dropped (not needed).
- [x] 4.3 `ActionMenu.tsx` — Chakra `Menu.*` + `Portal`; dropped `anchorEl`/`useState`; `onClick` → `Menu.Item onSelect` + `value`; `size` mapped small/medium/large → sm/md/lg. `MenuOption[]` prop shape unchanged.
- [x] 4.4 `Carousel.tsx` — `Box`/`IconButton`/`SimpleGrid` (was `Grid`); `Paper` → `Box` + `surfaceCardProps`; `useMediaQuery` → Chakra `useMediaQuery([query], { fallback })`; lucide `Circle` (fill toggles active).
- [x] 4.5 `pnpm build` passes; `pnpm lint` no new. `src/components/ui/` now MUI-free. Committed. (Visual check deferred — no interactive browser this session.)

## 5. Verticals: home + about + navigation

- [ ] 5.1 `src/components/home/ProjectCardContents.tsx`, `ProjectHeader.tsx` (`Avatar` → `Avatar.Root`/`Image`/`Fallback`), `ProjectTodos.tsx` — primitives + icons.
- [ ] 5.2 `src/components/about/ResumeWrapper.tsx`, `TimelineContentText.tsx` — `Typography`/`Box`/`Chip` → `Text`/`Box`/`Badge`.
- [ ] 5.3 `src/components/about/MyTimeline.tsx` — hand-roll `@mui/lab` `Timeline*` with `Flex`/`Box` (vertical rule + dots) per design.md D3; screenshot-compare before/after.
- [ ] 5.4 `src/components/navigation/Navbar.tsx` — `useMediaQuery` → `useBreakpointValue`; `Menu` icon → lucide.
- [ ] 5.5 `src/components/LoginForm.tsx` — primitives.
- [ ] 5.6 `pnpm build` + `pnpm lint` + visual check + commit.

## 6. Verticals: bounties + recipes

- [ ] 6.1 `src/components/bounties/BountyForm.tsx` — `Box`/`Button`/`Grid`/`Typography` → Chakra.
- [ ] 6.2 `src/components/recipes/RecipeForm.tsx`, `IngredientForm.tsx`, `RecipeStepsForm.tsx` — `Grid`/`Box`/`Button`/icons.
- [ ] 6.3 `src/components/recipes/RecipeSteps.tsx`, `IngredientList.tsx` — `Grid`/`Paper`/`Typography` + any `sx`.
- [ ] 6.4 `pnpm build` + `pnpm lint` + visual check + commit.

## 7. Verticals: dnd core

- [ ] 7.1 `src/components/dnd/CharacterCard.tsx`, `CharacterResources.tsx`, `OptionsList.tsx` — primitives + icons (`Casino` → `Dice5`, `Edit` → `Pencil`).
- [ ] 7.2 `src/components/dnd/DescriptionList.tsx` — `List`/`ListItem`/`ListItemIcon`/`ListItemText`/`Circle` → `List.Root`/`List.Item`/`List.Indicator` (or `Stack` of `Flex`).
- [ ] 7.3 `src/components/dnd/OptionCell.tsx` — `TableCell` → `Table.Cell`.
- [ ] 7.4 `src/components/dnd/CharacterFormFields.tsx` — `Box`/`MenuItem`/`Select`/`Typography` → Chakra `Select` via `createListCollection` (follow `inputs/DropdownInput.tsx`).
- [ ] 7.5 `src/components/dnd/CharacterInfo.tsx` + `ActionInfo.tsx` — `@mui/lab` `TabContext`/`TabList`/`TabPanel` + `Tab` → `Tabs.*`; `Select`+`MenuItem` → Chakra `Select`; `useMediaQuery` → `useBreakpointValue`.
- [ ] 7.6 `pnpm build` + `pnpm lint` + visual check + commit.

## 8. Verticals: dnd/race

- [ ] 8.1 `src/components/dnd/race/RaceList.tsx`, `RaceForm.tsx`, `Subraces.tsx`, `CustomRaceTraits.tsx` — primitives + icons.
- [ ] 8.2 `src/components/dnd/race/RacialTraits.tsx`, `RacialTraitCard.tsx`, `RacialTraitsForm.tsx` — primitives.
- [ ] 8.3 `src/components/dnd/race/DraconicAncestryTable.tsx` + `DraconicAncestryRow.tsx` — MUI `Table*` → `Table.ScrollArea` + `Table.*`.
- [ ] 8.4 `pnpm build` + `pnpm lint` + visual check + commit.

## 9. Verticals: dnd/class

- [ ] 9.1 `src/components/dnd/class/ClassList.tsx`, `Subclasses.tsx`, `SubclassForm.tsx`, `SubclassFeaturesForm.tsx` — primitives + icons.
- [ ] 9.2 `src/components/dnd/class/ClassFeatures.tsx`, `FeatureItem.tsx`, `ClassSpecificInfo.tsx`, `CustomSubclassInfo.tsx` — primitives.
- [ ] 9.3 `src/components/dnd/class/class-specific/CreatingSpellSlotsTable.tsx` — MUI `Table*` → `Table.*`; migrate `sx`.
- [ ] 9.4 `pnpm build` + `pnpm lint` + visual check + commit.

## 10. Verticals: dnd/spells + dnd/abilities + dnd/weapons

- [ ] 10.1 `src/components/dnd/spells/SpellCard.tsx`, `SpellInfo.tsx`, `KnownSpellsDisplay.tsx` — primitives.
- [ ] 10.2 `src/components/dnd/spells/SpellSlotTable.tsx` — MUI `Table*` → `Table.*`.
- [ ] 10.3 `src/components/dnd/spells/SpellDetailsModal.tsx` + `abilities/AbilityDetailsModal.tsx` — should consume the migrated `SimpleDialog`; swap remaining primitives.
- [ ] 10.4 `src/components/dnd/abilities/AbilityCard.tsx`, `AbilityInfo.tsx`, `AbilityForm.tsx` — primitives + icons.
- [ ] 10.5 `src/components/dnd/weapons/WeaponCard.tsx`, `WeaponInfo.tsx`, `WeaponForm.tsx` — primitives + `sx`.
- [ ] 10.6 `pnpm build` + `pnpm lint` + visual check + commit.

## 11. Pages

- [ ] 11.1 `src/pages/ProjectsPage.tsx`, `ProjectDetailPage.tsx` — `Grid`/`Paper`/`Typography` → Chakra.
- [ ] 11.2 `src/pages/RecipeDetailPage.tsx` — primitives + any `Table`.
- [ ] 11.3 `src/pages/DndPage.tsx`, `DndGlossaryPage.tsx`, `DndGlossaryRacesPage.tsx`, `DndGlossaryClassesPage.tsx` — `Select`+`MenuItem` → Chakra `Select`; `useMediaQuery` → `useBreakpointValue`; `@mui/lab` Tabs if present.
- [ ] 11.4 `src/pages/CharacterDetailPage.tsx`, `CharacterActionsPage.tsx` — `Box`/`Button`/`MenuItem`/`Select`/`Tab` → Chakra.
- [ ] 11.5 `src/pages/SplitCheckPage.tsx` — primitives + `TableCell`.
- [ ] 11.6 `pnpm build` + `pnpm lint` + visual check (each page route) + commit.

## 12. Theme teardown + dependency removal

- [ ] 12.1 Run `rg "@mui/" fargopolis-web/src` — confirm zero matches except `ThemeRegistry.tsx` and `theme.ts`. Fix any stragglers before continuing.
- [ ] 12.2 Port the still-needed MUI `styleOverrides` from `theme.ts` (Paper `backgroundImage:none`, Chip mono font, Tab weight) into `chakra-theme.ts` recipes; run `pnpm chakra:typegen`.
- [ ] 12.3 Delete `fargopolis-web/src/theme.ts`.
- [ ] 12.4 Edit `src/components/ThemeRegistry.tsx` — remove the MUI `ThemeProvider` import and wrapper; leave only `<ChakraProvider value={chakraSystem}>`.
- [ ] 12.5 Remove `@mui/material`, `@mui/icons-material`, `@mui/lab` from `fargopolis-web/package.json`; `pnpm install` to update lockfile.
- [ ] 12.6 `rg "@mui/" fargopolis-web` — confirm zero matches anywhere (incl. lockfile).
- [ ] 12.7 Full `pnpm build` + `pnpm lint` + click through every route in `pnpm dev` + commit.

## 13. Wrap-up

- [ ] 13.1 Update `fargopolis-web/README.md` / repo docs if they mention MUI.
- [ ] 13.2 Run `/opsx:archive` for this change.
