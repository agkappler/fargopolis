## Why

Photos are the point of a camping catalog. `add-campsite-visits` records when
and with whom; this change lets each visit carry an ordered set of pictures and
lets a campsite pick one as its cover image for the catalog.

## What Changes

- Add `CAMPSITE_PHOTO` to the `FileRole` enum (frontend) and to the accepted
  roles in the files Lambda, so campsite images upload through the existing
  presigned-PUT flow.
- Add an ordered `photoIds` list to each visit and an optional `coverPhotoId`
  to each campsite (`coverPhotoId` must reference one of that campsite's visit
  photos).
- New `camping` Lambda routes: `POST /api/updateVisitPhotos` (set a visit's
  ordered `photoIds`, `version`-guarded) and `POST /api/updateCampsiteCover`
  (set or clear `coverPhotoId`).
- Deleting a visit (from `add-campsite-visits`) SHALL also clear the campsite's
  `coverPhotoId` when it pointed at one of that visit's photos.
- `GET /api/campsite/{id}` returns each visit's `photoIds`; `GET /api/campsites`
  already carries `coverPhotoId` (projected since the core change).
- Frontend: a drag-and-drop photo uploader and reorderable gallery on each visit
  in `CampsiteDetailPage`, a "set as cover" action, and a cover thumbnail on
  `CampsiteCard`. Image URLs are resolved per photo via the existing
  `GET /api/fileUrl/{fileId}` endpoint.

## Capabilities

### New Capabilities

- `campsite-photos`: attaching ordered photos to a campsite visit, choosing a
  campsite cover image, and displaying both in the catalog and detail views.

### Modified Capabilities

<!-- None. Visit and catalog behavior is extended additively by the new
     `campsite-photos` capability; the cover-cleanup-on-visit-delete rule is a
     new obligation stated in this capability's spec. -->

## Impact

- **Depends on `add-campsite-catalog-core`** (files upload flow, `coverPhotoId`
  already in the GSI projection) **and `add-campsite-visits`** (visit list,
  `version` guard, visit delete path).
- **Infra**: edits `infrastructure/lambdas/files/handler.py`
  (`VALID_FILE_ROLES`) and `infrastructure/lambdas/camping/handler.py`
  (two routes + visit-delete cover cleanup); routes registered in
  `camping-api-routes-construct.ts`. No table, GSI, or S3/IAM change — the files
  Lambda already owns the uploads bucket.
- **Frontend**: adds `CAMPSITE_PHOTO` to `src/constants/FileRole.ts`; adds
  `src/components/camping/PhotoUploader.tsx` and `PhotoGallery.tsx`; edits
  `VisitForm`/`VisitTimeline`, `CampsiteCard`, `CampsiteDetailPage`, and the
  `Campsite`/`Visit` models.
- **No new dependencies.**
- Known limitation: removing a photo or visit does not delete the S3 object or
  its `Files` row (no vertical in the repo cascades S3 deletes today).
