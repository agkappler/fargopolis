## Purpose

Lets the user maintain a personal catalog of repeatable task items, each worth a fixed number of points, that can be marked complete any number of times to earn points.

## ADDED Requirements

### Requirement: Create catalog item
The system SHALL allow the user to create a quest catalog item with a name, an optional description, and a point value that is a positive integer.

#### Scenario: Successful creation
- **WHEN** the user creates a catalog item with a name and a positive point value
- **THEN** the system creates an active catalog item with that name, description, and point value

#### Scenario: Rejects non-positive point value
- **WHEN** the user attempts to create a catalog item with a point value of zero or less
- **THEN** the system rejects the request and does not create the item

### Requirement: Edit catalog item
The system SHALL allow the user to update the name, description, or point value of an existing catalog item.

#### Scenario: Successful edit
- **WHEN** the user updates the point value of an existing catalog item
- **THEN** subsequent completions of that item award the new point value, and past completions are unaffected

### Requirement: Archive catalog item
The system SHALL allow the user to archive a catalog item instead of deleting it, preserving any history that references it.

#### Scenario: Archived item is hidden from the active catalog
- **WHEN** the user archives a catalog item
- **THEN** the item no longer appears when listing active catalog items, and existing completion history referencing it remains unchanged

### Requirement: List active catalog items
The system SHALL allow the user to retrieve the list of active (non-archived) catalog items.

#### Scenario: Only active items are listed
- **WHEN** the user requests the catalog list
- **THEN** the system returns only items that have not been archived

### Requirement: Catalog items are not scheduled
In this phase, catalog items SHALL have no due date, cadence, or recurrence exposed to the user; the item schema reserves room for such fields internally, but no behavior depends on them.

#### Scenario: No scheduling information is exposed
- **WHEN** the user views a catalog item
- **THEN** the system does not show a due date, cadence, or "overdue" status for it
