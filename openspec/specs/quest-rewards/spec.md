# quest-rewards Specification

## Purpose

Lets the user maintain a personal catalog of rewards worth a point cost, and redeem points earned from completing quests for one of them.

## Requirements

### Requirement: Create reward
The system SHALL allow the user to create a reward with a name, an optional description, and a point cost that is a positive integer.

#### Scenario: Successful creation
- **WHEN** the user creates a reward with a name and a positive point cost
- **THEN** the system creates an active reward with that name, description, and point cost

#### Scenario: Rejects non-positive point cost
- **WHEN** the user attempts to create a reward with a point cost of zero or less
- **THEN** the system rejects the request and does not create the reward

### Requirement: Edit or archive reward
The system SHALL allow the user to update a reward's name, description, or point cost, or to archive it instead of deleting it.

#### Scenario: Archived reward is hidden from the active list
- **WHEN** the user archives a reward
- **THEN** the reward no longer appears when listing active rewards, and existing redemption history referencing it remains unchanged

### Requirement: List active rewards
The system SHALL allow the user to retrieve the list of active (non-archived) rewards.

#### Scenario: Only active rewards are listed
- **WHEN** the user requests the rewards list
- **THEN** the system returns only rewards that have not been archived

### Requirement: Redeem a reward
The system SHALL allow the user to redeem an active reward when the current point balance is at least the reward's point cost, debiting the balance by that cost and creating a timestamped redemption record.

#### Scenario: Successful redemption
- **WHEN** the user redeems an active reward and the point balance is at least the reward's cost
- **THEN** the system decreases the point balance by the reward's cost and creates a redemption record with the current timestamp and cost

#### Scenario: Rejects redemption with insufficient balance
- **WHEN** the user attempts to redeem a reward whose cost exceeds the current point balance
- **THEN** the system rejects the request and the point balance is unchanged

#### Scenario: Rejects redeeming an archived reward
- **WHEN** the user attempts to redeem an archived reward
- **THEN** the system rejects the request and the point balance is unchanged
