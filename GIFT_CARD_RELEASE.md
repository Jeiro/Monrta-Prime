# Gift-card deposits

Added to Monrta-Prime on local branch `feature/gift-card-deposits`.

Users can select Gift Card in the wallet or Fast deposit popup, enter the requested USD deposit amount and card brand/face value/currency, and attach 1–4 JPG, PNG or WebP images up to 5 MB each. The form preserves its contents after upload or database failures. Retrying reuses completed uploads.

Deposits stay pending until an admin verifies the card and requested USD amount. The admin drawer displays card details and private images, with approve/reject actions that wait for the server. Approval credits the requested USD amount through the existing atomic approval RPC. Rejection does not credit funds. This does not automatically redeem cards or calculate exchange rates.

The user can reopen the submitted card details and private images from transaction history. Images use short-lived signed links and remain in the private `gift-card-proofs` bucket. Owner/admin access is enforced by storage policies; ordinary users cannot approve deposits. Other users cannot read the evidence. The migration restricts updates/deletes of gift-card evidence without changing other buckets.

## Verification

- `npm run lint`, `npm test` (8 passing tests), and `npm run build` passed.
- Tests cover required images, invalid amounts/files, owner-scoped upload paths, upload failures, signed-link failures/expiry/retry, and database policies.
- The isolated Postgres test applies the migration twice and executes the repository's actual deposit approval/rejection RPCs. It checks pending balance, ordinary-user denial, admin access, credit exactly once, rejection without credit, foreign/missing evidence, invalid amounts, immutable uploads, and preservation of crypto records. Its fixtures roll back.
- Real Clerk/Supabase test-account browser checks: private upload, pending submission, admin image display, approval, rejection, exact balance change, and injected upload/review failures.
- Additional browser checks passed for the quick-deposit popup, switching back to crypto, image preview/removal, user receipt images, denied ordinary-user approval and denied public image download.
- Form layout checked at 320, 375, 768 and 1440px. Browser evidence is in the workspace's `verification/monrta-gift-cards/` folder.

The test Supabase migration is present and authenticated uploads/submissions succeeded. Direct SQL connections were reset during this session, so the rollback-only SQL regression suite ran locally using PGlite. This is distinct from the successful browser checks against the actual test services.

Existing limitation: notification insertion returned HTTP 403 / row-level-security denial. Deposit persistence and review succeeded; notification delivery is not verified. Local transactional email is not configured. Build emits the existing large-chunk warning.

Synthetic gift-card deposits and uploaded test images remain in the test project for inspection. No real cards were used. No production database changes, Git push, merge or deployment were performed for this feature.

## Release

1. Review the feature diff. Existing uncommitted withdrawal changes were already present and have been preserved; review those separately when selecting changes for a commit.
2. Before deploying this frontend, run the complete `gift_card_deposits.sql` in the **Monrta production Supabase** SQL Editor. It requires the existing `transactions`, `users`, `is_admin()` and deposit approval/rejection RPCs. Do not use the Orbitrio database for this site.
3. Confirm Vercel production environment variables still point to Monrta's production Clerk/Supabase services. Do not copy local test environment files to production or commit credentials.
4. Merge/deploy the reviewed branch, then check a small authorized submission and admin image review in production.

To roll back the UI, restore the preceding frontend deployment. Keep the additive columns, private bucket and submitted evidence; dropping them would destroy payment records. Approved balances are not automatically reversed by a frontend rollback.
