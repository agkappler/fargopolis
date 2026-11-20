# quest-points Specification

## Purpose

Lets the user record completions of catalog items, maintain a single running point balance, and view how that balance has changed over time.

## Requirements

### Requirement: Log a completion
The system SHALL allow the user to record a completion of an active catalog item, which increases the point balance by that item's current point value and creates a timestamped completion record.

#### Scenario: Successful completion
- **WHEN** the user marks an active catalog item as completed
- **THEN** the system creates a completion record with the current timestamp and the item's current point value, and increases the point balance by that amount

#### Scenario: Rejects completing an archived item
- **WHEN** the user attempts to mark an archived catalog item as completed
- **THEN** the system rejects the request and the point balance is unchanged

### Requirement: View point balance
The system SHALL allow the user to retrieve the current total point balance at any time.

#### Scenario: Balance reflects all activity
- **WHEN** the user requests the current point balance
- **THEN** the system returns the sum of all recorded completions minus all recorded redemptions

### Requirement: View point history
The system SHALL allow the user to retrieve a chronological list of point-affecting events, including both completions and redemptions, to see how the balance changed over time.

#### Scenario: History includes completions and redemptions in order
- **WHEN** the user requests their point history
- **THEN** the system returns completions and redemptions ordered by when they occurred, each showing the point amount and direction (earned or spent)

### Requirement: Balance stays consistent with history
The point balance SHALL always equal the sum of all recorded completions and redemptions; updates to the balance SHALL be applied atomically with the corresponding history record so the two never diverge.

#### Scenario: Balance matches summed history after multiple events
- **WHEN** several completions and redemptions have been recorded
- **THEN** the current point balance equals the sum of the point amounts in the point history
