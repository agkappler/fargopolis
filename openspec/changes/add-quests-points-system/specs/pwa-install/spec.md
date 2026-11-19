## Purpose

Lets the user install fargopolis-web to a phone's home screen and launch it like a standalone app, so the quests catalog is quick to reach.

## ADDED Requirements

### Requirement: App is installable
The system SHALL provide a valid web app manifest (name, icons, start URL, standalone display mode) so supported browsers offer an "install" or "add to home screen" action.

#### Scenario: Install option is offered on a supported mobile browser
- **WHEN** the user visits the site on a supported mobile browser
- **THEN** the browser recognizes the manifest and offers an install / add-to-home-screen action

### Requirement: Installed app launches standalone
Launching the app from its home-screen icon SHALL open it in standalone display mode, without the browser's address bar or navigation chrome.

#### Scenario: Launching from the home screen
- **WHEN** the user taps the installed app's home-screen icon
- **THEN** the app opens in standalone mode without browser chrome

### Requirement: App shell loads without network
The system SHALL cache the app shell (static assets needed to render the UI) via a service worker so a previously visited session can reopen the shell without network connectivity.

#### Scenario: Reopening the app shell offline
- **WHEN** the user has opened the app at least once while online and later opens it with no network connectivity
- **THEN** the cached app shell renders, even though data requiring the API is unavailable until connectivity returns
