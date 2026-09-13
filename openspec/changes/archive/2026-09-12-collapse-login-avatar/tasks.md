## 1. Navbar: remove standalone Login nav item

- [x] 1.1 Remove the `{ label: "Login", path: "/login" }` entry from `NAV_ITEMS` in `fargopolis-web/src/components/navigation/Navbar.tsx`.
- [x] 1.2 Remove the now-unused `/login` special case from `handleNav` (and the `loginOpen` state setter call it made), since opening the login dialog will instead be triggered directly from the avatar's `onClick`.

## 2. Navbar: make signed-out avatar open sign-in

- [x] 2.1 Replace the signed-out placeholder's "AK" text + solid `pine.500` fill with a generic outline avatar: a lucide-react `CircleUserRound` icon on a muted/bordered circle (e.g. `border="1px solid" borderColor="border"`, `bg="transparent"`, `color="fg.secondary"`), and add `onClick={() => setLoginOpen(true)}`, `cursor="pointer"`, and an accessible label (`role="button"` / `aria-label="Sign in"`).
- [x] 2.2 Apply the same redesigned placeholder to the mobile top bar signed-out state (mirroring desktop) so mobile also gets the clearer "not signed in" indicator, instead of relying on the drawer's removed "Login" row.
- [x] 2.3 Keep the `<Show when="signed-in"><UserButton /></Show>` blocks (desktop and mobile) unchanged.

## 3. Verify

- [x] 3.1 Run `pnpm build` and `pnpm lint` in `fargopolis-web/` to confirm no type/lint errors.
- [x] 3.2 Manually test in the browser: signed-out desktop shows only the placeholder avatar, clicking it opens the `LoginForm` dialog, and signing in swaps it for `UserButton`; repeat for the mobile breakpoint (top bar avatar and drawer no longer list "Login").

## 4. Remove the orphaned `/login` route

- [x] 4.1 Remove the `/login` route and `LoginPage` import from `fargopolis-web/src/App.tsx`.
- [x] 4.2 Delete `fargopolis-web/src/pages/LoginPage.tsx`.
- [x] 4.3 Re-run `pnpm build` and `pnpm lint` to confirm removal doesn't break anything.
