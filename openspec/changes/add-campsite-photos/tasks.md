## 1. Files Lambda — accept the new role

- [x] 1.1 Add `"CAMPSITE_PHOTO"` to `VALID_FILE_ROLES` in `infrastructure/lambdas/files/handler.py` and to the error message listing valid roles.

## 2. Camping Lambda — photo routes

- [x] 2.1 Implement `POST /api/updateVisitPhotos` in `infrastructure/lambdas/camping/handler.py` — `require_clerk_writer`; body `campsiteId`, `visitId`, `photoIds: string[]`; load campsite (404), find visit (404); set the visit's `photoIds`; recompute `valid = {pid for v in visits for pid in v.photoIds}` and `REMOVE coverPhotoId` when the current cover ∉ `valid`; `update_item` with `ConditionExpression "version = :old"` + `ADD version :one`; 409 on stale; return updated campsite.
- [x] 2.2 Implement `POST /api/updateCampsiteCover` — `require_clerk_writer`; body `campsiteId`, `coverPhotoId: string | null`; when non-null, reject (400) if it is not in any visit's `photoIds`; `SET` or `REMOVE coverPhotoId`; `version`-guarded; return updated campsite.
- [x] 2.3 Extend the `deleteVisit` and `updateVisit` handlers (from `add-campsite-visits`) to run the same cover-cleanup recompute in their `update_item`. (Generalized the shared `_write_visits` helper — used by `addVisit`/`updateVisit`/`deleteVisit`/`updateVisitPhotos` — to always recompute and clear a dangling `coverPhotoId`.)
- [x] 2.4 `GET /api/campsite/{campsiteId}` — include each visit's `photoIds` (default `[]`).
- [x] 2.5 `POST /api/createCampsite` / add-visit — seed `photoIds: []` on new visits; no `coverPhotoId` on new campsites.
- [x] 2.6 Register `updateVisitPhotos` and `updateCampsiteCover` routes in `infrastructure/lib/constructs/camping-api-routes-construct.ts`.

## 3. Frontend — role + file-url hook

- [x] 3.1 Add `CampsitePhoto = "CAMPSITE_PHOTO"` to `fargopolis-web/src/constants/FileRole.ts`.
- [x] 3.2 Add `fargopolis-web/src/components/camping/helpers/useFileUrl.ts` — SWR hook keyed `/fileUrl/${fileId}` calling `RequestManager.get`, returning the presigned URL; revalidate on focus.
- [x] 3.3 Extend `fargopolis-web/src/models/Visit.ts` with `photoIds: string[]` and `fargopolis-web/src/models/Campsite.ts` with `coverPhotoId?: string`. (`Campsite.coverPhotoId` was already `string | null` optional from the core change.)

## 4. Frontend — uploader + gallery

- [x] 4.1 Add `fargopolis-web/src/components/camping/PhotoUploader.tsx` — drop zone + file input, client-side max size (~15 MB), `RequestManager.uploadFile(file, FileRole.CampsitePhoto, getToken)` per file, then `POST /api/updateVisitPhotos` with the appended list; re-`mutate`s the campsite key.
- [x] 4.2 Add `fargopolis-web/src/components/camping/PhotoGallery.tsx` — thumbnails via `useFileUrl`, drag-to-reorder persisted through `updateVisitPhotos`, remove, and "set as cover" via `updateCampsiteCover`; mutations gated on sign-in.
- [x] 4.3 Mount `PhotoGallery` + `PhotoUploader` per visit in `fargopolis-web/src/components/camping/VisitTimeline.tsx` / `CampsiteDetailPage.tsx`.
- [x] 4.4 Update `fargopolis-web/src/components/camping/CampsiteCard.tsx` — render cover via `useFileUrl(coverPhotoId)`, neutral placeholder when absent.

## 5. Verification

- [x] 5.1 `cd fargopolis-web && pnpm build && pnpm lint` clean. (`pnpm build` clean; `pnpm lint` has 5 pre-existing errors in unrelated `dnd` files, none in changed files.)
- [ ] 5.2 Manual: upload 3 photos to a visit, reorder them, set one as cover (card shows it), remove the cover photo from the visit (card falls back to placeholder, `coverPhotoId` cleared), delete a visit that holds the cover (cover cleared). Confirm a non-visit `coverPhotoId` is rejected and signed-out users can view galleries but not modify them. (Verified the read/render path with a Playwright smoke test against mocked API responses — the cover photo and neutral placeholder both render correctly on `CampsiteCard`, all photo thumbnails render in the visit gallery, no console errors, and upload/cover/remove controls are correctly hidden while signed out. The live write path — upload, reorder, set/clear cover, and the reject-invalid-cover / delete-clears-cover rules — needs manual confirmation since it requires a signed-in Clerk session and touches real data.)
- [x] 5.3 Run `openspec validate add-campsite-photos --strict`. (`Change 'add-campsite-photos' is valid`.)
