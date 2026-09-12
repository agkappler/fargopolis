## Context

See `add-campsite-catalog-core` and `add-campsite-visits`. The repo already has
a complete upload path: `RequestManager.uploadFile(file, FileRole, getToken)`
calls `POST /api/files/presignPut` (which writes a `Files` row and returns a
presigned S3 PUT), the client PUTs the bytes, and `GET /api/fileUrl/{fileId}`
returns a presigned GET later. Recipes uses this for a single `avatarFileId`;
DnD's `CHARACTER_RESOURCE` role is the multi-file precedent. Campsite photos are
the multi-file case: an ordered `photoIds` list per visit.

## Goals / Non-Goals

**Goals:**

- Reuse the existing presign/upload/file-url flow unchanged — only a new
  `FileRole` value is required.
- Photos belong to visits (that is when pictures are taken); a campsite cover is
  a pointer to one of them.
- Keep `coverPhotoId` referentially sane: reject covers that aren't visit
  photos, and clear the cover when its photo disappears.

**Non-Goals:**

- Campsite-level photos not tied to a visit. A campsite with zero visits has no
  photos and no cover; acceptable because the catalog is "places we have
  camped".
- Server-side image processing (resize, thumbnail, EXIF strip). The browser
  renders the presigned original; revisit only if payloads get painful.
- Garbage-collecting orphaned S3 objects / `Files` rows on photo or visit
  removal — no vertical in the repo does this today.

## Decisions

### New `FileRole` value only

Frontend `src/constants/FileRole.ts` gains `CampsitePhoto = "CAMPSITE_PHOTO"`.
`infrastructure/lambdas/files/handler.py` `VALID_FILE_ROLES` frozenset gains
`"CAMPSITE_PHOTO"`. Nothing else in the files Lambda changes; it already grants
itself the uploads bucket and keys objects as `{uuId}_{filename}`.

### `photoIds` on the visit; `coverPhotoId` on the campsite

Visit shape gains `photoIds: string[]` (ordered, default `[]`). Campsite item
gains optional `coverPhotoId: string`. `coverPhotoId` is already in the
`CampsitesByNameIndex` projection (forward-declared in the core change), so the
catalog card gets it for free.

### Routes

| Method + path | Body | Effect |
| --- | --- | --- |
| `POST /api/updateVisitPhotos` | `campsiteId`, `visitId`, `photoIds: string[]` | replace that visit's `photoIds`; if `coverPhotoId ∉ union(all visit photoIds after change)`, `REMOVE coverPhotoId`; bump `version` |
| `POST /api/updateCampsiteCover` | `campsiteId`, `coverPhotoId: string \| null` | set `coverPhotoId` (must be in some visit's `photoIds`) or `REMOVE` it; bump `version` |

Both are `require_clerk_writer` and use the same
`ConditionExpression "version = :old"` + `ADD version :one` as the visit routes
in `add-campsite-visits`. `updateVisitPhotos` is a visit-list mutation so it
must be version-guarded; `updateCampsiteCover` touches only a scalar but takes
the guard too for uniformity.

### Cover cleanup is a handler responsibility on three paths

`coverPhotoId` can be invalidated by: `deleteVisit`, `updateVisit` (if it ever
drops photos — it won't in practice, but the handler recomputes anyway), and
`updateVisitPhotos`. Each of these, after computing the new visit list,
recomputes `valid = set(pid for v in visits for pid in v.photoIds)` and issues
`REMOVE coverPhotoId` in the same `update_item` when the current cover is not in
`valid`. This keeps the invariant "cover is always a real visit photo or absent"
enforced server-side regardless of client behavior. `add-campsite-visits`'s
`deleteVisit` task is extended here to include this cleanup.

### Image display

Per photo, the client calls `GET /api/fileUrl/{fileId}` to get a ~15-minute
presigned URL and renders it in an `<img>`. A small `useFileUrl(fileId)` SWR
hook (keyed `/fileUrl/${fileId}`) caches within a session and is reused by the
gallery, the cover picker, and `CampsiteCard`. Presigned-URL expiry is handled
by SWR revalidation on focus.

Alternative considered: have the camping Lambda resolve and inline photo URLs in
`GET /api/campsite/{id}`. Rejected — it would couple the camping Lambda to the
uploads bucket and duplicate the files Lambda's job; the per-id endpoint already
exists.

### Frontend components

- `src/components/camping/PhotoUploader.tsx` — drop zone + file picker; for each
  file calls `RequestManager.uploadFile(file, FileRole.CampsitePhoto, getToken)`,
  collects the returned `fileId`s, then `POST /api/updateVisitPhotos` with the
  concatenated list; re-`mutate`s the campsite SWR key.
- `src/components/camping/PhotoGallery.tsx` — thumbnails for a visit's
  `photoIds`, drag-to-reorder (persists via `updateVisitPhotos`), remove, and
  "set as cover" (`updateCampsiteCover`). Reorder/remove are sign-in gated.
- `CampsiteCard.tsx` — render the cover via `useFileUrl(coverPhotoId)`, neutral
  placeholder when absent.
- `CampsiteDetailPage.tsx` / `VisitTimeline.tsx` — mount `PhotoGallery` +
  `PhotoUploader` per visit.

## Risks / Trade-offs

- **Orphaned S3 objects / `Files` rows** on photo or visit removal → Known,
  matches every other vertical; storage cost is negligible at personal scale. A
  later sweep job can reconcile `Files` against referenced ids.
- **Presigned GET URLs in the DOM expire (~15 min)** → SWR revalidation on
  focus/reconnect re-fetches; a stale tab shows a broken thumbnail until
  interaction. Acceptable; could raise the expiry in the files Lambda later.
- **`coverPhotoId` race**: cover set concurrently with a visit-photo removal →
  The `version` guard on both routes forces one to retry; the loser re-reads and
  the cleanup rule still holds on the winner.
- **No image size limit enforced** → `presignPut` already records `sizeBytes`;
  add a client-side max (e.g. 15 MB) in `PhotoUploader` and reject before
  upload.

## Migration Plan

1. Deploy `FargopolisApi` — files Lambda accepts the new role; camping Lambda
   gains two routes and the cover-cleanup branch. Additive; existing data
   unaffected (`photoIds` defaults to `[]`, `coverPhotoId` stays absent).
2. Deploy `FargopolisFrontend` with the uploader/gallery.
3. Rollback: redeploy previous revisions. Any `photoIds` / `coverPhotoId`
   already written remain on items and are simply not rendered by the old
   frontend; the old files Lambda rejects new `CAMPSITE_PHOTO` uploads.
