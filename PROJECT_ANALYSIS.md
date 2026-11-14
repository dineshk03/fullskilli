# LMS project analysis

Historical review snapshot. Subsequent fixes and remaining deployment work are recorded in [REMEDIATION_STATUS.md](REMEDIATION_STATUS.md).

Reviewed: 27 October 2026. Scope: repository structure, application entry points, selected controllers and models, authentication, checkout, media delivery, deployment configuration, and available automated checks. This is a broad code review, not an exhaustive audit of every implementation or a live penetration test. No application code was changed. Environment secret values were not read or reproduced.

## Architecture and functionality

The application is a JavaScript LMS with a React 18/Vite frontend, Redux Toolkit state, React Router, Tailwind styling, and an Express/Mongoose backend. MongoDB stores users, courses, enrollment, assessments, orders, certificates, messages, and operational data. Socket.IO supports chat; additional WebSocket infrastructure exists. AWS S3 provides object storage, Razorpay handles payments, Nodemailer sends email, and Google/social login and PHP portal SSO provide external identity integration. Zoom meetings, attendance, reminders, and recordings extend course delivery.

The frontend contains 327 JavaScript/JSX source files. The backend has 35 top-level route files, additional nested admin routes, 48 controller files, and 39 models. Features include public catalog and marketing pages; student, instructor, and administrator dashboards; course authoring and playback; quizzes and assignments; reporting; bulk user management; coupons and plan activation; certificates; jobs and applications; chat; and site settings.

The usual request path is React page → service operation → Axios connector → Express route → authentication/role middleware → controller → Mongoose or external service. Frontend role guards help navigation; backend authorization must independently enforce every operation.

## Critical findings

1. **Public registration can create administrators.** `backend/routes/user.js:45` exposes signup publicly. `backend/controllers/auth.js:93` accepts `accountType` from the request and persists it at line 163. `backend/models/user.js` permits `Admin`. There is no server-side restriction to student registration in this path; an email-verified registrant can select a privileged role. Force public registrations to Student and implement privileged account creation through authenticated administrator operations. The approval expression at auth.js:157 also compares an initially empty variable rather than the requested account type.

2. **Students can edit or delete courses.** `backend/routes/course.js:126` and line 165 require authentication but no instructor/admin role. The controller checks at `backend/controllers/course.js:628` and line 851 reject only non-owning Instructors. A Student bypasses that conditional and reaches mutation/deletion. Require an allowed role first, then check ownership for Instructors. Deletion also removes related progress, reviews, certificates, and media, increasing the impact.

3. **Client-controlled discounts bypass payment.** `backend/controllers/payments.js:328` subtracts request `discountAmount` from database prices. At line 332, payment verification runs only when the resulting amount is positive. A student can supply a discount covering the full price, omit Razorpay proof, and reach order creation and enrollment. Calculate discounts exclusively on the server from validated coupon eligibility and usage rules.

## High-priority findings

4. **Payment verification is not bound to a persisted checkout.** The verification path validates an HMAC of client-supplied order/payment identifiers, but does not retrieve a trusted pending order or compare its user, courses, amount, currency, and payment status. There is no visible replay guard in this path; `transactionId` is not unique in the order schema. Persist checkout intent, verify the corresponding payment, and enforce idempotency. One payment may cover several course records, so model uniqueness around the payment/checkout and its course allocations rather than making the existing field globally unique without considering that relationship.

5. **S3 startup can expose all bucket objects.** `backend/server.js:622` disables public-access blocks and line 634 installs a wildcard public-read policy. Line 662 runs bucket configuration unless explicitly disabled. If the runtime IAM identity allows these operations, startup changes infrastructure permissions and makes private course assets accessible directly. Keep protected assets private, provision bucket policies separately, and issue short-lived media URLs after enrollment authorization.

6. **Logs expose credentials and personal data.** `backend/server.js:328` logs all headers, and line 330 logs full bodies, including login passwords, bearer tokens, cookies, OTPs, and SSO data. URL logging can also capture query tokens. Use structured logging with explicit sensitive-field redaction and limited production verbosity. If these logs have been collected, review their access and retention and rotate exposed credentials as appropriate. The IDE context also included a secret-looking selected value; rotate it if it is an active credential.

7. **Video routes authenticate without checking course entitlement.** `backend/routes/videoPlayback.js` retrieves media by identifiers and verifies a JWT, but does not establish enrollment or instructor ownership. Manual token verification on streaming paths also omits the standard inactive-user and revocation checks. Apply a shared media authorization policy to manifests, metadata, and streams, then use private storage.

8. **Quiz responses expose answer material.** `backend/controllers/quiz.js:438` loads a quiz and line 489 returns the document. The schema includes correct answers, answer arrays, keywords, solution code, and hidden test cases without response-level exclusion in this handler. Return a student-specific projection and retain grading material exclusively on the server.

9. **Administrative diagnostics are public.** `backend/server.js:418`, 435, 452, and 469 register database monitoring, connection testing, cache statistics, and cache clearing without auth/role middleware. Their URL prefix does not protect them. Add explicit administrator guards and limit diagnostic output.

10. **Authentication checks fail open.** `backend/middleware/auth.js:83` continues after blacklist errors, and line 118 continues after user-status lookup errors. Authorization subsequently uses the role in the JWT rather than the current database role. Fail closed on unavailable security checks, and resolve current permissions from trusted state. Socket authentication should enforce equivalent revocation and account-status rules.

## Reliability, configuration, and operations

- SSO verification uses hardcoded secret fallbacks (`backend/controllers/auth.js:843`, 1088). Missing deployment configuration therefore enables predictable signing keys. Require secrets at startup and validate intended issuer, audience, and identity binding.
- Login, signup, OTP, and password-reset routes in `backend/routes/user.js` do not attach rate limiters. Coupon validation does. Introduce limits for identity and email operations and consume OTPs atomically with explicit expiration checks; MongoDB TTL cleanup alone is not an exact expiry check.
- Credentialed CORS accepts any origin containing `localhost` or `127.0.0.1` (`backend/server.js:123`), including attacker-controlled names containing those strings. Compare parsed origins against exact environment-specific allowlists.
- Global JSON and URL-encoded body limits are 500 MB (`backend/server.js:289`). This is unnecessarily large for ordinary API requests and creates memory pressure. Keep uploads on dedicated streaming/multipart paths and lower normal request limits.
- Sessions use the default in-memory store, a fallback secret, and `saveUninitialized: true`. This is unsuitable for durable sessions across replicas. Behind a TLS-terminating proxy, verify Express trust-proxy configuration for secure cookies.
- The unauthenticated SSO logout route can ask the PHP portal to clear a session for a supplied PID (`backend/controllers/auth.js:1312`). Authenticate the caller and bind the target PID to the session or a verified integration request.
- Checkout accepts request PID ahead of the authenticated user's PID (`backend/controllers/payments.js:308`). Bind plan usage to the authenticated identity. Order creation, external usage updates, and enrollment updates are separate operations, leaving partial state after failures; use transactions for local writes and explicit retry/compensation for external effects.
- The user schema does not declare a unique normalized email index. Signup's find-then-create check can race. Verify actual database indexes, resolve existing duplicates, and enforce uniqueness at the database boundary.
- Docker Compose publishes MongoDB on the host and has no database authentication configuration. Remove external publication unless needed and configure credentials for deployed environments.
- The backend Dockerfile copies the entire build context; its `.dockerignore` does not exclude `.env` files. Local environment files can enter images. Exclude secrets and inject them at runtime.
- Frontend API configuration is split between `src/services/apis.js` (requires a build-time base URL) and `src/config/api.js` (hostname/port fallback). Nginx returns 404 for `/api` instead of forwarding it. Define one deployment contract, preferably a shared same-origin API base with a working reverse proxy.
- Startup launches scheduled jobs inside the API process. Multiple replicas would run duplicate cleanup/reminder jobs unless distributed coordination or a separate worker is added.

## Maintainability and performance

Useful foundations include route/controller/model separation, centralized Axios behavior, page-level lazy imports, vendor chunking, health reporting, opt-in database seeding, and dedicated certificate tests. Existing full-course access checks also demonstrate enrollment-aware authorization that can be consolidated and reused.

Maintenance costs come from large controllers, duplicated integration/configuration variants (`razorpay.js` and `rajorpay.js`, multiple API base definitions, old payment operations), numerous standalone debug/repair scripts, and significant lint debt. Move administrative scripts into a documented tooling directory, require explicit target environments for mutations, and consolidate implementations after checking their consumers.

Checkout waits for per-course PDF generation and email delivery before responding. Move these to a durable background job after enrollment commits. Add bounded pagination and inspect actual query plans/index usage for reports rather than assuming source-level queries scale. Preserve lazy loading and measure bundle output before selecting optimization targets.

## Validation and limits

- Backend `npm test`: **15 passed, 0 failed**. Tests focus on authentication/role checks and manual certificates, using mocked database operations; passing does not demonstrate secure signup, checkout, course mutation, media authorization, or deployed integrations.
- Frontend `npm run lint`: **passed baseline comparison**, with **1,775 existing findings**. This is not a clean lint result.
- Frontend `npm run build`: **passed** on rerun outside the sandbox after the initial attempt could not start esbuild (`spawn EPERM`). Vite transformed 2,266 modules. The main index chunk is 1,155.51 kB and document vendor chunk is 1,082.92 kB before gzip, triggering the configured 1,000 kB warning. Browser compatibility metadata also reports stale data. Generated output is in `frontend/dist`.
- No live MongoDB, Razorpay, S3, email, PHP portal, Zoom, or browser workflow verification was performed. The backend was not started because startup can mutate S3 configuration and schedule operational jobs.
- No Git repository metadata was available in the project directory, so historical changes and tracked-secret status could not be assessed. No dependency vulnerability claim is made without an advisory audit.

## Recommended order of work

1. Close public role assignment, student course mutation, and discount-based payment bypass; add regression tests for these exact boundaries.
2. Bind payments to durable checkout records, enforce idempotency, and restrict S3/media access and quiz response fields.
3. Protect diagnostics, redact logs, require configuration secrets, and unify HTTP/socket authorization.
4. Fix deployment API routing, secret injection, database exposure, and scheduler ownership.
5. Add integration coverage for signup, checkout/replay, enrollment/media access, assessments, and cross-role operations; then reduce lint debt and consolidate legacy modules incrementally.
