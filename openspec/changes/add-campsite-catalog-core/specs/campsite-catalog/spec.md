## Purpose

The campsite catalog lets a signed-in user record every physical place they have
camped and lets anyone browse that catalog. Each campsite captures where the
place is, how far it is to drive, what the site is like, and free-form notes.

## ADDED Requirements

### Requirement: Browse the campsite catalog

The system SHALL provide an endpoint that returns every campsite with the fields
needed to render a catalog list and (later) map pins: identifier, name,
coordinates, region, park, drive time, firepit flag, the three character
ratings, and cover photo identifier when present. The list SHALL be ordered
case-insensitively by name.

Anyone MAY call this endpoint; authentication is optional.

#### Scenario: Listing returns all campsites ordered by name

- **WHEN** a client requests the campsite list
- **THEN** the response contains one entry per stored campsite
- **AND** entries are ordered A–Z by name, ignoring case and surrounding whitespace
- **AND** each entry includes identifier, name, latitude, longitude, region, park, drive time, firepit flag, and the views/privacy/space ratings

#### Scenario: Empty catalog

- **WHEN** a client requests the campsite list and no campsites exist
- **THEN** the response is an empty list with a success status

### Requirement: View a single campsite

The system SHALL provide an endpoint that returns one campsite by identifier
with all of its stored fields. It SHALL return a not-found response when no
campsite has that identifier. Authentication is optional.

#### Scenario: Fetch existing campsite

- **WHEN** a client requests a campsite by an identifier that exists
- **THEN** the response contains that campsite's name, coordinates, region, park, drive time, dyrt URL, firepit flag, views/privacy/space ratings, and notes

#### Scenario: Fetch missing campsite

- **WHEN** a client requests a campsite by an identifier that does not exist
- **THEN** the response status indicates the campsite was not found

### Requirement: Create a campsite

The system SHALL allow a signed-in user to create a campsite. The request MUST
provide a non-empty name and a valid coordinate pair. Latitude MUST be between
-90 and 90 and longitude between -180 and 180. All other fields are optional.
The system SHALL assign a unique identifier and return the created campsite.

Requests without a valid signed-in session SHALL be rejected as unauthorized.

#### Scenario: Create with required fields

- **WHEN** a signed-in user submits a campsite with a name and valid coordinates
- **THEN** the system stores it with a new unique identifier
- **AND** the response contains the stored campsite including its identifier

#### Scenario: Create with full detail

- **WHEN** a signed-in user submits a campsite with name, coordinates, region, park, drive time, dyrt URL, firepit flag, views/privacy/space ratings, and notes
- **THEN** every provided field is persisted and returned

#### Scenario: Reject missing name

- **WHEN** a create request omits the name or provides only whitespace
- **THEN** the system rejects it with a client error and does not store anything

#### Scenario: Reject out-of-range coordinates

- **WHEN** a create request provides a latitude outside -90..90 or a longitude outside -180..180
- **THEN** the system rejects it with a client error and does not store anything

#### Scenario: Reject unauthenticated create

- **WHEN** a create request arrives without a valid signed-in session
- **THEN** the system rejects it as unauthorized and does not store anything

### Requirement: Update a campsite

The system SHALL allow a signed-in user to update an existing campsite's
editable fields (name, coordinates, region, park, drive time, dyrt URL, firepit
flag, views/privacy/space ratings, notes). The same name and coordinate
validation as create applies. Updating a missing campsite SHALL return a
not-found response. Unauthenticated requests SHALL be rejected.

#### Scenario: Update fields

- **WHEN** a signed-in user updates a campsite's region and notes
- **THEN** the stored campsite reflects the new values and unchanged fields are preserved

#### Scenario: Update missing campsite

- **WHEN** a signed-in user updates a campsite identifier that does not exist
- **THEN** the response status indicates the campsite was not found

#### Scenario: Reject invalid update

- **WHEN** an update sets an empty name or an out-of-range coordinate
- **THEN** the system rejects it with a client error and leaves the stored campsite unchanged

### Requirement: Delete a campsite

The system SHALL allow a signed-in user to delete a campsite by identifier.
Deleting a campsite that does not exist SHALL succeed idempotently or return a
not-found response. Unauthenticated requests SHALL be rejected.

#### Scenario: Delete existing campsite

- **WHEN** a signed-in user deletes an existing campsite
- **THEN** it no longer appears in the catalog list or by direct fetch

#### Scenario: Reject unauthenticated delete

- **WHEN** a delete request arrives without a valid signed-in session
- **THEN** the system rejects it as unauthorized and the campsite remains

### Requirement: Coordinate entry by paste

The frontend SHALL let the user enter a location by pasting a coordinate string
and SHALL parse common formats into a latitude/longitude pair before submitting:
comma- or space-separated decimal degrees (e.g. `44.63, -110.72`), with an
optional `N`/`S`/`E`/`W` hemisphere suffix mapping S/W to negative values. When
the pasted text cannot be parsed into an in-range pair, the form SHALL show an
inline error and SHALL NOT submit.

#### Scenario: Paste decimal degrees

- **WHEN** the user pastes `44.63, -110.72` into the coordinate field
- **THEN** the form resolves latitude `44.63` and longitude `-110.72`

#### Scenario: Paste with hemisphere suffixes

- **WHEN** the user pastes `44.63 N, 110.72 W`
- **THEN** the form resolves latitude `44.63` and longitude `-110.72`

#### Scenario: Reject unparseable coordinates

- **WHEN** the user pastes text that is not a coordinate pair or is out of range
- **THEN** the form shows an inline error and the campsite is not submitted

### Requirement: Region is chosen from prior values or entered fresh

The campsite form SHALL present the set of regions already used by existing
campsites as selectable suggestions, and SHALL also allow the user to type a new
region that is not yet in the list. The chosen or typed region is stored verbatim
on the campsite.

#### Scenario: Pick an existing region

- **WHEN** the user opens the region control and the catalog already contains campsites in "Lyons" and "Breckenridge"
- **THEN** both "Lyons" and "Breckenridge" are offered as selectable suggestions
- **AND** picking one stores that value on the campsite

#### Scenario: Enter a new region

- **WHEN** the user types a region that no existing campsite uses
- **THEN** the new value is accepted and stored, and becomes a suggestion for later campsites

### Requirement: Catalog and detail navigation

The frontend SHALL present a catalog view at `/camping` listing every campsite
with its name, region, and key attributes, plus a control to add a new campsite.
Selecting a campsite SHALL open a detail view at `/camping/:id` showing all
fields, an edit affordance, a delete affordance, and a "View on Google Maps"
link built from the campsite's coordinates. The camping section SHALL be
reachable from the main navigation.

#### Scenario: Open catalog

- **WHEN** a user navigates to `/camping`
- **THEN** they see a card for each campsite and an "add campsite" control

#### Scenario: Open detail and jump to Google Maps

- **WHEN** a user selects a campsite from the catalog
- **THEN** they see its full detail at `/camping/:id`
- **AND** a "View on Google Maps" link opens Google Maps centered on the stored coordinates

#### Scenario: Edit controls require sign-in

- **WHEN** a signed-out visitor opens a campsite detail view
- **THEN** they can read all fields but the create, edit, and delete actions are unavailable or fail with a sign-in prompt
