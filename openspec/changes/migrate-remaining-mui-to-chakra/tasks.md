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

- [x] 5.1 `ProjectCardContents.tsx` (`Text`), `ProjectHeader.tsx` (`Heading` + MUI-variant→size map; `TypographyVariant` gone), `ProjectTodos.tsx` (`Box`+`surfaceCardProps`, `List.Root`/`List.Item`/`List.Indicator`, lucide `Circle`).
- [x] 5.2 `ResumeWrapper.tsx` done in 2.5; `TimelineContentText.tsx` → `Box`+`Text` (was `@mui/lab` `TimelineContent`).
- [x] 5.3 `MyTimeline.tsx` — hand-rolled with `Grid` (3-col alternating on md, stacked on base) + a `Rail` (line/dot/line `Flex`); content pulled into an `ENTRIES` data array.
- [x] 5.4 `Navbar.tsx` — MUI `useMediaQuery`/`IconButton`/`Menu` icon → Chakra `useMediaQuery([q],{fallback})` + Chakra `IconButton` + lucide `Menu`; removed dead `Link` import.
- [x] 5.5 `LoginForm.tsx` — `Box`/`Heading`/`Text`; `sx` → style props.
- [x] 5.6 `pnpm build` passes; `pnpm lint` down to 5 (only pre-existing `no-explicit-any`). Committed.

## 6. Verticals: bounties + recipes

- [x] 6.1 `BountyForm.tsx` — MUI `Grid`/`size` → Chakra `Grid templateColumns="repeat(12,1fr)"` + `GridItem colSpan`. Bare `size={6}` promoted to `{base:12, sm:6}` so forms stack on mobile (consistent with existing responsive items).
- [x] 6.2 `RecipeForm.tsx`, `IngredientForm.tsx` (same Grid pattern); `RecipeStepsForm.tsx` (Grid + `Typography` → `Text`).
- [x] 6.3 `RecipeSteps.tsx` (`Heading`/`Text`/`Button`); `IngredientList.tsx` (`Table.ScrollArea`/`Table.Root`/`Table.Header`/`Table.ColumnHeader`/`Table.Body`/`Table.Row`/`Table.Cell`; `Chip` → `Badge`; `Add`/`Edit` → lucide `Plus`/`Pencil`; MUI `startIcon` → icon child).
- [x] 6.4 `pnpm build` passes; `pnpm lint` 5 pre-existing, no new. `bounties/` + `recipes/` MUI-free. Committed.

## 7. Verticals: dnd core

- [x] 7.1 `CharacterCard.tsx` (`Text`, `color="textSecondary"` → `fg.secondary`); `CharacterResources.tsx` (`Box`/`Text`); `OptionsList.tsx` (`Table.*` + `Text`; `subOptions: any` left as pre-existing lint).
- [x] 7.2 `DescriptionList.tsx` — `Typography` → `Text` (component just maps text rows; `List.*` not needed).
- [x] 7.3 `OptionCell.tsx` — `TableCell` → `Table.Cell`.
- [x] 7.4 `CharacterFormFields.tsx` — only used MUI `Grid`; → `Grid`/`GridItem` pattern. (No Select here — plan note was off.)
- [x] 7.5 `CharacterInfo.tsx` + `ActionInfo.tsx` — `@mui/lab` Tabs → Chakra `Tabs.Root`/`Tabs.List`/`Tabs.Trigger`/`Tabs.Content`; mobile `Select`+`MenuItem` → `NativeSelect.Root`/`Field`/`Indicator`; `useMediaQuery` → Chakra `useMediaQuery([q],{fallback})`; dropped `SyntheticEvent` handler.
- [x] 7.6 `pnpm build` passes; `pnpm lint` 5 pre-existing, no new. `dnd/` root MUI-free. Committed.

## 8. Verticals: dnd/race

- [x] 8.1 `RaceList.tsx` (`Grid`/`GridItem`, `Paper`→`Box`+`surfaceCardProps`, `Heading`); `RaceForm.tsx` (`Grid`/`GridItem`); `Subraces.tsx` (`Select`+`MenuItem` → `NativeSelect`, `Heading`); `CustomRaceTraits.tsx` (`Grid`/`GridItem`, `Paper`→`Box`, lucide `Wrench`/`Pencil`).
- [x] 8.2 `RacialTraits.tsx` (`Heading`); `RacialTraitCard.tsx` (`Text`/`Button variant="secondary"`, `borderTop`→`borderTopWidth`, `Add`→lucide `Plus`, `startIcon`→child); `RacialTraitsForm.tsx` (`Grid`/`GridItem`).
- [x] 8.3 `DraconicAncestryTable.tsx` + `DraconicAncestryRow.tsx` — `Table.ScrollArea`/`Table.Root size="sm"`/`Table.Header`/`Table.ColumnHeader`/`Table.Body`/`Table.Row`/`Table.Cell`.
- [x] 8.4 `pnpm build` passes; `pnpm lint` 5 pre-existing, no new. `dnd/race/` MUI-free. Committed.

## 9. Verticals: dnd/class

- [x] 9.1 `ClassList.tsx` (`Grid`/`GridItem` + `surfaceCardProps` + `Heading`); `Subclasses.tsx` (`Grid`/`GridItem`, `Select` → `NativeSelect`, lucide `Plus`/`Pencil`/`Wrench`); `SubclassForm.tsx` + `SubclassFeaturesForm.tsx` (`Grid`/`GridItem`).
- [x] 9.2 `ClassFeatures.tsx` (`Heading`); `FeatureItem.tsx` (`Grid`/`GridItem`/`Text`/`Button variant="ghost"`, `borderTop`→`borderTopWidth`, lucide `Plus`); `ClassSpecificInfo.tsx` (`Chip`→`Badge`; removed dead `InfoOutlineSharp` guard); `CustomSubclassInfo.tsx` (`Text`).
- [x] 9.3 `CreatingSpellSlotsTable.tsx` — `Table.ScrollArea`/`Table.Root`/`Table.Body`/`Table.Row`/`Table.Cell`; dropped last-child-border `sx`.
- [x] 9.4 `pnpm build` passes; `pnpm lint` 5 pre-existing, no new. `dnd/class/` MUI-free. Committed.

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
