## Purpose

Ensures that a failed data fetch on a page degrades gracefully: the page's header/title stays visible, and the failure is confined to and clearly reported within the section of the page that depends on the failed request, rather than blanking the entire page or failing silently.

## ADDED Requirements

### Requirement: Page header renders regardless of data-fetch outcome
A page whose content depends on one or more data fetches SHALL render its title/header unconditionally — before those fetches resolve, and whether they succeed, fail, or are still loading.

#### Scenario: Header stays visible when the page's only data fetch fails
- **WHEN** the Camping page's campsite list request fails
- **THEN** the page still renders its "Camping Catalog" header and project-details link

#### Scenario: Header stays visible when one of several data fetches fails
- **WHEN** the Bounties page's bounty-categories request fails but the bounty list request succeeds (or vice versa)
- **THEN** the page still renders its "Bounty Board" header and project-details link

### Requirement: A failed data fetch is confined to its dependent section
When a page has multiple independently-fetched sections, a failure in one section's fetch SHALL NOT prevent other sections (including the header and any section whose own fetch succeeded) from rendering.

#### Scenario: One of two independent sections fails
- **WHEN** the Bounties page's bounty-categories request fails and the bounty list request succeeds
- **THEN** the bounty grid renders normally with its bounties
- **AND** the category badges section shows an error in place of the categories, instead of the whole page

#### Scenario: The only section fails
- **WHEN** the Camping page's campsite list request fails
- **THEN** the campsite grid section shows an error message in place of the grid
- **AND** the header above it remains visible

### Requirement: A failed data fetch always shows a visible error message
Any section of a page whose data fetch fails SHALL display a visible, human-readable error message in place of that section's content. A failed fetch SHALL NOT be indistinguishable from an empty or successful result.

#### Scenario: Fetch failure is reported instead of rendering an empty list
- **WHEN** the Dnd page's character list request fails
- **THEN** the character catalog section shows an error message in place of the grid
- **AND** the page does not silently render an empty catalog with no indication of failure
