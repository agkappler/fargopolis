## Why

The `fargopolis-web` SPA is mid-migration from MUI to Chakra UI v3. Only `src/components/inputs/` has been converted; **81 files** still import `@mui/material`, `@mui/icons-material`, or `@mui/lab`, and the app ships both design systems (plus two theme definitions and two providers). Finishing the migration removes ~3 large runtime dependencies, deletes the duplicate `src/theme.ts` + MUI `ThemeProvider`, and leaves a single styling system that matches the already-built `chakra-theme.ts` tokens/recipes.

## What Changes

This is a **pure UI-library refactor** — no user-facing behavior, routes, data, or API calls change. Work is broken into small, independently shippable steps so each PR builds and lints green on its own.

- Add a local `capitalize` util and swap the 5 `capitalize` imports off `@mui/material`.
- Replace all 20 distinct `@mui/icons-material` icons with `lucide-react` equivalents (already a dependency), including the 3 `src/constants/` files.
- Convert shared `src/components/ui/` wrappers (`AlertMessage`, `ErrorMessage`, `UnderConstructionAlert`, `SimpleDialog`, `StyledAccordion`, `ActionMenu`, `LoadingSpinner`, `LoadingWrapper`, `Carousel`, `ImageBox`, `FileWrapper`, buttons) to Chakra namespace components.
- Convert leaf primitives across all verticals: `Typography` → `Text`/`Heading`, `Paper` → themed `Box`/`card` recipe, `Chip` → the existing `badge` recipe, `Box`/`Grid`/`Divider`/`Link`/`Avatar` → Chakra equivalents.
- Convert compound components: MUI `Table*` → `Table.*`, `Select`+`MenuItem` → `Select`/`NativeSelect`, `@mui/lab` Tabs → `Tabs.*`, `List*` → `List.*`.
- Hand-roll the `@mui/lab` `Timeline` in `MyTimeline.tsx` (no Chakra equivalent) with `Flex`/`Box`.
- Replace `useMediaQuery` (4 uses) with Chakra's `useBreakpointValue` / `useMediaQuery`.
- Port the three MUI `styleOverrides` (Paper `backgroundImage:none`, Chip mono font, Tab weight) into `chakra-theme.ts` where still needed; migrate the ~22 `sx={}` props to Chakra style props.
- **BREAKING (build-time only):** delete `src/theme.ts`, remove the MUI `ThemeProvider` from `ThemeRegistry.tsx`, and remove `@mui/material`, `@mui/icons-material`, `@mui/lab` from `package.json`.

## Capabilities

### New Capabilities
_None — pure refactor. `skip_specs: true` is set in `.openspec.yaml`._

### Modified Capabilities
_None._

## Impact

- **Code:** ~81 `.tsx`/`.ts` files under `fargopolis-web/src/` (`components/`, `pages/`, `constants/`), plus `ThemeRegistry.tsx` and deletion of `theme.ts`.
- **Dependencies:** removes `@mui/material`, `@mui/icons-material`, `@mui/lab`. Keeps `@emotion/react` + `@emotion/styled` (required by Chakra v3). `lucide-react` already present.
- **Build/test gates:** `pnpm build` (`tsc --noEmit && vite build`) and `pnpm lint` — no test suite in this package. Each step must pass both.
- **No change to:** API contracts, CDK infrastructure, routing, auth, data models, or `RequestManager`.
