## Context

See [proposal.md](./proposal.md) — Why. The `inputs/` directory was already migrated on branch `feat/chakra-migrate`; its patterns are the reference for the rest:

- `chakra-theme.ts` defines the token system (`pine`, `ember`, `parchment`, `ink` scales; semantic `bg.*`/`fg.*`/`border.*`; `display`/`body`/`mono` fonts) plus three custom recipes: `badge` (variant `status`: success/info/warning/error — the `Chip` replacement), `button` (variants primary/secondary/ghost/addCard), and a `card` slot recipe.
- `src/components/inputs/fieldStyle.ts` documents a known Chakra-v3 + Tailwind-preflight interaction: recipe-level `borderWidth` doesn't reach built-in components at runtime, so border props are applied inline on field elements. Any converted component that renders a visible border must follow the same `fieldBorderProps` approach.
- Chakra v3 uses **namespace components** (`Table.Root`/`Table.Cell`, `Tabs.Root`/`Tabs.Trigger`, `Dialog.Root`/`Dialog.Content`, `Accordion.Root`, `Menu.Root`, `List.Root`) and `createListCollection` for `Select`.
- `react-hook-form` is used with `useFormContext`; `Field.Root`/`Field.Label`/`Field.ErrorText` is the established form-field wrapper.

Constraints: no test suite in `fargopolis-web` — `pnpm build` (`tsc --noEmit && vite build`) and `pnpm lint` are the only gates. `chakra:typegen` runs on `predev`/`prebuild`, so recipe/token changes must be followed by a build.

## Goals / Non-Goals

**Goals:**
- Every step is a self-contained PR-sized unit that passes `pnpm build` + `pnpm lint` with zero `@mui/*` imports added.
- Steps are ordered so shared code (`ui/`, icons, `capitalize`) lands before its consumers, minimizing churn and merge conflicts.
- Visual parity with the current MUI rendering is "close enough" — exact pixel matching is not required, but layout/spacing regressions should be avoided.
- End state: `@mui/material`, `@mui/icons-material`, `@mui/lab` removed from `package.json`; `src/theme.ts` deleted; `ThemeRegistry.tsx` has only `ChakraProvider`.

**Non-Goals:**
- No redesign — components keep their current structure, props, and behavior. Improvements to visual design are out of scope.
- No change to `@emotion/*` (Chakra v3 depends on them).
- No new shared abstraction layer / wrapper library over Chakra — use Chakra components directly, matching how `inputs/` was done.
- No touching `tailwindcss` config (Tailwind stays; it's orthogonal).

## Decisions

### D1: `skip_specs: true` — no delta specs

This is a pure implementation swap. No requirement, route, API, or user-visible contract changes. Per OpenSpec guidance, pure refactors set `skip_specs: true` rather than inventing requirements. Recorded in `.openspec.yaml`.

### D2: Slice by shared-dependency layers, then by vertical

Ordering chosen to make each step independently green and small:

1. **Leaf utilities** — local `capitalize` util; icon swaps (`@mui/icons-material` → `lucide-react`). Pure find-and-replace, no rendering change, unblocks `constants/`.
2. **`ui/` shared wrappers** — `AlertMessage`, `ErrorMessage`, `UnderConstructionAlert`, `SimpleDialog`, `StyledAccordion`, `ActionMenu`, `LoadingSpinner`, `LoadingWrapper`, `ImageBox`, `FileWrapper`, `Carousel`, button components. These are imported widely; converting them first means downstream files only need their own primitive swaps.
3. **Primitives, per vertical** (`home/`, `about/`, `bounties/`, `recipes/`, `dnd/…`, `pages/`) — `Typography`→`Text`/`Heading`, `Box`, `Paper`→`Box`, `Chip`→`badge` recipe, `Grid`, `Link`, `Divider`, `Avatar`. Each vertical folder is one or more steps.
4. **Compound components** — `Table*`, `Select`+`MenuItem`, `@mui/lab` Tabs, `List*`, `MyTimeline` Timeline. Handled per-file since each needs real API translation.
5. **Theme teardown** — only after grep shows zero `@mui/*` imports: delete `theme.ts`, strip `ThemeRegistry.tsx`, remove deps, final `pnpm build` + `pnpm lint`.

Alternative considered: migrate strictly file-by-file top-to-bottom. Rejected — shared `ui/` components would be converted last, forcing repeated re-touches of the same downstream files.

Alternative considered: one big-bang PR. Rejected — 81 files, no tests; unreviewable and un-bisectable.

### D3: Component mapping table (authoritative)

| MUI | Chakra v3 | Notes |
|---|---|---|
| `Typography` (h1–h6) | `Heading` | `size` prop; Fraunces via `fontFamily="display"` already in theme |
| `Typography` (body/caption) | `Text` | `variant`/`color` → `color="fg.secondary"` etc. |
| `Box` | `Box` | near drop-in; `sx` → style props |
| `Grid` (`container`/`item`/`xs`/`md`) | `SimpleGrid` or `Grid` + `GridItem` | no `item`/`container`; use `columns={{ base: 1, md: 2 }}` |
| `Paper` | `Box` w/ `bg="bg.raised"` `borderWidth="1px"` `borderColor="border.strong"` `borderRadius="md"` `shadow="sm"` | or the `card` slot recipe where it's a real card |
| `Divider` | `Separator` | |
| `Link` (`@mui/material`) | `Link` (`@chakra-ui/react`) | wrap `react-router` `Link` via `asChild` where routing |
| `Button` | `Button` | use existing `button` recipe variants |
| `IconButton` | `IconButton` | needs `aria-label`; child icon from `lucide-react` |
| `Chip` | `Badge` (custom `badge` recipe) | `status` variant maps from MUI `color` |
| `Avatar` | `Avatar.Root` + `Avatar.Image` + `Avatar.Fallback` | |
| `Alert` + `AlertColor` | `Alert.Root` + `Alert.Indicator` + `Alert.Content`/`Alert.Title` | `severity` → `status`; `AlertColor` type → `Alert.Root`'s `status` union |
| `CircularProgress` | `Spinner` | |
| `Dialog`/`DialogTitle`/`DialogContent` + `Breakpoint` | `Dialog.Root`/`Dialog.Backdrop`/`Dialog.Positioner`/`Dialog.Content`/`Dialog.Header`/`Dialog.Body`/`Dialog.CloseTrigger` | `maxWidth` `Breakpoint` → `size` prop (`"xs"..."xl"`/`"cover"`); `fullWidth` is default |
| `Accordion`/`AccordionSummary`/`AccordionDetails` | `Accordion.Root`/`Accordion.Item`/`Accordion.ItemTrigger`/`Accordion.ItemContent` + `Accordion.ItemIndicator` | `expandIcon` → `ItemIndicator`; `collapsible` prop |
| `Menu`/`MenuItem` (anchorEl pattern) | `Menu.Root`/`Menu.Trigger`/`Menu.Positioner`/`Menu.Content`/`Menu.Item` | drop `anchorEl`/`useState` — Chakra manages open state; `Menu.Item` needs a `value` |
| `Tab`/`@mui/lab` `TabContext`/`TabList`/`TabPanel` | `Tabs.Root`/`Tabs.List`/`Tabs.Trigger`/`Tabs.Content` | `value`-driven; `Tabs.Root value=` + `onValueChange` |
| `List`/`ListItem`/`ListItemIcon`/`ListItemText` | `List.Root`/`List.Item` + `List.Indicator` | or plain `Stack` of `Flex` for `DescriptionList` |
| `Table`/`TableContainer`/`TableHead`/`TableBody`/`TableRow`/`TableCell` | `Table.ScrollArea` + `Table.Root`/`Table.Header`/`Table.Body`/`Table.Row`/`Table.ColumnHeader`/`Table.Cell` | |
| `@mui/lab` `Timeline*` (`MyTimeline.tsx`) | hand-rolled `Flex`/`Box` — vertical rule + dots | no Chakra equivalent; single file, self-contained |
| `useMediaQuery("(max-width:X)")` | `useBreakpointValue({ base: true, md: false })` or Chakra `useMediaQuery(["(max-width: X)"])` | prefer `useBreakpointValue` where the breakpoint matches theme scale |
| `capitalize` (`@mui/material`) | local `src/helpers/capitalize.ts` (or `src/utils/`) | `s.charAt(0).toUpperCase() + s.slice(1)` — match MUI's behavior (throws on non-string is NOT needed) |
| `TypographyVariant`, `Breakpoint` (types) | remove / replace with local unions | |

### D4: Icon mapping — `@mui/icons-material` → `lucide-react`

`lucide-react` is already a dependency. One-to-one names:

| MUI icon | lucide-react |
|---|---|
| `Add` | `Plus` |
| `Remove` | `Minus` |
| `Edit` | `Pencil` |
| `Close` | `X` |
| `MoreVert` | `EllipsisVertical` |
| `ExpandMore` | `ChevronDown` |
| `ChevronLeft` / `ChevronRight` | `ChevronLeft` / `ChevronRight` |
| `Circle` / `CircleOutlined` | `Circle` (filled via `fill="currentColor"`) / `Circle` |
| `Casino` | `Dice5` |
| `Build` | `Wrench` |
| `Construction` | `Construction` |
| `Checklist` | `ListChecks` |
| `ListAlt` | `List` |
| `Description` | `FileText` |
| `Settings` | `Settings` |
| `Menu` | `Menu` |
| `GitHub` | **inline SVG** — `lucide-react@1.31.0` dropped brand icons; embed the GitHub logo path in `GitHubButton.tsx` |
| `LinkedIn` | **inline SVG** — same; embed the LinkedIn logo path in `LinkedInButton.tsx` |
| `InfoOutline` / `InfoOutlineSharp` | `Info` |
| `InsertDriveFile` | `File` |

Sizing: MUI icons default ~24px; pass `size={20}` or wrap in Chakra `<Icon>` where alignment matters.

### D5: `sx` prop migration

~22 `sx={}` usages. Static object `sx` → spread as Chakra style props. Theme-callback `sx={(theme) => …}` (e.g. `SimpleDialog`, `AlertMessage`) → replace `theme.palette.*` with Chakra tokens (`color="fg.subtle"`, `bg="bg.raised"`). Pseudo-selectors (`'&:before'`, `_hover`) → Chakra's `_before`/`_hover` props.

## Risks / Trade-offs

- **Visual drift** (spacing, font sizes, border colors differ subtly between systems) → Convert one vertical per step and eyeball it with `pnpm dev` before opening the PR; the `chakra-theme.ts` `fontSizes` scale is already tuned to the old MUI values.
- **Chakra v3 border-not-rendering gotcha** (documented in `fieldStyle.ts`) bites any bordered non-form component → Reuse the explicit `borderWidth`/`borderStyle`/`borderColor` inline pattern; add a shared `surfaceBorderProps` helper alongside `fieldBorderProps` if `Paper`/`Table`/`Accordion` all need it.
- **`Menu`/`Dialog`/`Tabs` behavior changes** (Chakra manages open state; focus-trap and portal behavior differ from MUI) → Keep the same public props on our wrapper components (`isOpen`/`onClose`, `options[]`) so call sites are untouched; only the internals change.
- **`@mui/lab` Timeline hand-roll** could regress the About page layout → Isolate to its own step; screenshot-compare `MyTimeline` before/after.
- **Large PR count** (~15–20 steps) creates rebase overhead on `feat/chakra-migrate` → Land steps quickly in sequence; each is independently revertible.
- **`lucide-react` is pinned `^1.31.0`** — unusual major; verify the mapped icon names exist in that version during step 1, adjust mapping if any are missing.

## Migration Plan

1. Work continues on `feat/chakra-migrate` (or short-lived branches off it), one step = one commit/PR.
2. Each step: convert files → `pnpm chakra:typegen` (if theme touched) → `pnpm build` → `pnpm lint` → visual check for UI-bearing steps → commit.
3. Gate before the final teardown step: `rg "@mui/" fargopolis-web/src` returns nothing.
4. Teardown step removes the three deps, deletes `theme.ts`, strips `ThemeRegistry.tsx`, runs `pnpm install` + full `pnpm build` + `pnpm lint`.
5. Rollback: each step is a discrete revert; the teardown step is the only irreversible-ish one and is trivially small.

## Open Questions

- `capitalize` util location: `src/helpers/` (co-located with `RequestManager`, `BaseInputProps`) vs a new `src/utils/`. Defaulting to `src/helpers/capitalize.ts` — does not affect approach or task breakdown; adjust on review if the repo prefers otherwise.
