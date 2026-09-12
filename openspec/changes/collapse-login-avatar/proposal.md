## Why

The Navbar currently shows a "Login" nav item in the always-visible nav list *and* a separate identity control (Clerk `UserButton` when signed in, or a static placeholder avatar when signed out) at the same time. This duplicates the entry point for authentication and wastes nav space — a user only ever needs one control for managing their signed-in/signed-out identity.

## What Changes

- Remove the "Login" entry from `NAV_ITEMS` so it no longer renders as its own nav item (desktop nav row and mobile drawer).
- When signed out, the placeholder avatar is redesigned as a neutral, generic sign-in indicator (outline person icon instead of "AK" initials, muted styling distinct from a real avatar) and becomes clickable, opening the existing `LoginForm` dialog — the same dialog the old "Login" nav item opened.
- When signed in, the identity avatar continues to render Clerk's `UserButton`, unchanged.
- Exactly one identity control (avatar) is visible at any time, in both the desktop nav bar and the mobile top bar; the mobile drawer no longer lists "Login" as a separate row.
- Remove the now-orphaned `/login` route and `LoginPage` — nothing links to it once the "Login" nav item is gone, since sign-in is triggered directly by the avatar's `onClick` rather than navigation.

## Capabilities

### New Capabilities
- `navbar-identity-control`: Single collapsed avatar control in the Navbar that opens sign-in when signed out and shows the Clerk user menu when signed in, replacing the separate "Login" nav item.

### Modified Capabilities
(none — no existing spec covers navbar behavior)

## Impact

- `fargopolis-web/src/components/navigation/Navbar.tsx`: remove "Login" from `NAV_ITEMS`, make the signed-out placeholder avatar clickable to open `LoginForm`, simplify `handleNav` (no more special-cased `/login` path), same behavior for mobile drawer/top bar.
- `fargopolis-web/src/components/navigation/SignInAvatar.tsx`: new component holding the signed-out avatar control.
- `fargopolis-web/src/App.tsx`: remove the `/login` route and its `LoginPage` import.
- `fargopolis-web/src/pages/LoginPage.tsx`: deleted (orphaned once the "Login" nav item no longer navigates there).
- No API, backend, or DynamoDB impact — frontend-only UI change.
