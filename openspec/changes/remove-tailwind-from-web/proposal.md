## Why

The MUI → Chakra UI v3 migration ([migrate-remaining-mui-to-chakra](../migrate-remaining-mui-to-chakra/)) left Tailwind CSS 3 in place as the last remaining styling system. Every cascade bug hit during and after that migration — invisible field borders ([inputs/fieldStyle.ts](../../../fargopolis-web/src/components/inputs/fieldStyle.ts)), the lingering closed-dialog pane that blocked clicks — traces to **Tailwind's preflight reset fighting Chakra v3's `@layer` reset/recipe cascade**. Two resets in one app is permanent whack-a-mole. Tailwind's actual footprint is now trivial (41 utility `className`s, all plain spacing/flex helpers), so removing it is low-risk and finishes the "one styling system" goal.

## What Changes

Pure build/tooling + mechanical refactor — no user-facing behavior, routes, data, or API changes.

- Convert all **41 `className` utilities** (28 files) to Chakra style props. Tailwind's spacing scale (`0.25rem × n`) matches Chakra's, so `mb-2` → `mb={2}`, `p-2 h-full` → `p={2} h="full"`, `flex items-center` → `display="flex" alignItems="center"`, etc.
- Move the 3 referenced `--fp-*` CSS custom properties (`--fp-container`, `--fp-container-narrow`, `--fp-nav-height`; 7 call sites) into `chakra-theme.ts` as `sizes` tokens; drop the unused color/font/easing `--fp-*` vars.
- Delete `fargopolis-web/src/globals.scss` (only held `@tailwind` directives + the `:root` var block) and its `main.tsx` import.
- Delete `tailwind.config.ts`; remove the `tailwindcss` plugin from `postcss.config.js` (keep `autoprefixer` — orthogonal to this change).
- **BREAKING (build-time only):** remove `tailwindcss` and `sass` from `fargopolis-web/package.json`; `pnpm install`.
- Rely on Chakra v3's built-in reset (from `createSystem(defaultConfig, …)`) plus `chakra-theme.ts` `globalCss` for base styling — no Tailwind preflight needed.

## Capabilities

### New Capabilities
_None — pure refactor. `skip_specs: true` is set in `.openspec.yaml`._

### Modified Capabilities
_None._

## Impact

- **Code:** ~30 `.tsx`/`.ts` files under `fargopolis-web/src/` (className → style props), `chakra-theme.ts` (+3 tokens), `App.tsx` (`<main className>`), `main.tsx` (drop scss import).
- **Dependencies:** removes `tailwindcss` (devDep) and `sass` (dep). Keeps `postcss` + `autoprefixer`. `@emotion/*` unchanged.
- **Config:** deletes `tailwind.config.ts`, `src/globals.scss`; trims `postcss.config.js`.
- **Build/test gates:** `pnpm build` (`tsc --noEmit && vite build`) and `pnpm lint` — no test suite. No new lint errors beyond the 5 pre-existing `no-explicit-any`.
- **Reverts** the "Tailwind stays" non-goal from the MUI migration's `design.md`.
- **No change to:** API, CDK infra, routing, auth, data models, Clerk theming, `react-toastify`.
