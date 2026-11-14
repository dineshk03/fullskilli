# Development checks and deployment notes

## Checks

- `cd backend && npm test` runs authentication, authorization, checkout-pricing, media-range, quiz-response, and certificate regression tests without a database.
- `cd backend && npm run check:syntax` checks every backend JavaScript file without executing application or maintenance scripts.
- `cd frontend && npm test` runs component rendering and matching-option tests.
- `cd frontend && npm run build` verifies the production bundle.
- `cd frontend && npm run lint` and `npm run lint:strict` both require zero ESLint errors and warnings.
- With the production preview running on `127.0.0.1:4173`, `cd frontend && npm run test:browser` opens headless Chrome, checks four public pages, and blocks external integrations. Install Chrome or adjust the browser channel for another supported browser.

The former lint baseline has been emptied. Do not add findings to it to bypass strict lint.

The category icon registry is generated from the picker list. After changing that list, run `cd frontend && npm run icons:generate` and commit the generated registry.

## Deployment

See [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) for server setup and Docker
Compose commands.

Use Node 22.12 or later in the Node 22 line, or a compatible supported even-numbered release. Dockerfiles use Node 22. The Compose configuration starts without seeding; use `npm run seed` only for a fresh intended database. Backend settings are injected from `backend/.env` at runtime and excluded from Docker build contexts. `JWT_SECRET` is required. Configure `SSO_SECRET` to enable portal login; there is no hardcoded fallback. `SESSION_SECRET` is optional and otherwise derived from the JWT secret with a separate purpose label. Sessions persist in MongoDB.

The frontend uses a shared same-origin API fallback, and Nginx proxies `/api` and Socket.IO to the backend. Frontend OAuth client identifiers and portal URLs are public build arguments; pass them through the Compose environment as needed. They are distinct from backend secrets.

Set `VITE_LARAVEL_BASE_URL` or `VITE_PHP_SITE_URL` for the PHP integration and `VITE_PLAN_API_BASE_URL` for the external plan API. Set backend `PLAN_API_BASE_URL` to the corresponding trusted plan-service endpoint. Hardcoded private-LAN defaults have been removed; optional integrations report a configuration error or remain disabled until their URLs are supplied. Never put private service secrets in `VITE_` variables.

Course checkout checks purchased plans through the authenticated LMS `/api/v1/payment/plans` endpoint. Configure backend `PLAN_API_BASE_URL` (for example `https://skilli.jobs/api/users`), `PLAN_API_USERNAME`, and `PLAN_API_PASSWORD` to match the PHP plan API. Credentials stay on the backend. Eligible active plans with remaining course credits are offered before payment; enrollment validates the linked user's plan again and updates only that plan's course usage. Plan lookup failures block payment until the user retries, to avoid charging someone whose plan could cover the course.

Set `TRUST_PROXY=true` only when a trusted proxy supplies forwarding headers. Set `RUN_SCHEDULERS=true` on exactly one scheduler instance to enable reminders and recycle-bin cleanup. Other API replicas should leave it disabled.

Compose's unauthenticated MongoDB service is enabled only with the `local-db`
profile for disposable development data. Production deployments must configure
an authenticated MongoDB connection in `deploy.env`; see
[DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md). Docker was unavailable in the
review environment, so container builds were not executed.

Server startup never changes S3 permissions. Provision protected media as private in storage infrastructure; changing source does not revoke an existing public bucket policy. Confirm public images still use a deliberate public asset location before restricting the shared bucket. Media endpoints check current enrollment and suspension state, stream with validated byte ranges, and issue short-lived URLs for authorized metadata requests.

Before deploying email normalization to an existing database, run `node scripts/auditUserEmails.js` in the backend to count conflicting addresses without printing them. Resolve duplicates manually, back up the database, then use `--apply` to normalize email addresses and enforce the unique index. This migration was not run against live data.

Paid checkout verification now requires a checkout created by the updated backend. Drain in-flight old checkout sessions before switching versions, or have users recreate unpaid checkouts. A claimed checkout that fails mid-enrollment is marked `review` to prevent replay; reconcile it against gateway payment state and local enrollment before retrying. Local database and external plan usage changes are not one distributed transaction.

Invoice/PDF emails are stored in `enrollmentemailjobs` and delivered by a background worker that claims jobs atomically across replicas. Set `RUN_EMAIL_WORKER=false` only on instances that should not deliver email. Failed jobs retry with backoff, stop after five attempts, and retain `failed` status for operator review. Delivery is at least once across crashes; verify SMTP behavior in staging.

## Manual certificates

Open **Admin → Certificates** (or `/admin?tab=certificates`) to start in the searchable certificate library. **Create certificate** opens three steps: certificate details and design, recipients, then review and issue. The form has a live design preview. College collaboration supports saved organization details, logos, signatories, and signatures.

Enter one name, paste names one per line, or upload a CSV/XLSX/XLS list. A spreadsheet may contain a `Name` column, `First Name` and `Last Name` columns, or names in its first column. Up to 100 certificates can be issued at a time. Repeated names are flagged for review and removed only when the administrator chooses to remove them. Check spelling in the review step before issuing permanent records.

The library supports search, date/design filters, sorting, and selection across pages (up to 100 records). Download or print selected certificates as one PDF, export details as CSV, or use a record's actions to copy its verification link and download its original batch. After issuance, the success banner provides the latest batch download. Preview dialogs fit mobile screens and support keyboard navigation and Escape to close. Mobile records use cards instead of a wide table.

`node scripts/certificate-browser.cjs` in the frontend tests the compiled admin flow and actual PDF downloads using mocked API data, and writes sample screenshots/PDFs to `certificate-preview`. Start the production preview on port 4173 first. Test recipients and certificates are fixtures; this check never issues records in a live database.

New manual and course certificates share the `BA-YYAA0000` ID format. IDs issued before this change retain their original format and remain valid for verification.
