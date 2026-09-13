## Purpose

Campsite photos let a signed-in user attach an ordered set of pictures to each
visit and pick one image as the campsite's cover, so the catalog and detail
views show what each place actually looks like.

## ADDED Requirements

### Requirement: Upload a campsite photo

The system SHALL let a signed-in user upload an image for use as a campsite
photo through the existing presigned-upload flow, using a dedicated
`CAMPSITE_PHOTO` file role. The upload SHALL yield a file identifier that can be
attached to a visit. Unauthenticated upload requests SHALL be rejected.

#### Scenario: Upload yields an attachable file id

- **WHEN** a signed-in user uploads a JPEG with the campsite-photo role
- **THEN** the image is stored and a file identifier is returned
- **AND** that identifier can be added to a visit's photo list

#### Scenario: Reject unauthenticated upload

- **WHEN** an upload request for the campsite-photo role arrives without a valid signed-in session
- **THEN** it is rejected as unauthorized and nothing is stored

### Requirement: A visit has an ordered photo list

Each visit SHALL carry an ordered list of photo file identifiers, empty by
default. The system SHALL let a signed-in user set that list — adding, removing,
and reordering entries — for a visit identified by its campsite and visit
identifiers. The order submitted is the order stored and returned. Concurrent
edits SHALL be guarded by the campsite version attribute. Unauthenticated
requests SHALL be rejected; a missing campsite or visit SHALL return not-found.

#### Scenario: Attach photos to a visit

- **WHEN** a signed-in user sets a visit's photo list to three uploaded file identifiers
- **THEN** fetching the campsite returns that visit with those three identifiers in that order

#### Scenario: Reorder photos

- **WHEN** a signed-in user submits the same identifiers in a new order
- **THEN** the stored order matches the submitted order

#### Scenario: Remove a photo from a visit

- **WHEN** a signed-in user submits the list without one previously attached identifier
- **THEN** that identifier is no longer associated with the visit

#### Scenario: Stale photo-list write is rejected

- **WHEN** a photo-list write races another write to the same campsite and is based on the older state
- **THEN** it fails with a conflict and the other write is preserved

#### Scenario: Reject on missing visit

- **WHEN** a signed-in user sets photos for a visit identifier not present on the campsite
- **THEN** the response status indicates not-found

### Requirement: A campsite has an optional cover photo

Each campsite MAY have a `coverPhotoId`. The system SHALL let a signed-in user
set it to a photo identifier that belongs to one of that campsite's visits, or
clear it. Setting it to an identifier that is not among the campsite's visit
photos SHALL be rejected. Unauthenticated requests SHALL be rejected.

#### Scenario: Set the cover photo

- **WHEN** a signed-in user sets the campsite cover to a photo identifier attached to one of its visits
- **THEN** the catalog list and single-campsite responses return that `coverPhotoId`

#### Scenario: Clear the cover photo

- **WHEN** a signed-in user clears the campsite cover
- **THEN** the campsite has no `coverPhotoId`

#### Scenario: Reject a cover not among visit photos

- **WHEN** a signed-in user sets the cover to an identifier not attached to any of the campsite's visits
- **THEN** the request is rejected with a client error and the cover is unchanged

### Requirement: Cover photo is cleared when its source is removed

When a visit is deleted, or a photo is removed from a visit's list, and the
campsite's `coverPhotoId` referenced that photo, the system SHALL clear the
campsite's `coverPhotoId` in the same operation.

#### Scenario: Deleting the visit that holds the cover photo

- **WHEN** a signed-in user deletes a visit whose photo is the campsite's cover
- **THEN** the campsite is returned with no `coverPhotoId`

#### Scenario: Removing the specific cover photo from a visit

- **WHEN** a signed-in user updates a visit's photo list to drop the identifier currently used as the campsite cover
- **THEN** the campsite's `coverPhotoId` is cleared

### Requirement: Photos are displayed in the catalog and detail views

The campsite detail view SHALL show each visit's photos as a gallery, let a
signed-in user upload (including drag-and-drop), remove, and reorder a visit's
photos, and let them choose any visit photo as the campsite cover. The catalog
card SHALL show the cover photo when set and a neutral placeholder otherwise.
Image URLs SHALL be resolved per photo from the file-url endpoint.

#### Scenario: Upload by drag-and-drop

- **WHEN** a signed-in user drags image files onto a visit's photo area
- **THEN** the images upload and appear in that visit's gallery in drop order

#### Scenario: Choose a cover from the gallery

- **WHEN** a signed-in user picks "set as cover" on a visit photo
- **THEN** the catalog card for that campsite shows that image

#### Scenario: Placeholder when no cover

- **WHEN** a campsite has no cover photo
- **THEN** its catalog card shows a neutral placeholder rather than a broken image
