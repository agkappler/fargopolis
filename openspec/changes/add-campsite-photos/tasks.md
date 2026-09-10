## 1. Files Lambda — accept the new role

- [ ] 1.1 Add `"CAMPSITE_PHOTO"` to `VALID_FILE_ROLES` in `infrastructure/lambdas/files/handler.py` and to the error message listing valid roles.

## 2. Camping Lambda — photo routes

- [ ] 2.1 Implement `POST /api/updateVisitPhotos` in `infrastructure/lambdas/camping/handler.py` — `require_clerk_writer`; body `campsiteId`, `visitId`, `photoIds: string[]`; load campsite (404), find visit (404); set the visit's `photoIds`; recompute `valid = {pid for v in visits for pid in v.photoIds}` and `REMOVE coverPhotoId` when the current cover ∉ `valid`; `update_item` with `ConditionExpression "version = :old"` + `ADD version :one`; 409 on stale; return updated campsite.
- [ ] 2.2 Implement `POST /api/updateCampsiteCover` — `require_clerk_writer`; body `campsiteId`, `coverPhotoId: string | null`; when non-null, reject (400) if it is not in any visit's `photoIds`; `SET` or `REMOVE coverPhotoId`; `version`-guarded; return updated campsite.
- [ ] 2.3 Extend the `deleteVisit` and `updateVisit` handlers (from `add-campsite-visits`) to run the same cover-cleanup recompute in their `update_item`.
- [ ] 2.4 `GET /api/campsite/{campsiteId}` — include each visit's `photoIds` (default `[]`).
- [ ] 2.5 `POST /api/createCampsite` / add-visit — seed `photoIds: []` on new visits; no `coverPhotoId` on new campsites.
- [ ] 2.6 Register `updateVisitPhotos` and `updateCampsiteCover` routes in `infrastructure/lib/constructs/camping-api-routes-construct.ts`.

## 3. Frontend — role + file-url hook

- [ ] 3.1 Add `CampsitePhoto = "CAMPSITE_PHOTO"` to `fargopolis-web/src/constants/FileRole.ts`.
- [ ] 3.2 Add `fargopolis-web/src/components/camping/helpers/useFileUrl.ts` — SWR hook keyed `/fileUrl/${fileId}` calling `RequestManager.get`, returning the presigned URL; revalidate on focus.
- [ ] 3.3 Extend `fargopolis-web/src/models/Visit.ts` with `photoIds: string[]` and `fargopolis-web/src/models/Campsite.ts` with `coverPhotoId?: string`.

## 4. Frontend — uploader + gallery

- [ ] 4.1 Add `fargopolis-web/src/components/camping/PhotoUploader.tsx` — drop zone + file input, client-side max size (~15 MB), `RequestManager.uploadFile(file, FileRole.CampsitePhoto, getToken)` per file, then `POST /api/updateVisitPhotos` with the appended list; re-`mutate`s the campsite key.
- [ ] 4.2 Add `fargopolis-web/src/components/camping/PhotoGallery.tsx` — thumbnails via `useFileUrl`, drag-to-reorder persisted through `updateVisitPhotos`, remove, and "set as cover" via `updateCampsiteCover`; mutations gated on sign-in.
- [ ] 4.3 Mount `PhotoGallery` + `PhotoUploader` per visit in `fargopolis-web/src/components/camping/VisitTimeline.tsx` / `CampsiteDetailPage.tsx`.
- [ ] 4.4 Update `fargopolis-web/src/components/camping/CampsiteCard.tsx` — render cover via `useFileUrl(coverPhotoId)`, neutral placeholder when absent.

## 5. Verification

- [ ] 5.1 `cd fargopolis-web && pnpm build && pnpm lint` clean.
- [ ] 5.2 `cd infrastructure && npx cdk diff FargopolisApi` shows only Lambda + route changes.
- [ ] 5.3 Manual: upload 3 photos to a visit, reorder them, set one as cover (card shows it), remove the cover photo from the visit (card falls back to placeholder, `coverPhotoId` cleared), delete a visit that holds the cover (cover cleared). Confirm a non-visit `coverPhotoId` is rejected and signed-out users can view galleries but not modify them.
- [ ] 5.4 Run `openspec validate add-campsite-photos --strict`.
