## Purpose

Campsite visits turn the catalog into a trip history: each stay at a campsite is
recorded with its dates, the people who came, weather, an optional rating, and
notes, and the catalog surfaces how often and how recently each place was used.

## ADDED Requirements

### Requirement: Add a visit to a campsite

The system SHALL allow a signed-in user to add a visit to an existing campsite.
A visit MUST include a `startDate` (calendar date). It MAY include an `endDate`
(calendar date on or after `startDate`; absence means a single night), a
`people` list of attendee names, free-form `notes`, a short free-form `weather`
value, and a `rating` from 1 to 5. The system SHALL assign the visit a unique
identifier and return the updated campsite.

Adding a visit to a missing campsite SHALL return a not-found response.
Unauthenticated requests SHALL be rejected.

#### Scenario: Add a minimal visit

- **WHEN** a signed-in user adds a visit with only a `startDate` to an existing campsite
- **THEN** the campsite gains a visit with a new unique identifier and that start date
- **AND** the response contains the updated campsite including the new visit

#### Scenario: Add a detailed visit

- **WHEN** a signed-in user adds a visit with start and end dates, three named people, weather, a rating of 4, and notes
- **THEN** every provided field is stored on the new visit

#### Scenario: Reject end date before start date

- **WHEN** a visit is submitted with an `endDate` earlier than its `startDate`
- **THEN** the system rejects it with a client error and stores no visit

#### Scenario: Reject rating out of range

- **WHEN** a visit is submitted with a rating below 1 or above 5
- **THEN** the system rejects it with a client error and stores no visit

#### Scenario: Reject visit on missing campsite

- **WHEN** a signed-in user adds a visit to a campsite identifier that does not exist
- **THEN** the response status indicates the campsite was not found

#### Scenario: Reject unauthenticated add

- **WHEN** an add-visit request arrives without a valid signed-in session
- **THEN** the system rejects it as unauthorized and stores no visit

### Requirement: Update a visit

The system SHALL allow a signed-in user to update the fields of an existing
visit identified by its campsite and visit identifiers. The same date and rating
validation as adding a visit applies. Updating a visit that does not exist on
that campsite SHALL return a not-found response. Unauthenticated requests SHALL
be rejected.

#### Scenario: Edit visit fields

- **WHEN** a signed-in user changes a visit's people list and rating
- **THEN** the stored visit reflects the new values and its other fields are unchanged

#### Scenario: Update missing visit

- **WHEN** a signed-in user updates a visit identifier not present on the given campsite
- **THEN** the response status indicates the visit was not found

### Requirement: Delete a visit

The system SHALL allow a signed-in user to delete a visit from a campsite by
campsite and visit identifiers, and SHALL return the updated campsite.
Unauthenticated requests SHALL be rejected.

#### Scenario: Remove a visit

- **WHEN** a signed-in user deletes a visit from a campsite that has two visits
- **THEN** the campsite is returned with only the remaining visit

#### Scenario: Reject unauthenticated delete

- **WHEN** a delete-visit request arrives without a valid signed-in session
- **THEN** the system rejects it as unauthorized and the visit remains

### Requirement: Concurrent visit edits are guarded

The system SHALL guard concurrent modifications to a campsite's visit list using
the campsite's version attribute, so that a write based on a stale view of the
visits is rejected rather than silently overwriting a newer change.

#### Scenario: Stale write is rejected

- **WHEN** two visit writes to the same campsite race and the second is based on the pre-first state
- **THEN** the second write fails with a conflict and the first write's result is preserved

### Requirement: Visit ordering

When a campsite is fetched, its visits SHALL be returned ordered by `startDate`
descending (most recent stay first).

#### Scenario: Newest visit first

- **WHEN** a campsite with visits in 2023, 2025, and 2024 is fetched
- **THEN** the visits array is ordered 2025, 2024, 2023

### Requirement: Catalog exposes visit summary

The campsite catalog list and the single-campsite response SHALL each include a
`visitCount` (number of recorded visits) and a `lastVisitDate` (the most recent
visit's `startDate`, or absent when there are no visits). These SHALL be kept
consistent with the visit list on every add, update, and delete.

#### Scenario: Summary appears in the list

- **WHEN** a client requests the campsite list and a campsite has three visits, the latest starting 2025-09-01
- **THEN** that campsite's list entry reports `visitCount` 3 and `lastVisitDate` 2025-09-01

#### Scenario: Summary updates after delete

- **WHEN** the most recent visit of a campsite is deleted
- **THEN** the campsite's `lastVisitDate` becomes the next-most-recent visit's start date and `visitCount` decreases by one

#### Scenario: No visits

- **WHEN** a campsite has no visits
- **THEN** its `visitCount` is 0 and `lastVisitDate` is absent

### Requirement: Visit timeline in the campsite detail view

The campsite detail view SHALL show the campsite's visits as a timeline ordered
most-recent-first, each entry showing its date range, attendees, weather,
rating, and notes. A signed-in user SHALL be able to add a visit, edit a visit,
and delete a visit from this view; attendees SHALL be editable as a list of
name chips. The catalog card SHALL show the visit count and the last-visited
date.

#### Scenario: See and manage the timeline

- **WHEN** a signed-in user opens a campsite with visits
- **THEN** the visits are listed newest first with their details
- **AND** controls to add, edit, and delete visits are available

#### Scenario: Edit attendees as chips

- **WHEN** a signed-in user edits a visit and adds an attendee name
- **THEN** the name appears as a removable chip and is saved to the visit's people list

#### Scenario: Card shows visit summary

- **WHEN** a user views the catalog
- **THEN** each card shows how many stays the campsite has and when it was last visited
