## Purpose

The campsite map renders campsite locations visually: an interactive pin map
across the whole catalog, a mini-map on each campsite, and a preview pin while
entering coordinates.

## ADDED Requirements

### Requirement: Catalog-wide pin map

The catalog view SHALL display an interactive map with one marker per campsite
that has valid coordinates. The initial view SHALL frame all such markers.
Selecting a marker SHALL identify the campsite and lead to its detail view.
Campsites without valid coordinates SHALL be omitted from the map without
breaking it.

#### Scenario: All campsites framed

- **WHEN** a user opens the catalog and campsites exist in multiple regions
- **THEN** the map opens zoomed and panned so every campsite marker is visible

#### Scenario: Marker leads to detail

- **WHEN** a user selects a campsite's marker
- **THEN** the campsite is identified (e.g. name shown) and the user can open `/camping/:id` for it

#### Scenario: Catalog with no mappable campsites

- **WHEN** the catalog has no campsites with valid coordinates
- **THEN** the map area shows an empty state and the catalog list still renders

### Requirement: Per-campsite mini-map

The campsite detail view SHALL display a mini-map centered on the campsite's
coordinates with a single marker at that point.

#### Scenario: Detail mini-map

- **WHEN** a user opens a campsite detail view
- **THEN** a small map is shown centered on the campsite with a marker at its coordinates

### Requirement: Coordinate-entry preview pin

While entering or editing a campsite, the form SHALL show a preview map with a
marker at the currently parsed coordinates, updating as the pasted text
resolves. When the coordinates do not parse, no marker is shown.

#### Scenario: Preview updates on paste

- **WHEN** the user pastes valid coordinates into the form
- **THEN** the preview map places a marker at that point

#### Scenario: No marker while unparseable

- **WHEN** the coordinate field contains text that does not parse to an in-range pair
- **THEN** the preview map shows no marker

### Requirement: Map tiles and attribution

The map SHALL load tiles from OpenStreetMap and SHALL display OpenStreetMap
attribution. Map rendering SHALL NOT require an API key or account.

#### Scenario: Attribution present

- **WHEN** any campsite map is displayed
- **THEN** visible OpenStreetMap attribution is present on the map

### Requirement: Maps degrade without breaking the page

If map tiles fail to load, the surrounding catalog and detail content SHALL
still render and remain usable.

#### Scenario: Tile load failure

- **WHEN** tile requests fail (e.g. offline)
- **THEN** the catalog list and campsite details are still shown and interactive
