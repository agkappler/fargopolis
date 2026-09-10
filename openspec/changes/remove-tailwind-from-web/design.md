## Context

See [proposal.md](./proposal.md) — Why. State after the MUI migration: `fargopolis-web` renders through Chakra v3 (`ChakraProvider` + `chakraSystem` from `chakra-theme.ts`) and Emotion. Tailwind 3 is still wired via `postcss.config.js` → `src/globals.scss` (`@tailwind base/components/utilities`), imported once in `main.tsx`. Remaining Tailwind usage: 41 `className` utilities across 28 files (all spacing/flex/`font-bold`), an unused `theme.extend.backgroundImage` in `tailwind.config.ts`, and a `:root` block of `--fp-*` custom properties of which only `--fp-container`, `--fp-container-narrow`, `--fp-nav-height` are referenced (7 sites).

Gate: `pnpm build` + `pnpm lint`; no test suite. Baseline lint = 5 pre-existing `no-explicit-any` errors (out of scope).

## Goals / Non-Goals

**Goals:**
- Zero `className` attributes and zero `tailwindcss` references in `fargopolis-web`.
- One reset / one cascade (Chakra v3's layered reset), eliminating the preflight-vs-Chakra conflict class.
- Visual parity — the utilities being replaced are all margin/padding/flex, and Tailwind's `0.25rem` spacing unit equals Chakra's, so numeric values port 1:1.
- Land as one reviewable change; `pnpm build` + `pnpm lint` green with no new errors.

**Non-Goals:**
- Removing `autoprefixer` / `postcss` — orthogonal; Emotion self-prefixes but keeping autoprefixer is a safe no-op and out of scope here.
- Reworking `chakra-theme.ts` beyond adding the 3 layout tokens.
- Touching the 5 pre-existing `no-explicit-any` lint errors.
- Any visual redesign.

## Decisions

### D1: `className` → Chakra style props, value-for-value

Chakra and Tailwind both use a `0.25rem × n` spacing scale, so the number carries over unchanged:

| Tailwind | Chakra props |
|---|---|
| `mb-2` / `p-2` / `m-2` / `mt-2` / `px-2` / `pt-3` / `mr-1` | `mb={2}` / `p={2}` / `m={2}` / `mt={2}` / `px={2}` / `pt={3}` / `mr={1}` |
| `h-full` / `w-full` | `h="full"` / `w="full"` |
| `flex` | `display="flex"` |
| `flex-col` | `flexDirection="column"` |
| `flex-grow` / `flex-1` | `flex="1"` |
| `items-center` | `alignItems="center"` |
| `justify-center` / `justify-between` / `justify-end` | `justifyContent="center"` / `"space-between"` / `"flex-end"` |
| `justify-self-center` | `justifySelf="center"` |
| `font-bold` | `fontWeight="bold"` |

Merge into existing prop lists on the same element; where a `className` sat on a bare DOM node (`<main className="flex-grow">`) switch to `<Box as="main" flex="1">`. Lucide icons (`<Settings className="mr-1" />` in `constants/Projects.tsx`) take `style={{ marginRight: "0.25rem" }}` since they are plain SVG components, not Chakra elements.

Alternative considered: a Tailwind→Chakra codemod. Rejected — 41 occurrences, ~20 distinct strings; hand edits are faster and safer than tuning a codemod for this volume.

### D2: `--fp-*` layout vars → Chakra `sizes` tokens

Add to `chakra-theme.ts` `theme.tokens.sizes`:

```ts
sizes: {
  "fp.container":        { value: "1180px" },
  "fp.container-narrow": { value: "720px" },
  "fp.nav":              { value: "64px" },
}
```

Replace `maxW="var(--fp-container)"` → `maxW="fp.container"`, `var(--fp-container-narrow)` → `"fp.container-narrow"`, `h="var(--fp-nav-height)"` → `h="fp.nav"` (7 sites: `PageHeader.tsx`, `Navbar.tsx` ×2, `AboutPage.tsx`, `BountiesPage.tsx`, `HomePage.tsx`, `RecipesPage.tsx`). Then `src/globals.scss` has nothing left → delete it, drop its `main.tsx` import, remove `sass` from `package.json`.

The unused `--fp-*` color/font/`ease`/`dur` vars are dropped; `chakra-theme.ts` tokens already cover those values.

Alternative considered: keep a slim `globals.css` with just the 3 vars. Rejected — leaves a stray stylesheet and the `sass`/`postcss`-for-css path alive for three constants that belong in the token system anyway.

### D3: No Tailwind preflight replacement needed

Chakra v3's `createSystem(defaultConfig, config)` ships a layered CSS reset (box-sizing, margin/padding zeroing, form-element normalization); `chakra-theme.ts` `globalCss` already sets `body` background/color/font and `#root` flex layout. Removing `@tailwind base` therefore drops a *duplicate* reset, not the only one. Verify by build + a `pnpm dev` smoke check of a few routes.

## Risks / Trade-offs

- **A converted element loses a style because a `className` utility had no exact prop match** → The audited set is entirely spacing/flex/`font-bold`, all of which have direct props; convert file-by-file and eyeball the diff.
- **Losing Tailwind preflight changes some base rendering** (e.g. default heading margins, list styling) → Chakra's reset + `globalCss` cover the app shell; smoke-test About (timeline), a form modal, and a card grid in `pnpm dev` before merge.
- **`sizes` token name with a dot/hyphen** (`fp.container-narrow`) → Chakra allows it; if typegen or the `maxW` prop rejects the string, fall back to nested `sizes: { fp: { container, containerNarrow, nav } }` and reference `"fp.containerNarrow"`.
- **Stacking on the MUI-migration branch** → this change is a small, self-contained follow-up commit series on the same branch; independently revertible.

## Migration Plan

1. Same branch as the MUI migration (`feat/chakra-migrate`), one step per task group, each ending in `pnpm build` + `pnpm lint` + commit.
2. Order: tokens first (D2) so var call sites can be converted → className conversions per area (D1) → delete config/scss + drop deps → full build/lint + `pnpm dev` smoke check.
3. Rollback: discrete reverts per commit; the dependency-removal commit is the only slightly-irreversible one and is small.

## Open Questions

_None._
