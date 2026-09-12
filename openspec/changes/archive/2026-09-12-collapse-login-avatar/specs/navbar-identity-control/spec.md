## Purpose

Defines the single identity control shown in the site Navbar, so signed-in and signed-out users each see exactly one control for managing their session instead of a separate "Login" nav item plus a distinct avatar.

## ADDED Requirements

### Requirement: Single identity control
The Navbar SHALL show exactly one identity control at a time: the account avatar. The nav item list SHALL NOT include a separate "Login" entry.

#### Scenario: Nav items exclude Login
- **WHEN** the Navbar renders its list of nav items (desktop nav row or mobile drawer)
- **THEN** no "Login" item appears among them

#### Scenario: Signed-in user sees only the account menu
- **WHEN** a signed-in user views the Navbar (desktop or mobile)
- **THEN** the Clerk account avatar/menu (`UserButton`) is visible
- **AND** no separate "Login" control is visible

#### Scenario: Signed-out user sees only the placeholder avatar
- **WHEN** a signed-out user views the Navbar (desktop or mobile)
- **THEN** a single placeholder avatar is visible
- **AND** no separate "Login" control is visible

### Requirement: Signed-out placeholder is visually distinct from a signed-in avatar
The placeholder avatar SHALL use a generic, neutral visual (e.g. an outline person icon) rather than user-specific content (initials, photo, brand-colored fill), so it is unambiguous at a glance that no one is signed in.

#### Scenario: Placeholder does not resemble a real avatar
- **WHEN** a signed-out user views the placeholder avatar
- **THEN** it shows a generic person icon on a muted/outline background, not initials or a solid brand-colored fill

### Requirement: Signed-out avatar opens sign-in
The placeholder avatar shown to signed-out users SHALL be clickable and SHALL open the sign-in dialog (`LoginForm`) on click, on both desktop and mobile layouts.

#### Scenario: Clicking the placeholder avatar opens sign-in
- **WHEN** a signed-out user clicks the placeholder avatar
- **THEN** the sign-in dialog opens, presenting the `LoginForm`

#### Scenario: Completing sign-in closes the dialog
- **WHEN** a signed-out user successfully signs in through the dialog opened from the placeholder avatar
- **THEN** the dialog closes

### Requirement: Sign-in is reachable only through the avatar
Sign-in SHALL be triggered exclusively by the avatar's click handler, not by navigating to a dedicated route. The application SHALL NOT expose a `/login` route.

#### Scenario: No standalone login route
- **WHEN** a user navigates directly to `/login`
- **THEN** no dedicated login page is served (the route does not exist)
