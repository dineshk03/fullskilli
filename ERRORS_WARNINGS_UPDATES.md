# Errors, warnings, and update inventory

Historical inventory from before remediation. See [REMEDIATION_STATUS.md](REMEDIATION_STATUS.md) for the current state.

Review date: 27 October 2026. This inventory combines strict frontend ESLint output, the completed production build and backend tests from the project review, and fresh npm registry audit/outdated results. It does not claim to identify every runtime error. No dependencies or application code were changed.

## Check results

- Strict frontend ESLint: 1683 errors and 92 warnings. Includes 1 parsing error.
- Baseline lint passes because these findings are already accepted in its baseline.
- Production build passed; that does not validate files outside the imported module graph.
- Backend tests: 15 passed; limited to authentication/roles and manual certificate behavior.
- Build warnings: main index 1,155.51 kB and document vendor 1,082.92 kB exceed the 1,000 kB chunk limit; browser compatibility datasets are stale. Sizes are before gzip.
- Backend has no configured lint command. Live database, external services, and browser workflows were not exercised.

## Fix order

1. Fix the critical authorization and payment defects in [PROJECT_ANALYSIS.md](PROJECT_ANALYSIS.md): public Admin signup, Student course edit/delete, and request-controlled checkout discounts.
2. Fix the JSX parser error, conditional Hooks, checkout typo, analytics fallback, and unsafe course-details destructuring listed below. Add tests for behavior at these boundaries.
3. Resolve critical/high dependency findings, first through compatible updates, then through targeted migrations. Reaudit after each group; wanted versions are not guaranteed to resolve every advisory.
4. Protect media and diagnostics, remove answer material from student quiz responses, redact credentials from logs, require secrets, and correct deployment configuration as detailed in the project analysis.
5. Work through Hook dependency warnings and remaining lint debt, then bundle optimization and optional framework modernization.

## Specific code updates

- `frontend/src/components/core/PlanStatusCard.jsx:170`: malformed JSX expression has an unmatched opening parenthesis. Fix the expression before using this component. The production build passed despite strict lint finding this file.
- `frontend/src/pages/BundleCheckout.jsx:108`: replace the undefined `navigadte` reference with the intended navigation function.
- `frontend/src/pages/Admin/components/EnhancedAnalytics.jsx:156`: define a valid fallback or show an error state; `mockAnalytics` is undefined in the API failure path.
- `frontend/src/pages/CourseDetails.jsx:169`: guard the data before destructuring, or supply an appropriate fallback, because optional chaining may produce undefined.
- Conditional Hook calls: move Hooks before early returns and put conditions inside effects where appropriate; preserve cleanup and stable ordering.
- `process` warnings: Vite browser code should use `import.meta.env`; guarded legacy fallbacks need review rather than blind replacement. An unguarded `process` reference can fail in browsers.
- `frontend/public/facebook-sdk.js`: check SDK readiness and use an explicit `window.FB` reference or declare the SDK global accurately. A lint global warning alone does not prove the SDK is missing.

## Lint counts by rule

| Rule | Count |
|---|---:|
| react/prop-types | 1062 |
| no-unused-vars | 486 |
| react/no-unescaped-entities | 96 |
| react-hooks/exhaustive-deps | 90 |
| react-hooks/rules-of-hooks | 14 |
| no-undef | 10 |
| no-extra-semi | 4 |
| no-useless-catch | 3 |
| react/no-unknown-property | 2 |
| react-refresh/only-export-components | 2 |
| no-useless-escape | 2 |
| Parsing error | 1 |
| no-prototype-builtins | 1 |
| no-unsafe-optional-chaining | 1 |
| react/display-name | 1 |

## Dependency audits and available updates

Audits describe dependency-tree advisories, not demonstrated exploitation. Build/development tools may also appear. Counts across package trees must not be added as unique vulnerabilities. `wanted` is the registry version allowed by the current manifest; `latest` may require breaking changes. Root current versions may be absent because that package tree is not installed locally. Raw JSON files retain advisory URLs, affected ranges, dependency paths, and fix suggestions.

### backend

Audit counts: {"info":0,"low":1,"moderate":26,"high":32,"critical":4,"total":63}.

| Affected package | Severity | Direct | npm fix suggestion |
|---|---|---|---|
| fast-xml-parser | critical | no | available |
| handlebars | critical | no | available |
| proxy-addr | critical | no | available |
| tar | critical | no | bcrypt@6.0.0 (migration/review required) |
| @mapbox/node-pre-gyp | high | no | bcrypt@6.0.0 (migration/review required) |
| axios | high | yes | available |
| bcrypt | high | yes | bcrypt@6.0.0 (migration/review required) |
| body-parser | high | no | available |
| brace-expansion | high | no | available |
| cheerio | high | no | available |
| css-select | high | no | available |
| engine.io | high | no | available |
| express | high | yes | available |
| extract-css | high | no | available |
| extract-zip | high | no | html-pdf-node@1.0.7 (migration/review required) |
| form-data | high | no | available |
| html-pdf-node | high | yes | html-pdf-node@1.0.7 (migration/review required) |
| inline-css | high | no | available |
| ip-address | high | no | available |
| jws | high | no | available |
| list-stylesheets | high | no | available |
| lodash.pick | high | no | available |
| minimatch | high | no | available |
| mongoose | high | yes | available |
| multer | high | yes | available |
| node-fetch | high | no | html-pdf-node@1.0.7 (migration/review required) |
| nodemailer | high | yes | nodemailer@10.2.1 (migration/review required) |
| nth-check | high | no | available |
| path-to-regexp | high | no | available |
| picomatch | high | no | available |
| puppeteer | high | no | html-pdf-node@1.0.7 (migration/review required) |
| sharp | high | yes | sharp@0.35.5 (migration/review required) |
| socket.io-parser | high | no | available |
| style-data | high | no | available |
| tar-fs | high | no | html-pdf-node@1.0.7 (migration/review required) |
| ws | high | no | html-pdf-node@1.0.7 (migration/review required) |
| @aws-sdk/client-s3 | moderate | yes | available |
| @aws-sdk/client-sso | moderate | no | available |
| @aws-sdk/core | moderate | no | available |
| @aws-sdk/credential-provider-env | moderate | no | available |
| @aws-sdk/credential-provider-http | moderate | no | available |
| @aws-sdk/credential-provider-ini | moderate | no | available |
| @aws-sdk/credential-provider-node | moderate | no | available |
| @aws-sdk/credential-provider-process | moderate | no | available |
| @aws-sdk/credential-provider-sso | moderate | no | available |
| @aws-sdk/credential-provider-web-identity | moderate | no | available |
| @aws-sdk/middleware-flexible-checksums | moderate | no | available |
| @aws-sdk/middleware-sdk-s3 | moderate | no | available |
| @aws-sdk/middleware-user-agent | moderate | no | available |
| @aws-sdk/nested-clients | moderate | no | available |
| @aws-sdk/s3-request-presigner | moderate | yes | available |
| @aws-sdk/signature-v4-multi-region | moderate | no | available |
| @aws-sdk/token-providers | moderate | no | available |
| @aws-sdk/util-user-agent-node | moderate | no | available |
| @smithy/middleware-retry | moderate | no | available |
| follow-redirects | moderate | no | available |
| moment | moderate | yes | available |
| node-cron | moderate | yes | node-cron@4.6.0 (migration/review required) |
| qs | moderate | no | available |
| socket.io-adapter | moderate | no | available |
| socks | moderate | no | available |
| uuid | moderate | no | node-cron@4.6.0 (migration/review required) |
| @smithy/config-resolver | low | no | available |

| Package | Installed | Wanted | Latest |
|---|---|---|---|
| @aws-sdk/client-s3 | 3.857.0 | 3.1157.0 | 3.1157.0 |
| @aws-sdk/lib-storage | 3.857.0 | 3.1157.0 | 3.1157.0 |
| @aws-sdk/s3-request-presigner | 3.857.0 | 3.1157.0 | 3.1157.0 |
| axios | 1.13.2 | 1.20.0 | 1.20.0 |
| bcrypt | 5.1.1 | 5.1.1 | 6.0.0 |
| cors | 2.8.5 | 2.8.6 | 2.8.6 |
| crypto-random-string | 5.0.0 | 5.0.0 | 6.0.0 |
| dotenv | 16.6.1 | 16.6.1 | 18.0.9 |
| express | 4.21.2 | 4.22.3 | 5.3.0 |
| express-rate-limit | 7.5.1 | 7.5.1 | 8.7.1 |
| express-session | 1.18.2 | 1.19.0 | 1.19.0 |
| google-auth-library | 10.4.0 | 10.9.1 | 11.3.1 |
| jsonwebtoken | 9.0.2 | 9.0.3 | 9.0.3 |
| moment | 2.30.1 | 2.31.0 | 2.31.0 |
| mongoose | 7.8.7 | 7.8.13 | 9.11.4 |
| multer | 2.0.2 | 2.5.0 | 2.5.0 |
| node-cron | 3.0.3 | 3.0.3 | 4.6.0 |
| node-fetch | 2.7.0 | 2.7.0 | 3.3.2 |
| node-schedule | 2.1.1 | 2.1.2 | 2.1.2 |
| nodemailer | 6.10.1 | 6.10.1 | 10.2.1 |
| nodemon | 3.1.10 | 3.1.14 | 3.1.14 |
| pdfkit | 0.17.1 | 0.17.2 | 0.20.2 |
| razorpay | 2.9.6 | 2.9.8 | 2.9.8 |
| sharp | 0.34.2 | 0.34.5 | 0.35.5 |
| socket.io | 4.8.1 | 4.8.4 | 4.8.4 |

Raw reports: [audit](dependency-audit-backend.json), [updates](dependency-outdated-backend.json).

### frontend

Audit counts: {"info":0,"low":1,"moderate":11,"high":23,"critical":4,"total":39}.

| Affected package | Severity | Direct | npm fix suggestion |
|---|---|---|---|
| jspdf | critical | yes | jspdf@4.2.1 (migration/review required) |
| jspdf-autotable | critical | yes | available |
| shell-quote | critical | no | available |
| swiper | critical | yes | swiper@14.3.0 (migration/review required) |
| @remix-run/router | high | no | available |
| axios | high | yes | available |
| brace-expansion | high | no | available |
| browserslist | high | no | available |
| dompurify | high | no | available |
| engine.io | high | no | available |
| flatted | high | no | available |
| form-data | high | no | available |
| glob | high | no | available |
| js-yaml | high | no | available |
| lodash | high | no | available |
| minimatch | high | no | available |
| nanoid | high | no | available |
| picomatch | high | no | available |
| postcss | high | no | available |
| react-router | high | no | available |
| react-router-dom | high | yes | available |
| rollup | high | no | available |
| socket.io-parser | high | no | available |
| source-map-js | high | no | available |
| vite | high | yes | vite@8.3.5 (migration/review required) |
| ws | high | no | available |
| xlsx | high | yes | no automatic fix |
| ajv | moderate | no | available |
| baseline-browser-mapping | moderate | yes | available |
| engine.io-client | moderate | no | available |
| esbuild | moderate | no | vite@8.3.5 (migration/review required) |
| fflate | moderate | no | available |
| follow-redirects | moderate | no | available |
| mdast-util-to-hast | moderate | no | available |
| postcss-selector-parser | moderate | no | available |
| socket.io-adapter | moderate | no | available |
| uuid | moderate | yes | available |
| yaml | moderate | no | available |
| @babel/core | low | no | available |

| Package | Installed | Wanted | Latest |
|---|---|---|---|
| @fortawesome/free-solid-svg-icons | 6.7.2 | 6.7.2 | 7.3.1 |
| @fortawesome/react-fontawesome | 0.2.6 | 0.2.6 | 3.5.0 |
| @headlessui/react | 2.2.9 | 2.2.10 | 2.2.10 |
| @react-oauth/google | 0.12.2 | 0.12.2 | 0.13.5 |
| @reduxjs/toolkit | 1.9.7 | 1.9.7 | 2.13.0 |
| @supabase/supabase-js | 2.58.0 | 2.118.0 | 2.118.0 |
| @types/react | 18.3.24 | 18.3.31 | 19.3.0 |
| @types/react-dom | 18.3.7 | 18.3.7 | 19.3.0 |
| @vitejs/plugin-react | 4.7.0 | 4.7.0 | 6.1.2 |
| autoprefixer | 10.4.21 | 10.6.2 | 10.6.2 |
| axios | 1.12.2 | 1.20.0 | 1.20.0 |
| baseline-browser-mapping | 2.8.31 | 2.11.33 | 2.11.33 |
| canvas-confetti | 1.9.3 | 1.9.4 | 1.9.4 |
| chart.js | 4.5.0 | 4.6.1 | 4.6.1 |
| concurrently | 8.2.2 | 8.2.2 | 10.0.6 |
| copy-to-clipboard | 3.3.3 | 3.3.3 | 4.0.2 |
| eslint | 8.57.1 | 8.57.1 | 10.13.0 |
| eslint-plugin-react-hooks | 4.6.2 | 4.6.2 | 7.1.1 |
| eslint-plugin-react-refresh | 0.4.22 | 0.4.26 | 0.5.7 |
| framer-motion | 10.18.0 | 10.18.0 | 14.6.0 |
| jquery | 3.7.1 | 3.7.1 | 4.0.0 |
| jspdf | 3.0.3 | 3.0.4 | 4.2.1 |
| jspdf-autotable | 5.0.2 | 5.0.9 | 5.0.9 |
| razorpay | 2.9.6 | 2.9.8 | 2.9.8 |
| react | 18.3.1 | 18.3.1 | 19.3.1 |
| react-chartjs-2 | 5.3.0 | 5.3.1 | 5.3.1 |
| react-datepicker | 8.7.0 | 8.10.0 | 9.1.0 |
| react-dom | 18.3.1 | 18.3.1 | 19.3.1 |
| react-dropzone | 14.3.8 | 14.4.1 | 20.1.4 |
| react-hook-form | 7.63.0 | 7.91.0 | 7.91.0 |
| react-hot-toast | 2.6.0 | 2.6.1 | 2.6.1 |
| react-icons | 4.12.0 | 4.12.0 | 5.7.0 |
| react-linkedin-login-oauth2 | 2.0.1 | 2.1.0 | 3.0.0 |
| react-markdown | 9.1.0 | 9.1.0 | 10.1.0 |
| react-redux | 8.1.3 | 8.1.3 | 9.3.0 |
| react-router-dom | 6.30.1 | 6.30.6 | 7.18.4 |
| react-super-responsive-table | 5.2.3 | 5.2.3 | 6.0.2 |
| react-to-print | 3.1.1 | 3.3.0 | 3.3.0 |
| react-xarrows | 2.0.2 | 2.2.1 | 2.2.1 |
| recharts | 3.4.1 | 3.10.1 | 3.10.1 |
| socket.io | 4.8.1 | 4.8.4 | 4.8.4 |
| socket.io-client | 4.8.1 | 4.8.4 | 4.8.4 |
| swiper | 11.2.10 | 11.2.10 | 14.3.0 |
| tailwind-scrollbar | 3.1.0 | 3.1.0 | 4.0.2 |
| tailwindcss | 3.4.17 | 3.4.19 | 4.3.3 |
| uuid | 11.1.0 | 11.1.1 | 14.0.3 |
| video-react | 0.16.0 | 0.16.1 | 0.16.1 |
| vite | 4.5.14 | 4.5.14 | 8.3.5 |

Raw reports: [audit](dependency-audit-frontend.json), [updates](dependency-outdated-frontend.json).

### root

Audit counts: {"info":0,"low":0,"moderate":1,"high":4,"critical":1,"total":6}.

| Affected package | Severity | Direct | npm fix suggestion |
|---|---|---|---|
| proxy-addr | critical | no | available |
| body-parser | high | no | available |
| mongoose | high | yes | available |
| path-to-regexp | high | no | available |
| xlsx | high | yes | no automatic fix |
| qs | moderate | no | available |

| Package | Installed | Wanted | Latest |
|---|---|---|---|
| dotenv | not installed | 17.4.2 | 18.0.9 |
| express-rate-limit | not installed | 7.5.1 | 8.7.1 |
| mongoose | not installed | 8.24.7 | 9.11.4 |
| xlsx | not installed | 0.18.5 | 0.18.5 |

Raw reports: [audit](dependency-audit-root.json), [updates](dependency-outdated-root.json).

## Update approach

- Update compatible backend packages such as Axios, Express within v4, Mongoose within v7, Multer, AWS SDK packages together, JWT, and Socket.IO; validate actual advisory resolution afterward.
- Update compatible frontend packages such as Axios, React Router within v6, jspdf-autotable, and browser compatibility metadata. Coordinate client/server Socket.IO versions.
- Plan targeted migrations for jsPDF, Swiper, Vite and its React plugin, bcrypt, Nodemailer, and other packages whose fixes require manifest changes. Review Node engine and peer dependency requirements before choosing versions.
- `xlsx`: npm reports no automatic fix; evaluate an upstream-supported distribution or a maintained replacement and test spreadsheet import/export compatibility.
- `html-pdf-node`: npm suggests a different dependency version rather than a straightforward upgrade. Inspect the browser/PDF dependency tree and evaluate replacing the PDF renderer; do not apply this suggestion blindly.
- React/React DOM 19, Redux Toolkit 2/React Redux 9, Tailwind 4, Express 5, and Mongoose 9 are separate modernization projects. Latest does not mean required for every package.
- Dockerfiles currently select Node 18 while the review host runs Node 22.18.0. Align deployment and development runtimes with a supported Node release compatible with selected packages and verify container builds.
- Avoid `npm audit fix --force` across the project. Preserve lockfiles, apply changes in focused groups, rerun strict lint/build/tests and workflow checks, then reaudit.

## Complete lint findings

Full machine-readable output: [frontend-lint-report.json](frontend-lint-report.json). Every finding is also listed below.

| File:line:column | Severity | Rule | Message |
|---|---|---|---|
| frontend/public/facebook-sdk.js:7:5 | error | no-undef | 'FB' is not defined. |
| frontend/src/App.jsx:81:7 | error | no-unused-vars | 'AddCourse' is assigned a value but never used. |
| frontend/src/App.jsx:94:7 | error | no-unused-vars | 'MobileZoomMeetingViewer' is assigned a value but never used. |
| frontend/src/components/common/AuthChecker.jsx:11:22 | error | no-unused-vars | 'setIsChecking' is assigned a value but never used. |
| frontend/src/components/common/CodeEditor.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/common/CodeEditor.jsx:6:3 | error | react/prop-types | 'language' is missing in props validation |
| frontend/src/components/common/CodeEditor.jsx:7:3 | error | react/prop-types | 'starterCode' is missing in props validation |
| frontend/src/components/common/CodeEditor.jsx:8:3 | error | react/prop-types | 'onChange' is missing in props validation |
| frontend/src/components/common/CodeEditor.jsx:9:3 | error | react/prop-types | 'height' is missing in props validation |
| frontend/src/components/common/CodeEditor.jsx:10:3 | error | react/prop-types | 'testCases' is missing in props validation |
| frontend/src/components/common/CodeEditor.jsx:11:3 | error | react/prop-types | 'showInput' is missing in props validation |
| frontend/src/components/common/CodeEditor.jsx:12:3 | error | react/prop-types | 'showOutput' is missing in props validation |
| frontend/src/components/common/CodeEditor.jsx:13:3 | error | react/prop-types | 'allowLanguageChange' is missing in props validation |
| frontend/src/components/common/ConfirmationModal.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/common/ConfirmationModal.jsx:1:17 | error | no-unused-vars | 'useEffect' is defined but never used. |
| frontend/src/components/common/ConfirmationModal.jsx:5:3 | error | react/prop-types | 'modalData' is missing in props validation |
| frontend/src/components/common/ConfirmationModal.jsx:6:3 | error | react/prop-types | 'closeModal' is missing in props validation |
| frontend/src/components/common/ConfirmationModal.jsx:6:3 | error | no-unused-vars | 'closeModal' is defined but never used. |
| frontend/src/components/common/ConfirmationModal.jsx:8:3 | error | react/prop-types | 'text1' is missing in props validation |
| frontend/src/components/common/ConfirmationModal.jsx:9:3 | error | react/prop-types | 'text2' is missing in props validation |
| frontend/src/components/common/ConfirmationModal.jsx:10:3 | error | react/prop-types | 'btn1Text' is missing in props validation |
| frontend/src/components/common/ConfirmationModal.jsx:11:3 | error | react/prop-types | 'btn2Text' is missing in props validation |
| frontend/src/components/common/ConfirmationModal.jsx:12:3 | error | react/prop-types | 'btn1Handler' is missing in props validation |
| frontend/src/components/common/ConfirmationModal.jsx:13:3 | error | react/prop-types | 'btn2Handler' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/common/CouponDetailsModal.jsx:5:31 | error | react/prop-types | 'isOpen' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:5:39 | error | react/prop-types | 'onClose' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:5:48 | error | react/prop-types | 'coupon' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:20:39 | error | react/prop-types | 'coupon.startDate' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:21:40 | error | react/prop-types | 'coupon.expiryDate' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:23:17 | error | react/prop-types | 'coupon.isActive' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:95:84 | error | react/prop-types | 'coupon.code' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:101:31 | error | react/prop-types | 'coupon.discountType' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:102:37 | error | react/prop-types | 'coupon.discountValue' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:103:38 | error | react/prop-types | 'coupon.discountValue' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:110:29 | error | react/prop-types | 'coupon.usedCount' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:111:29 | error | react/prop-types | 'coupon.usageLimit' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:111:60 | error | react/prop-types | 'coupon.usageLimit' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:121:27 | error | react/prop-types | 'coupon.discountType' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:128:70 | error | react/prop-types | 'coupon.discountType' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:130:27 | error | react/prop-types | 'coupon.discountType' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:131:33 | error | react/prop-types | 'coupon.discountValue' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:132:34 | error | react/prop-types | 'coupon.discountValue' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:143:27 | error | react/prop-types | 'coupon.minimumOrderAmount' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:143:63 | error | react/prop-types | 'coupon.minimumOrderAmount' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:155:70 | error | react/prop-types | 'coupon.startDate' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:163:70 | error | react/prop-types | 'coupon.expiryDate' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:175:27 | error | react/prop-types | 'coupon.usageLimit' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:175:54 | error | react/prop-types | 'coupon.usageLimit' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:180:35 | error | react/prop-types | 'coupon.usedCount' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:180:56 | error | react/prop-types | 'coupon.usageLimit' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:180:80 | error | react/prop-types | 'coupon.usageLimit' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:182:27 | error | react/prop-types | 'coupon.usageLimit' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:186:61 | error | react/prop-types | 'coupon.usedCount' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:186:80 | error | react/prop-types | 'coupon.usageLimit' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:199:27 | error | react/prop-types | 'coupon.perUserLimit' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:199:56 | error | react/prop-types | 'coupon.perUserLimit' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:205:21 | error | react/prop-types | 'coupon.userUsage' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:205:41 | error | react/prop-types | 'coupon.userUsage' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:205:51 | error | react/prop-types | 'coupon.userUsage.length' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:209:47 | error | react/prop-types | 'coupon.userUsage' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:209:57 | error | react/prop-types | 'coupon.userUsage.length' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:212:27 | error | react/prop-types | 'coupon.userUsage' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:212:37 | error | react/prop-types | 'coupon.userUsage.slice' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:218:27 | error | react/prop-types | 'coupon.userUsage' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:218:37 | error | react/prop-types | 'coupon.userUsage.length' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:220:39 | error | react/prop-types | 'coupon.userUsage' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:220:49 | error | react/prop-types | 'coupon.userUsage.length' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:233:72 | error | react/prop-types | 'coupon.createdAt' is missing in props validation |
| frontend/src/components/common/CouponDetailsModal.jsx:237:72 | error | react/prop-types | 'coupon.updatedAt' is missing in props validation |
| frontend/src/components/common/CouponShareModal.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/common/CouponShareModal.jsx:3:41 | error | no-unused-vars | 'FiMessageCircle' is defined but never used. |
| frontend/src/components/common/CouponShareModal.jsx:7:29 | error | react/prop-types | 'isOpen' is missing in props validation |
| frontend/src/components/common/CouponShareModal.jsx:7:37 | error | react/prop-types | 'onClose' is missing in props validation |
| frontend/src/components/common/CouponShareModal.jsx:7:46 | error | react/prop-types | 'coupon' is missing in props validation |
| frontend/src/components/common/CouponShareModal.jsx:13:33 | error | react/prop-types | 'coupon.discountType' is missing in props validation |
| frontend/src/components/common/CouponShareModal.jsx:14:19 | error | react/prop-types | 'coupon.discountValue' is missing in props validation |
| frontend/src/components/common/CouponShareModal.jsx:15:20 | error | react/prop-types | 'coupon.discountValue' is missing in props validation |
| frontend/src/components/common/CouponShareModal.jsx:17:33 | error | react/prop-types | 'coupon.minimumOrderAmount' is missing in props validation |
| frontend/src/components/common/CouponShareModal.jsx:18:33 | error | react/prop-types | 'coupon.minimumOrderAmount' is missing in props validation |
| frontend/src/components/common/CouponShareModal.jsx:21:65 | error | react/prop-types | 'coupon.code' is missing in props validation |
| frontend/src/components/common/CouponShareModal.jsx:21:141 | error | react/prop-types | 'coupon.expiryDate' is missing in props validation |
| frontend/src/components/common/CouponShareModal.jsx:27:48 | error | react/prop-types | 'coupon.code' is missing in props validation |
| frontend/src/components/common/CouponShareModal.jsx:32:50 | error | react/prop-types | 'coupon.code' is missing in props validation |
| frontend/src/components/common/CouponShareModal.jsx:104:72 | error | react/prop-types | 'coupon.code' is missing in props validation |
| frontend/src/components/common/CouponShareModal.jsx:148:80 | error | react/prop-types | 'coupon.code' is missing in props validation |
| frontend/src/components/common/CouponShareModal.jsx:150:27 | error | react/prop-types | 'coupon.discountType' is missing in props validation |
| frontend/src/components/common/CouponShareModal.jsx:151:33 | error | react/prop-types | 'coupon.discountValue' is missing in props validation |
| frontend/src/components/common/CouponShareModal.jsx:152:34 | error | react/prop-types | 'coupon.discountValue' is missing in props validation |
| frontend/src/components/common/CouponShareModal.jsx:154:25 | error | react/prop-types | 'coupon.minimumOrderAmount' is missing in props validation |
| frontend/src/components/common/CouponShareModal.jsx:156:41 | error | react/prop-types | 'coupon.minimumOrderAmount' is missing in props validation |
| frontend/src/components/common/CouponShareModal.jsx:160:49 | error | react/prop-types | 'coupon.expiryDate' is missing in props validation |
| frontend/src/components/common/CouponSuccessModal.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/common/CouponSuccessModal.jsx:7:31 | error | react/prop-types | 'isOpen' is missing in props validation |
| frontend/src/components/common/CouponSuccessModal.jsx:7:39 | error | react/prop-types | 'onClose' is missing in props validation |
| frontend/src/components/common/CouponSuccessModal.jsx:7:48 | error | react/prop-types | 'discountAmount' is missing in props validation |
| frontend/src/components/common/CustomTimePicker.jsx:3:29 | error | react/prop-types | 'selectedTime' is missing in props validation |
| frontend/src/components/common/CustomTimePicker.jsx:3:43 | error | react/prop-types | 'onChange' is missing in props validation |
| frontend/src/components/common/CustomTimePicker.jsx:3:53 | error | react/prop-types | 'className' is missing in props validation |
| frontend/src/components/common/FaqButton.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/common/IconBtn.jsx:2:3 | error | react/prop-types | 'text' is missing in props validation |
| frontend/src/components/common/IconBtn.jsx:3:3 | error | react/prop-types | 'onClick' is missing in props validation |
| frontend/src/components/common/IconBtn.jsx:4:3 | error | react/prop-types | 'children' is missing in props validation |
| frontend/src/components/common/IconBtn.jsx:5:3 | error | react/prop-types | 'disabled' is missing in props validation |
| frontend/src/components/common/IconBtn.jsx:6:3 | error | react/prop-types | 'outline' is missing in props validation |
| frontend/src/components/common/IconBtn.jsx:7:3 | error | react/prop-types | 'customClasses' is missing in props validation |
| frontend/src/components/common/IconBtn.jsx:8:3 | error | react/prop-types | 'type' is missing in props validation |
| frontend/src/components/common/Img.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/common/Img.jsx:5:16 | error | react/prop-types | 'src' is missing in props validation |
| frontend/src/components/common/Img.jsx:5:21 | error | react/prop-types | 'className' is missing in props validation |
| frontend/src/components/common/Img.jsx:5:32 | error | react/prop-types | 'alt' is missing in props validation |
| frontend/src/components/common/Img.jsx:5:37 | error | react/prop-types | 'width' is missing in props validation |
| frontend/src/components/common/Img.jsx:5:44 | error | react/prop-types | 'height' is missing in props validation |
| frontend/src/components/common/Img.jsx:12:43 | error | no-unused-vars | 'event' is defined but never used. |
| frontend/src/components/common/Img.jsx:79:8 | warning | react-hooks/exhaustive-deps | React Hook useMemo has a missing dependency: 'getFallbackUrl'. Either include it or remove the dependency array. |
| frontend/src/components/common/Img.jsx:83:26 | error | react/prop-types | 'src.includes' is missing in props validation |
| frontend/src/components/common/Img.jsx:86:33 | error | react/prop-types | 'src.split' is missing in props validation |
| frontend/src/components/common/Img.jsx:87:35 | error | react/prop-types | 'src.split' is missing in props validation |
| frontend/src/components/common/Img.jsx:110:26 | error | react/prop-types | 'src.includes' is missing in props validation |
| frontend/src/components/common/Img.jsx:113:33 | error | react/prop-types | 'src.split' is missing in props validation |
| frontend/src/components/common/Img.jsx:114:35 | error | react/prop-types | 'src.split' is missing in props validation |
| frontend/src/components/common/Img.jsx:151:27 | error | no-unused-vars | 'e' is defined but never used. |
| frontend/src/components/common/ImprovedFooter.jsx:19:3 | error | no-unused-vars | 'FiArrowUp' is defined but never used. |
| frontend/src/components/common/ImprovedFooter.jsx:20:3 | error | no-unused-vars | 'FiHeart' is defined but never used. |
| frontend/src/components/common/Loading.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/common/ModernNavbar.jsx:12:10 | error | no-unused-vars | 'AiOutlineShoppingCart' is defined but never used. |
| frontend/src/components/common/ModernNavbar.jsx:20:11 | error | no-unused-vars | 'totalItems' is assigned a value but never used. |
| frontend/src/components/common/ModernNavbar.jsx:25:10 | error | no-unused-vars | 'error' is assigned a value but never used. |
| frontend/src/components/common/ModernNavbar.jsx:25:17 | error | no-unused-vars | 'setError' is assigned a value but never used. |
| frontend/src/components/common/Navbar.jsx:13:10 | error | no-unused-vars | 'AiOutlineShoppingCart' is defined but never used. |
| frontend/src/components/common/Navbar.jsx:27:11 | error | no-unused-vars | 'totalItems' is assigned a value but never used. |
| frontend/src/components/common/Navbar.jsx:35:10 | error | no-unused-vars | 'error' is assigned a value but never used. |
| frontend/src/components/common/Navbar.jsx:35:17 | error | no-unused-vars | 'setError' is assigned a value but never used. |
| frontend/src/components/common/NavbarDebug.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/common/NavbarDebug.jsx:2:10 | error | no-unused-vars | 'useSelector' is defined but never used. |
| frontend/src/components/common/NotificationBadge.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/common/NotificationBadge.jsx:3:30 | error | react/prop-types | 'count' is missing in props validation |
| frontend/src/components/common/NotificationBadge.jsx:3:37 | error | react/prop-types | 'className' is missing in props validation |
| frontend/src/components/common/NotificationPanel.jsx:21:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fetchNotifications'. Either include it or remove the dependency array. |
| frontend/src/components/common/PaymentAnimation.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/common/PaymentAnimation.jsx:5:29 | error | react/prop-types | 'type' is missing in props validation |
| frontend/src/components/common/PaymentAnimation.jsx:5:35 | error | react/prop-types | 'onComplete' is missing in props validation |
| frontend/src/components/common/PaymentAnimationTest.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/common/QuickLinks.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/common/RatingStars.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/common/RatingStars.jsx:8:24 | error | react/prop-types | 'Review_Count' is missing in props validation |
| frontend/src/components/common/RatingStars.jsx:8:38 | error | react/prop-types | 'Star_Size' is missing in props validation |
| frontend/src/components/common/ReviewSlider.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/common/ReviewSlider.jsx:27:5 | error | no-extra-semi | Unnecessary semicolon. |
| frontend/src/components/common/Tab.jsx:1:31 | error | react/prop-types | 'tabData' is missing in props validation |
| frontend/src/components/common/Tab.jsx:1:40 | error | react/prop-types | 'field' is missing in props validation |
| frontend/src/components/common/Tab.jsx:1:47 | error | react/prop-types | 'setField' is missing in props validation |
| frontend/src/components/common/Tab.jsx:10:17 | error | react/prop-types | 'tabData.map' is missing in props validation |
| frontend/src/components/common/VideoUploadProgress.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/common/VideoUploadProgress.jsx:7:3 | error | react/prop-types | 'progress' is missing in props validation |
| frontend/src/components/common/VideoUploadProgress.jsx:8:3 | error | react/prop-types | 'fileName' is missing in props validation |
| frontend/src/components/common/VideoUploadProgress.jsx:9:3 | error | react/prop-types | 'fileSize' is missing in props validation |
| frontend/src/components/common/VideoUploadProgress.jsx:10:3 | error | react/prop-types | 'status' is missing in props validation |
| frontend/src/components/common/VideoUploadProgress.jsx:11:3 | error | react/prop-types | 'onCancel' is missing in props validation |
| frontend/src/components/common/VideoUploadProgress.jsx:12:3 | error | react/prop-types | 'onPause' is missing in props validation |
| frontend/src/components/common/VideoUploadProgress.jsx:13:3 | error | react/prop-types | 'onResume' is missing in props validation |
| frontend/src/components/common/VideoUploadProgress.jsx:14:3 | error | react/prop-types | 'error' is missing in props validation |
| frontend/src/components/common/VideoUploadProgress.jsx:15:3 | error | react/prop-types | 'isChunked' is missing in props validation |
| frontend/src/components/common/VideoUploadProgress.jsx:16:3 | error | react/prop-types | 'currentChunk' is missing in props validation |
| frontend/src/components/common/VideoUploadProgress.jsx:17:3 | error | react/prop-types | 'totalChunks' is missing in props validation |
| frontend/src/components/common/VideoUploadProgress.jsx:18:3 | error | react/prop-types | 'uploadType' is missing in props validation |
| frontend/src/components/core/AboutPage/BenefitsForEmployers.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/AboutPage/ContactFormSection.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/AboutPage/Faqs.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/AboutPage/Faqs.jsx:73:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fallbackFaqData'. Either include it or remove the dependency array. |
| frontend/src/components/core/AboutPage/Faqs.jsx:240:16 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/components/core/AboutPage/Faqs.jsx:240:38 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/components/core/AboutPage/Faqs.jsx:240:57 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/components/core/AboutPage/LearningGrid.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/AboutPage/Quote.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/AboutPage/Stats.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/Auth/LoginForm.jsx:9:10 | error | no-unused-vars | 'LinkedInCallback' is defined but never used. |
| frontend/src/components/core/Auth/LoginForm.jsx:14:10 | error | no-unused-vars | 'apiConnector' is defined but never used. |
| frontend/src/components/core/Auth/LoginForm.jsx:27:26 | error | no-unused-vars | 'setCaptchaLoading' is assigned a value but never used. |
| frontend/src/components/core/Auth/MobileProfileDropDown.jsx:35:22 | error | react-hooks/rules-of-hooks | React Hook "useDispatch" is called conditionally. React Hooks must be called in the exact same order in every component render. |
| frontend/src/components/core/Auth/MobileProfileDropDown.jsx:36:22 | error | react-hooks/rules-of-hooks | React Hook "useNavigate" is called conditionally. React Hooks must be called in the exact same order in every component render. |
| frontend/src/components/core/Auth/MobileProfileDropDown.jsx:37:17 | error | react-hooks/rules-of-hooks | React Hook "useRef" is called conditionally. React Hooks must be called in the exact same order in every component render. |
| frontend/src/components/core/Auth/MobileProfileDropDown.jsx:39:5 | error | react-hooks/rules-of-hooks | React Hook "useOnClickOutside" is called conditionally. React Hooks must be called in the exact same order in every component render. |
| frontend/src/components/core/Auth/MobileProfileDropDown.jsx:42:29 | error | react-hooks/rules-of-hooks | React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. |
| frontend/src/components/core/Auth/MobileProfileDropDown.jsx:43:12 | error | no-unused-vars | 'subLinks' is assigned a value but never used. |
| frontend/src/components/core/Auth/MobileProfileDropDown.jsx:43:37 | error | react-hooks/rules-of-hooks | React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. |
| frontend/src/components/core/Auth/MobileProfileDropDown.jsx:44:12 | error | no-unused-vars | 'loading' is assigned a value but never used. |
| frontend/src/components/core/Auth/MobileProfileDropDown.jsx:44:35 | error | react-hooks/rules-of-hooks | React Hook "useState" is called conditionally. React Hooks must be called in the exact same order in every component render. |
| frontend/src/components/core/Auth/MobileProfileDropDown.jsx:65:5 | error | react-hooks/rules-of-hooks | React Hook "useEffect" is called conditionally. React Hooks must be called in the exact same order in every component render. |
| frontend/src/components/core/Auth/OpenRoute.jsx:5:22 | error | react/prop-types | 'children' is missing in props validation |
| frontend/src/components/core/Auth/ProtectedRoute.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/Auth/ProtectedRoute.jsx:5:27 | error | react/prop-types | 'children' is missing in props validation |
| frontend/src/components/core/Auth/Template.jsx:7:21 | error | react/prop-types | 'title' is missing in props validation |
| frontend/src/components/core/Auth/Template.jsx:7:28 | error | react/prop-types | 'description1' is missing in props validation |
| frontend/src/components/core/Auth/Template.jsx:7:42 | error | react/prop-types | 'description2' is missing in props validation |
| frontend/src/components/core/Auth/Template.jsx:7:56 | error | react/prop-types | 'image' is missing in props validation |
| frontend/src/components/core/Auth/Template.jsx:7:63 | error | react/prop-types | 'formType' is missing in props validation |
| frontend/src/components/core/Catalog/BundleCourseCard.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/Catalog/BundleCourseCard.jsx:6:29 | error | react/prop-types | 'course' is missing in props validation |
| frontend/src/components/core/Catalog/BundleCourseCard.jsx:6:37 | error | react/prop-types | 'isSelected' is missing in props validation |
| frontend/src/components/core/Catalog/BundleCourseCard.jsx:6:49 | error | react/prop-types | 'onSelect' is missing in props validation |
| frontend/src/components/core/Catalog/BundleCourseCard.jsx:6:59 | error | react/prop-types | 'Height' is missing in props validation |
| frontend/src/components/core/Catalog/BundleCourseCard.jsx:7:29 | error | react/prop-types | 'course.averageRating' is missing in props validation |
| frontend/src/components/core/Catalog/BundleCourseCard.jsx:8:32 | error | react/prop-types | 'course.totalRatings' is missing in props validation |
| frontend/src/components/core/Catalog/BundleCourseCard.jsx:33:24 | error | react/prop-types | 'course.thumbnail' is missing in props validation |
| frontend/src/components/core/Catalog/BundleCourseCard.jsx:44:20 | error | react/prop-types | 'course.courseName' is missing in props validation |
| frontend/src/components/core/Catalog/BundleCourseCard.jsx:49:23 | error | react/prop-types | 'course.instructor' is missing in props validation |
| frontend/src/components/core/Catalog/BundleCourseCard.jsx:49:35 | error | react/prop-types | 'course.instructor.firstName' is missing in props validation |
| frontend/src/components/core/Catalog/BundleCourseCard.jsx:49:55 | error | react/prop-types | 'course.instructor' is missing in props validation |
| frontend/src/components/core/Catalog/BundleCourseCard.jsx:49:67 | error | react/prop-types | 'course.instructor.lastName' is missing in props validation |
| frontend/src/components/core/Catalog/BundleCourseCard.jsx:66:22 | error | react/prop-types | 'course.courseType' is missing in props validation |
| frontend/src/components/core/Catalog/BundleCourseCard.jsx:69:78 | error | react/prop-types | 'course.price' is missing in props validation |
| frontend/src/components/core/Catalog/BundleCourseCard.jsx:71:22 | error | react/prop-types | 'course.courseType' is missing in props validation |
| frontend/src/components/core/Catalog/BundleCourseCard.jsx:71:55 | error | react/prop-types | 'course.originalPrice' is missing in props validation |
| frontend/src/components/core/Catalog/BundleCourseCard.jsx:73:27 | error | react/prop-types | 'course.originalPrice' is missing in props validation |
| frontend/src/components/core/Catalog/BundleCourseCard.jsx:80:21 | error | react/prop-types | 'course.courseType' is missing in props validation |
| frontend/src/components/core/Catalog/BundleCourseCard.jsx:84:22 | error | react/prop-types | 'course.courseType' is missing in props validation |
| frontend/src/components/core/Catalog/BundleCourseSection.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/Catalog/BundleCourseSection.jsx:9:32 | error | react/prop-types | 'courses' is missing in props validation |
| frontend/src/components/core/Catalog/BundleCourseSection.jsx:12:10 | error | no-unused-vars | 'enrolledCourses' is assigned a value but never used. |
| frontend/src/components/core/Catalog/BundleCourseSection.jsx:25:34 | error | react/prop-types | 'courses.length' is missing in props validation |
| frontend/src/components/core/Catalog/BundleCourseSection.jsx:27:38 | error | react/prop-types | 'courses.filter' is missing in props validation |
| frontend/src/components/core/Catalog/BundleCourseSection.jsx:69:9 | error | no-unused-vars | 'getTotalPrice' is assigned a value but never used. |
| frontend/src/components/core/Catalog/CourseCard.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/Catalog/CourseCard.jsx:10:38 | error | react/prop-types | 'course' is missing in props validation |
| frontend/src/components/core/Catalog/CourseCard.jsx:10:46 | error | react/prop-types | 'Height' is missing in props validation |
| frontend/src/components/core/Catalog/CourseCard.jsx:10:46 | error | no-unused-vars | 'Height' is assigned a value but never used. |
| frontend/src/components/core/Catalog/CourseCard.jsx:11:11 | error | no-unused-vars | 'user' is assigned a value but never used. |
| frontend/src/components/core/Catalog/CourseCard.jsx:15:17 | error | react/prop-types | 'course._id' is missing in props validation |
| frontend/src/components/core/Catalog/CourseCard.jsx:16:35 | error | react/prop-types | 'course._id' is missing in props validation |
| frontend/src/components/core/Catalog/CourseCard.jsx:54:18 | error | react/prop-types | 'course.thumbnail' is missing in props validation |
| frontend/src/components/core/Catalog/CourseCard.jsx:56:26 | error | react/prop-types | 'course.thumbnail' is missing in props validation |
| frontend/src/components/core/Catalog/CourseCard.jsx:57:26 | error | react/prop-types | 'course.courseName' is missing in props validation |
| frontend/src/components/core/Catalog/CourseCard.jsx:67:21 | error | react/prop-types | 'course.courseType' is missing in props validation |
| frontend/src/components/core/Catalog/CourseCard.jsx:67:54 | error | react/prop-types | 'course.adminSetFree' is missing in props validation |
| frontend/src/components/core/Catalog/CourseCard.jsx:71:20 | error | react/prop-types | 'course.courseType' is missing in props validation |
| frontend/src/components/core/Catalog/CourseCard.jsx:71:53 | error | react/prop-types | 'course.adminSetFree' is missing in props validation |
| frontend/src/components/core/Catalog/CourseCard.jsx:79:20 | error | react/prop-types | 'course.courseName' is missing in props validation |
| frontend/src/components/core/Catalog/CourseCard.jsx:83:20 | error | react/prop-types | 'course.courseDescription' is missing in props validation |
| frontend/src/components/core/Catalog/CourseCard.jsx:89:22 | error | react/prop-types | 'course.instructor' is missing in props validation |
| frontend/src/components/core/Catalog/CourseCard.jsx:89:34 | error | react/prop-types | 'course.instructor.firstName' is missing in props validation |
| frontend/src/components/core/Catalog/CourseCard.jsx:89:54 | error | react/prop-types | 'course.instructor' is missing in props validation |
| frontend/src/components/core/Catalog/CourseCard.jsx:89:66 | error | react/prop-types | 'course.instructor.lastName' is missing in props validation |
| frontend/src/components/core/Catalog/CourseCard.jsx:97:28 | error | react/prop-types | 'course.studentsEnrolled' is missing in props validation |
| frontend/src/components/core/Catalog/CourseCard.jsx:97:46 | error | react/prop-types | 'course.studentsEnrolled.length' is missing in props validation |
| frontend/src/components/core/Catalog/CourseCard.jsx:101:28 | error | react/prop-types | 'course.totalDuration' is missing in props validation |
| frontend/src/components/core/Catalog/CourseCard.jsx:109:42 | error | react/prop-types | 'course.averageRating' is missing in props validation |
| frontend/src/components/core/Catalog/CourseCard.jsx:111:25 | error | react/prop-types | 'course.totalRatings' is missing in props validation |
| frontend/src/components/core/Catalog/CourseCard.jsx:117:22 | error | react/prop-types | 'course.courseType' is missing in props validation |
| frontend/src/components/core/Catalog/CourseCard.jsx:117:55 | error | react/prop-types | 'course.adminSetFree' is missing in props validation |
| frontend/src/components/core/Catalog/CourseCard.jsx:121:29 | error | react/prop-types | 'course.price' is missing in props validation |
| frontend/src/components/core/Catalog/CourseCard.jsx:121:46 | error | react/prop-types | 'course.originalPrice' is missing in props validation |
| frontend/src/components/core/Catalog/CourseCard.jsx:126:26 | error | react/prop-types | 'course.originalPrice' is missing in props validation |
| frontend/src/components/core/Catalog/CourseCard.jsx:126:51 | error | react/prop-types | 'course.originalPrice' is missing in props validation |
| frontend/src/components/core/Catalog/CourseCard.jsx:126:77 | error | react/prop-types | 'course.price' is missing in props validation |
| frontend/src/components/core/Catalog/CourseCard.jsx:128:30 | error | react/prop-types | 'course.originalPrice' is missing in props validation |
| frontend/src/components/core/Catalog/CourseCard.jsx:133:54 | error | react/prop-types | 'course.price' is missing in props validation |
| frontend/src/components/core/Catalog/Course_Card.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/Catalog/Course_Card.jsx:10:24 | error | react/prop-types | 'course' is missing in props validation |
| frontend/src/components/core/Catalog/Course_Card.jsx:10:32 | error | react/prop-types | 'Height' is missing in props validation |
| frontend/src/components/core/Catalog/Course_Card.jsx:10:32 | error | no-unused-vars | 'Height' is defined but never used. |
| frontend/src/components/core/Catalog/Course_Card.jsx:10:40 | error | react/prop-types | 'bundleMode' is missing in props validation |
| frontend/src/components/core/Catalog/Course_Card.jsx:10:60 | error | react/prop-types | 'isSelected' is missing in props validation |
| frontend/src/components/core/Catalog/Course_Card.jsx:10:80 | error | react/prop-types | 'onSelect' is missing in props validation |
| frontend/src/components/core/Catalog/Course_Card.jsx:10:97 | error | react/prop-types | 'selectionText' is missing in props validation |
| frontend/src/components/core/Catalog/Course_Card.jsx:17:29 | error | react/prop-types | 'course.averageRating' is missing in props validation |
| frontend/src/components/core/Catalog/Course_Card.jsx:18:32 | error | react/prop-types | 'course.totalRatings' is missing in props validation |
| frontend/src/components/core/Catalog/Course_Card.jsx:36:18 | error | react/prop-types | 'course.thumbnail' is missing in props validation |
| frontend/src/components/core/Catalog/Course_Card.jsx:38:26 | error | react/prop-types | 'course.thumbnail' is missing in props validation |
| frontend/src/components/core/Catalog/Course_Card.jsx:49:21 | error | react/prop-types | 'course.courseType' is missing in props validation |
| frontend/src/components/core/Catalog/Course_Card.jsx:49:54 | error | react/prop-types | 'course.adminSetFree' is missing in props validation |
| frontend/src/components/core/Catalog/Course_Card.jsx:53:20 | error | react/prop-types | 'course.courseType' is missing in props validation |
| frontend/src/components/core/Catalog/Course_Card.jsx:53:53 | error | react/prop-types | 'course.adminSetFree' is missing in props validation |
| frontend/src/components/core/Catalog/Course_Card.jsx:60:20 | error | react/prop-types | 'course.courseName' is missing in props validation |
| frontend/src/components/core/Catalog/Course_Card.jsx:65:22 | error | react/prop-types | 'course.instructor' is missing in props validation |
| frontend/src/components/core/Catalog/Course_Card.jsx:65:34 | error | react/prop-types | 'course.instructor.firstName' is missing in props validation |
| frontend/src/components/core/Catalog/Course_Card.jsx:65:54 | error | react/prop-types | 'course.instructor' is missing in props validation |
| frontend/src/components/core/Catalog/Course_Card.jsx:65:66 | error | react/prop-types | 'course.instructor.lastName' is missing in props validation |
| frontend/src/components/core/Catalog/Course_Card.jsx:73:28 | error | react/prop-types | 'course.studentsEnrolled' is missing in props validation |
| frontend/src/components/core/Catalog/Course_Card.jsx:73:46 | error | react/prop-types | 'course.studentsEnrolled.length' is missing in props validation |
| frontend/src/components/core/Catalog/Course_Card.jsx:77:28 | error | react/prop-types | 'course.totalDuration' is missing in props validation |
| frontend/src/components/core/Catalog/Course_Card.jsx:92:22 | error | react/prop-types | 'course.courseType' is missing in props validation |
| frontend/src/components/core/Catalog/Course_Card.jsx:92:55 | error | react/prop-types | 'course.adminSetFree' is missing in props validation |
| frontend/src/components/core/Catalog/Course_Card.jsx:96:29 | error | react/prop-types | 'course.price' is missing in props validation |
| frontend/src/components/core/Catalog/Course_Card.jsx:96:46 | error | react/prop-types | 'course.originalPrice' is missing in props validation |
| frontend/src/components/core/Catalog/Course_Card.jsx:101:26 | error | react/prop-types | 'course.originalPrice' is missing in props validation |
| frontend/src/components/core/Catalog/Course_Card.jsx:101:51 | error | react/prop-types | 'course.originalPrice' is missing in props validation |
| frontend/src/components/core/Catalog/Course_Card.jsx:101:77 | error | react/prop-types | 'course.price' is missing in props validation |
| frontend/src/components/core/Catalog/Course_Card.jsx:103:30 | error | react/prop-types | 'course.originalPrice' is missing in props validation |
| frontend/src/components/core/Catalog/Course_Card.jsx:108:67 | error | react/prop-types | 'course.price' is missing in props validation |
| frontend/src/components/core/Catalog/Course_Card.jsx:152:26 | error | react/prop-types | 'course._id' is missing in props validation |
| frontend/src/components/core/Catalog/Course_Card.jsx:152:51 | error | react/prop-types | 'course._id' is missing in props validation |
| frontend/src/components/core/Catalog/Course_Slider.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/Catalog/Course_Slider.jsx:4:26 | error | react/prop-types | 'Courses' is missing in props validation |
| frontend/src/components/core/Catalog/Course_Slider.jsx:7:17 | error | react/prop-types | 'Courses.length' is missing in props validation |
| frontend/src/components/core/Catalog/Course_Slider.jsx:10:23 | error | react/prop-types | 'Courses.map' is missing in props validation |
| frontend/src/components/core/Catalog/FreeCourses.jsx:25:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has missing dependencies: 'fetchFreeCourses', 'fetchUserRequests', and 'token'. Either include them or remove the dependency array. |
| frontend/src/components/core/Catalog/FreeCourses.jsx:47:9 | error | no-unused-vars | 'handleRequestAccess' is assigned a value but never used. |
| frontend/src/components/core/Certificate/CleanInternshipCertificate.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/Certificate/CleanInternshipCertificate.jsx:7:54 | error | react/prop-types | 'certificateData' is missing in props validation |
| frontend/src/components/core/Certificate/CleanInternshipCertificate.jsx:12:28 | error | react/prop-types | 'certificateData.certificateId' is missing in props validation |
| frontend/src/components/core/Certificate/CleanInternshipCertificate.jsx:15:77 | error | react/prop-types | 'certificateData.certificateId' is missing in props validation |
| frontend/src/components/core/Certificate/CleanInternshipCertificate.jsx:24:24 | error | react/prop-types | 'certificateData.certificateId' is missing in props validation |
| frontend/src/components/core/Certificate/CleanInternshipCertificate.jsx:190:45 | error | react/prop-types | 'certificateData.certificateId' is missing in props validation |
| frontend/src/components/core/Certificate/CleanInternshipCertificate.jsx:227:51 | error | react/prop-types | 'certificateData.completionDate' is missing in props validation |
| frontend/src/components/core/Certificate/CleanInternshipCertificate.jsx:293:29 | error | react/prop-types | 'certificateData.studentName' is missing in props validation |
| frontend/src/components/core/Certificate/CleanInternshipCertificate.jsx:313:31 | error | react/prop-types | 'certificateData.categoryName' is missing in props validation |
| frontend/src/components/core/Certificate/CleanInternshipCertificate.jsx:313:64 | error | react/prop-types | 'certificateData.courseId' is missing in props validation |
| frontend/src/components/core/Certificate/CleanInternshipCertificate.jsx:313:74 | error | react/prop-types | 'certificateData.courseId.category' is missing in props validation |
| frontend/src/components/core/Certificate/CleanInternshipCertificate.jsx:313:84 | error | react/prop-types | 'certificateData.courseId.category.name' is missing in props validation |
| frontend/src/components/core/Certificate/CleanInternshipCertificate.jsx:323:31 | error | react/prop-types | 'certificateData.courseName' is missing in props validation |
| frontend/src/components/core/Certificate/CleanInternshipCertificate.jsx:323:62 | error | react/prop-types | 'certificateData.courseId' is missing in props validation |
| frontend/src/components/core/Certificate/CleanInternshipCertificate.jsx:323:72 | error | react/prop-types | 'certificateData.courseId.courseName' is missing in props validation |
| frontend/src/components/core/Certificate/CourseCertificate.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/Certificate/CourseCertificate.jsx:7:45 | error | react/prop-types | 'certificateData' is missing in props validation |
| frontend/src/components/core/Certificate/CourseCertificate.jsx:12:28 | error | react/prop-types | 'certificateData.certificateId' is missing in props validation |
| frontend/src/components/core/Certificate/CourseCertificate.jsx:15:77 | error | react/prop-types | 'certificateData.certificateId' is missing in props validation |
| frontend/src/components/core/Certificate/CourseCertificate.jsx:24:24 | error | react/prop-types | 'certificateData.certificateId' is missing in props validation |
| frontend/src/components/core/Certificate/CourseCertificate.jsx:36:58 | error | react/prop-types | 'certificateData.certificateId' is missing in props validation |
| frontend/src/components/core/Certificate/CourseCertificate.jsx:48:67 | error | react/prop-types | 'certificateData.studentName' is missing in props validation |
| frontend/src/components/core/Certificate/CourseCertificate.jsx:49:55 | error | react/prop-types | 'certificateData.email' is missing in props validation |
| frontend/src/components/core/Certificate/CourseCertificate.jsx:54:29 | error | react/prop-types | 'certificateData.courseName' is missing in props validation |
| frontend/src/components/core/Certificate/CourseCertificate.jsx:62:69 | error | react/prop-types | 'certificateData.completionDate' is missing in props validation |
| frontend/src/components/core/Certificate/CourseCertificate.jsx:66:47 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/components/core/Certificate/InternshipCertificate.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/Certificate/InternshipCertificate.jsx:5:23 | error | no-unused-vars | 'isoLogo' is defined but never used. |
| frontend/src/components/core/Certificate/InternshipCertificate.jsx:7:49 | error | react/prop-types | 'certificateData' is missing in props validation |
| frontend/src/components/core/Certificate/InternshipCertificate.jsx:12:28 | error | react/prop-types | 'certificateData.certificateId' is missing in props validation |
| frontend/src/components/core/Certificate/InternshipCertificate.jsx:15:77 | error | react/prop-types | 'certificateData.certificateId' is missing in props validation |
| frontend/src/components/core/Certificate/InternshipCertificate.jsx:24:24 | error | react/prop-types | 'certificateData.certificateId' is missing in props validation |
| frontend/src/components/core/Certificate/InternshipCertificate.jsx:48:76 | error | react/prop-types | 'certificateData.certificateId' is missing in props validation |
| frontend/src/components/core/Certificate/InternshipCertificate.jsx:72:80 | error | react/prop-types | 'certificateData.studentName' is missing in props validation |
| frontend/src/components/core/Certificate/InternshipCertificate.jsx:82:31 | error | react/prop-types | 'certificateData.courseName' is missing in props validation |
| frontend/src/components/core/Certificate/InternshipCertificate.jsx:142:54 | error | react/prop-types | 'certificateData.completionDate' is missing in props validation |
| frontend/src/components/core/Certificate/ModernInternshipCertificate.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/Certificate/ModernInternshipCertificate.jsx:5:23 | error | no-unused-vars | 'isoLogo' is defined but never used. |
| frontend/src/components/core/Certificate/ModernInternshipCertificate.jsx:7:55 | error | react/prop-types | 'certificateData' is missing in props validation |
| frontend/src/components/core/Certificate/ModernInternshipCertificate.jsx:12:28 | error | react/prop-types | 'certificateData.certificateId' is missing in props validation |
| frontend/src/components/core/Certificate/ModernInternshipCertificate.jsx:15:77 | error | react/prop-types | 'certificateData.certificateId' is missing in props validation |
| frontend/src/components/core/Certificate/ModernInternshipCertificate.jsx:24:24 | error | react/prop-types | 'certificateData.certificateId' is missing in props validation |
| frontend/src/components/core/Certificate/ModernInternshipCertificate.jsx:45:37 | error | react/prop-types | 'certificateData.certificateId' is missing in props validation |
| frontend/src/components/core/Certificate/ModernInternshipCertificate.jsx:83:33 | error | react/prop-types | 'certificateData.studentName' is missing in props validation |
| frontend/src/components/core/Certificate/ModernInternshipCertificate.jsx:96:33 | error | react/prop-types | 'certificateData.courseName' is missing in props validation |
| frontend/src/components/core/Certificate/ModernInternshipCertificate.jsx:105:13 | error | react/no-unescaped-entities | `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. |
| frontend/src/components/core/Certificate/ModernInternshipCertificate.jsx:106:58 | error | react/no-unescaped-entities | `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. |
| frontend/src/components/core/Certificate/ModernInternshipCertificate.jsx:161:50 | error | react/prop-types | 'certificateData.completionDate' is missing in props validation |
| frontend/src/components/core/Chat/ChatButton.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/Chat/ChatButton.jsx:8:23 | error | react/prop-types | 'courseId' is missing in props validation |
| frontend/src/components/core/Chat/ChatButton.jsx:8:33 | error | react/prop-types | 'courseName' is missing in props validation |
| frontend/src/components/core/Chat/ChatButton.jsx:8:45 | error | react/prop-types | 'instructorName' is missing in props validation |
| frontend/src/components/core/Chat/ChatWindow.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/Chat/ChatWindow.jsx:4:52 | error | no-unused-vars | 'IoVideocam' is defined but never used. |
| frontend/src/components/core/Chat/ChatWindow.jsx:4:64 | error | no-unused-vars | 'IoCall' is defined but never used. |
| frontend/src/components/core/Chat/ChatWindow.jsx:5:24 | error | no-unused-vars | 'BsThreeDotsVertical' is defined but never used. |
| frontend/src/components/core/Chat/ChatWindow.jsx:11:23 | error | react/prop-types | 'chat' is missing in props validation |
| frontend/src/components/core/Chat/ChatWindow.jsx:11:29 | error | react/prop-types | 'onClose' is missing in props validation |
| frontend/src/components/core/Chat/ChatWindow.jsx:11:38 | error | react/prop-types | 'courseName' is missing in props validation |
| frontend/src/components/core/Chat/ChatWindow.jsx:42:24 | error | react/prop-types | 'chat._id' is missing in props validation |
| frontend/src/components/core/Chat/ChatWindow.jsx:56:42 | error | react/prop-types | 'chat._id' is missing in props validation |
| frontend/src/components/core/Chat/ChatWindow.jsx:122:43 | error | react/prop-types | 'chat._id' is missing in props validation |
| frontend/src/components/core/Chat/ChatWindow.jsx:126:20 | error | react/prop-types | 'chat._id' is missing in props validation |
| frontend/src/components/core/Chat/ChatWindow.jsx:130:15 | error | react/prop-types | 'chat._id' is missing in props validation |
| frontend/src/components/core/Chat/ChatWindow.jsx:133:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'loadMessages'. Either include it or remove the dependency array. |
| frontend/src/components/core/Chat/ChatWindow.jsx:133:13 | error | react/prop-types | 'chat._id' is missing in props validation |
| frontend/src/components/core/Chat/ChatWindow.jsx:147:55 | error | react/prop-types | 'chat._id' is missing in props validation |
| frontend/src/components/core/Chat/ChatWindow.jsx:174:20 | error | react/prop-types | 'chat._id' is missing in props validation |
| frontend/src/components/core/Chat/ChatWindow.jsx:202:41 | error | react/prop-types | 'chat._id' is missing in props validation |
| frontend/src/components/core/Chat/ChatWindow.jsx:208:14 | error | react/prop-types | 'chat._id' is missing in props validation |
| frontend/src/components/core/Chat/ChatWindow.jsx:288:40 | error | react/prop-types | 'chat._id' is missing in props validation |
| frontend/src/components/core/Chat/ChatWindow.jsx:300:41 | error | react/prop-types | 'chat._id' is missing in props validation |
| frontend/src/components/core/Chat/ChatWindow.jsx:306:61 | error | react/prop-types | 'chat.instructor' is missing in props validation |
| frontend/src/components/core/Chat/ChatWindow.jsx:306:80 | error | react/prop-types | 'chat.student' is missing in props validation |
| frontend/src/components/core/Chat/ChatWindow.jsx:334:38 | error | react/prop-types | 'chat.course' is missing in props validation |
| frontend/src/components/core/Chat/ChatWindow.jsx:334:46 | error | react/prop-types | 'chat.course.courseName' is missing in props validation |
| frontend/src/components/core/Chat/MessageList.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/Chat/MessageList.jsx:5:24 | error | react/prop-types | 'messages' is missing in props validation |
| frontend/src/components/core/Chat/MessageList.jsx:5:34 | error | react/prop-types | 'currentUserId' is missing in props validation |
| frontend/src/components/core/Chat/MessageList.jsx:5:49 | error | react/prop-types | 'messagesEndRef' is missing in props validation |
| frontend/src/components/core/Chat/MessageList.jsx:21:17 | error | react/prop-types | 'messages.length' is missing in props validation |
| frontend/src/components/core/Chat/MessageList.jsx:31:21 | error | react/prop-types | 'messages.map' is missing in props validation |
| frontend/src/components/core/Chat/MessageList.jsx:32:67 | error | react/prop-types | 'messages[].sender' is missing in props validation |
| frontend/src/components/core/Chat/MessageList.jsx:32:74 | error | react/prop-types | 'messages[].sender._id' is missing in props validation |
| frontend/src/components/core/ContactPage/ContactDetails.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/ContactPage/ContactForm.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/ContactPage/ContactUsForm.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/CourseAccessButton.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/CourseAccessButton.jsx:2:10 | error | no-unused-vars | 'checkCourseAccess' is defined but never used. |
| frontend/src/components/core/CourseAccessButton.jsx:2:89 | error | no-unused-vars | 'consumeCourseAccess' is defined but never used. |
| frontend/src/components/core/CourseAccessButton.jsx:3:40 | error | no-unused-vars | 'FiExternalLink' is defined but never used. |
| frontend/src/components/core/CourseAccessButton.jsx:7:3 | error | react/prop-types | 'courseId' is missing in props validation |
| frontend/src/components/core/CourseAccessButton.jsx:8:3 | error | react/prop-types | 'courseTitle' is missing in props validation |
| frontend/src/components/core/CourseAccessButton.jsx:9:3 | error | react/prop-types | 'pid' is missing in props validation |
| frontend/src/components/core/CourseAccessButton.jsx:10:3 | error | react/prop-types | 'token' is missing in props validation |
| frontend/src/components/core/CourseAccessButton.jsx:11:3 | error | react/prop-types | 'variant' is missing in props validation |
| frontend/src/components/core/CourseAccessButton.jsx:12:3 | error | react/prop-types | 'size' is missing in props validation |
| frontend/src/components/core/CourseAccessButton.jsx:13:3 | error | react/prop-types | 'showStatus' is missing in props validation |
| frontend/src/components/core/CourseAccessButton.jsx:14:3 | error | react/prop-types | 'onAccessGranted' is missing in props validation |
| frontend/src/components/core/CourseAccessButton.jsx:15:3 | error | react/prop-types | 'onAccessDenied' is missing in props validation |
| frontend/src/components/core/CourseAccessButton.jsx:26:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'checkAccess'. Either include it or remove the dependency array. |
| frontend/src/components/core/CourseAccessButton.jsx:222:52 | error | react/no-unescaped-entities | `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. |
| frontend/src/components/core/CourseAccessButton.jsx:222:66 | error | react/no-unescaped-entities | `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. |
| frontend/src/components/core/CourseSubscriptionPanel.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/CourseSubscriptionPanel.jsx:11:3 | error | no-unused-vars | 'FiExternalLink' is defined but never used. |
| frontend/src/components/core/CourseSubscriptionPanel.jsx:17:36 | error | react/prop-types | 'courseId' is missing in props validation |
| frontend/src/components/core/CourseSubscriptionPanel.jsx:17:46 | error | react/prop-types | 'courseTitle' is missing in props validation |
| frontend/src/components/core/CourseSubscriptionPanel.jsx:17:46 | error | no-unused-vars | 'courseTitle' is defined but never used. |
| frontend/src/components/core/CourseSubscriptionPanel.jsx:17:59 | error | react/prop-types | 'onAccessGranted' is missing in props validation |
| frontend/src/components/core/CourseSubscriptionPanel.jsx:34:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'initializeUserData'. Either include it or remove the dependency array. |
| frontend/src/components/core/Course/CourseAccordionBar.jsx:7:46 | error | react/prop-types | 'course' is missing in props validation |
| frontend/src/components/core/Course/CourseAccordionBar.jsx:7:54 | error | react/prop-types | 'isActive' is missing in props validation |
| frontend/src/components/core/Course/CourseAccordionBar.jsx:7:64 | error | react/prop-types | 'handleActive' is missing in props validation |
| frontend/src/components/core/Course/CourseAccordionBar.jsx:14:25 | error | react/prop-types | 'isActive.includes' is missing in props validation |
| frontend/src/components/core/Course/CourseAccordionBar.jsx:14:41 | error | react/prop-types | 'course._id' is missing in props validation |
| frontend/src/components/core/Course/CourseAccordionBar.jsx:15:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'course._id'. Either include it or remove the dependency array. If 'setActive' needs the current value of 'course._id', you can also switch to useReducer instead of useState and read 'course._id' in the reducer. |
| frontend/src/components/core/Course/CourseAccordionBar.jsx:29:48 | error | react/prop-types | 'course._id' is missing in props validation |
| frontend/src/components/core/Course/CourseAccordionBar.jsx:33:35 | error | react/prop-types | 'isActive.includes' is missing in props validation |
| frontend/src/components/core/Course/CourseAccordionBar.jsx:33:51 | error | react/prop-types | 'course._id' is missing in props validation |
| frontend/src/components/core/Course/CourseAccordionBar.jsx:37:25 | error | react/prop-types | 'course.sectionName' is missing in props validation |
| frontend/src/components/core/Course/CourseAccordionBar.jsx:41:26 | error | react/prop-types | 'course.subSection' is missing in props validation |
| frontend/src/components/core/Course/CourseAccordionBar.jsx:41:37 | error | react/prop-types | 'course.subSection.length' is missing in props validation |
| frontend/src/components/core/Course/CourseAccordionBar.jsx:53:20 | error | react/prop-types | 'course.subSection' is missing in props validation |
| frontend/src/components/core/Course/CourseAccordionBar.jsx:53:32 | error | react/prop-types | 'course.subSection.map' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:17:30 | error | react/prop-types | 'course' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:17:38 | error | react/prop-types | 'setConfirmationModal' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:17:60 | error | react/prop-types | 'handleBuyCourse' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:17:60 | error | no-unused-vars | 'handleBuyCourse' is defined but never used. |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:24:5 | error | react/prop-types | 'course.thumbnail' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:25:5 | error | react/prop-types | 'course.price' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:26:5 | error | react/prop-types | 'course._id' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:30:18 | error | react/prop-types | 'course._id' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:36:21 | error | react/prop-types | 'course.courseName' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:37:20 | error | react/prop-types | 'course.courseDescription' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:61:9 | error | no-unused-vars | 'handleAddToCart' is assigned a value but never used. |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:88:18 | error | react/prop-types | 'course._id' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:118:24 | error | react/prop-types | 'course.courseName' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:124:22 | error | react/prop-types | 'course.courseType' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:137:21 | error | react/prop-types | 'course.averageRating' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:137:50 | error | react/prop-types | 'course.totalRatings' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:140:26 | error | react/prop-types | 'course.averageRating' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:142:50 | error | react/prop-types | 'course.averageRating' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:144:27 | error | react/prop-types | 'course.totalRatings' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:151:25 | error | react/prop-types | 'course.courseType' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:155:24 | error | react/prop-types | 'course.courseType' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:163:36 | error | react/prop-types | 'course._id' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:170:23 | error | react/prop-types | 'course.instructor' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:170:35 | error | react/prop-types | 'course.instructor._id' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:174:38 | error | react/prop-types | 'course._id' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:180:73 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:181:82 | error | react/prop-types | 'course.instructor' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:181:94 | error | react/prop-types | 'course.instructor.firstName' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:181:114 | error | react/prop-types | 'course.instructor' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:181:126 | error | react/prop-types | 'course.instructor.lastName' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:186:21 | error | react/prop-types | 'course.courseType' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:190:35 | error | react/prop-types | 'course.studentsEnrolled' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:190:53 | error | react/prop-types | 'course.studentsEnrolled.includes' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:195:34 | error | react/prop-types | 'course.studentsEnrolled' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:195:52 | error | react/prop-types | 'course.studentsEnrolled.includes' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:204:37 | error | react/prop-types | 'course.studentsEnrolled' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:204:55 | error | react/prop-types | 'course.studentsEnrolled.includes' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:208:38 | error | react/prop-types | 'course._id' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:210:36 | error | react/prop-types | 'course.studentsEnrolled' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:210:54 | error | react/prop-types | 'course.studentsEnrolled.includes' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:225:24 | error | react/prop-types | 'course.instructions' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:225:47 | error | react/prop-types | 'course.instructions' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:225:60 | error | react/prop-types | 'course.instructions.length' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:226:24 | error | react/prop-types | 'course.instructions' is missing in props validation |
| frontend/src/components/core/Course/CourseDetailsCard.jsx:226:37 | error | react/prop-types | 'course.instructions.map' is missing in props validation |
| frontend/src/components/core/Course/CourseSubSectionAccordion.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/Course/CourseSubSectionAccordion.jsx:1:17 | error | no-unused-vars | 'useEffect' is defined but never used. |
| frontend/src/components/core/Course/CourseSubSectionAccordion.jsx:1:28 | error | no-unused-vars | 'useRef' is defined but never used. |
| frontend/src/components/core/Course/CourseSubSectionAccordion.jsx:1:36 | error | no-unused-vars | 'useState' is defined but never used. |
| frontend/src/components/core/Course/CourseSubSectionAccordion.jsx:2:10 | error | no-unused-vars | 'AiOutlineDown' is defined but never used. |
| frontend/src/components/core/Course/CourseSubSectionAccordion.jsx:5:38 | error | react/prop-types | 'subSec' is missing in props validation |
| frontend/src/components/core/Course/CourseSubSectionAccordion.jsx:13:23 | error | react/prop-types | 'subSec.title' is missing in props validation |
| frontend/src/components/core/Dashboard/AccessRequests.jsx:19:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fetchRequests'. Either include it or remove the dependency array. |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/CourseBuilderForm.jsx:1:10 | error | no-unused-vars | 'useState' is defined but never used. |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/CourseBuilderForm.jsx:1:20 | error | no-unused-vars | 'useEffect' is defined but never used. |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/CourseBuilderForm.jsx:2:10 | error | no-unused-vars | 'useForm' is defined but never used. |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/CourseBuilderForm.jsx:4:10 | error | no-unused-vars | 'IoAddCircleOutline' is defined but never used. |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/CourseBuilderForm.jsx:8:10 | error | no-unused-vars | 'createSection' is defined but never used. |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/CourseBuilderForm.jsx:8:25 | error | no-unused-vars | 'updateSection' is defined but never used. |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/CourseBuilderForm.jsx:8:40 | error | no-unused-vars | 'createSubSection' is defined but never used. |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/CourseBuilderForm.jsx:8:58 | error | no-unused-vars | 'updateSubSection' is defined but never used. |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/CourseBuilderForm.jsx:8:76 | error | no-unused-vars | 'deleteSubSection' is defined but never used. |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/CourseBuilderForm.jsx:8:94 | error | no-unused-vars | 'deleteSection' is defined but never used. |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/CourseBuilderForm.jsx:8:109 | error | no-unused-vars | 'getFullDetailsOfCourse' is defined but never used. |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/NestedView.jsx:18:38 | error | react/prop-types | 'handleChangeEditSectionName' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/QuizForm.jsx:5:36 | error | react/prop-types | 'register' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/QuizForm.jsx:5:36 | error | no-unused-vars | 'register' is defined but never used. |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/QuizForm.jsx:5:46 | error | react/prop-types | 'setValue' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/QuizForm.jsx:5:56 | error | react/prop-types | 'getValues' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/QuizForm.jsx:5:56 | error | no-unused-vars | 'getValues' is defined but never used. |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/QuizForm.jsx:5:67 | error | react/prop-types | 'errors' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/QuizForm.jsx:5:67 | error | no-unused-vars | 'errors' is defined but never used. |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/QuizForm.jsx:5:75 | error | react/prop-types | 'watch' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/QuizForm.jsx:5:75 | error | no-unused-vars | 'watch' is defined but never used. |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/QuizForm.jsx:28:9 | error | no-unused-vars | 'handleMatchOptionChange' is assigned a value but never used. |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/SubSectionModal.jsx:15:43 | error | react/prop-types | 'modalData' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/SubSectionModal.jsx:15:54 | error | react/prop-types | 'setModalData' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/SubSectionModal.jsx:15:68 | error | react/prop-types | 'add' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/SubSectionModal.jsx:15:81 | error | react/prop-types | 'view' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/SubSectionModal.jsx:15:95 | error | react/prop-types | 'edit' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/SubSectionModal.jsx:34:34 | error | react/prop-types | 'modalData._id' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/SubSectionModal.jsx:35:30 | error | react/prop-types | 'modalData.videoUrl' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/SubSectionModal.jsx:36:27 | error | react/prop-types | 'modalData.title' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/SubSectionModal.jsx:38:42 | error | react/prop-types | 'modalData.title' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/SubSectionModal.jsx:39:41 | error | react/prop-types | 'modalData.description' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/SubSectionModal.jsx:40:42 | error | react/prop-types | 'modalData.videoUrl' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/SubSectionModal.jsx:42:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has missing dependencies: 'edit', 'modalData', 'setValue', and 'view'. Either include them or remove the dependency array. |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/SubSectionModal.jsx:49:67 | error | react/prop-types | 'modalData.title' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/SubSectionModal.jsx:50:65 | error | react/prop-types | 'modalData.description' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/SubSectionModal.jsx:54:97 | error | react/prop-types | 'modalData.videoUrl' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/SubSectionModal.jsx:61:32 | error | react/prop-types | 'modalData.videoUrl' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/SubSectionModal.jsx:77:46 | error | react/prop-types | 'modalData.sectionId' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/SubSectionModal.jsx:78:49 | error | react/prop-types | 'modalData._id' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/SubSectionModal.jsx:81:52 | error | react/prop-types | 'modalData.title' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/SubSectionModal.jsx:86:51 | error | react/prop-types | 'modalData.description' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/SubSectionModal.jsx:102:59 | error | react/prop-types | 'modalData.videoUrl' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/SubSectionModal.jsx:118:37 | error | react/prop-types | 'modalData.sectionId' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/SubSectionModal.jsx:284:40 | error | react/prop-types | 'modalData.videoUrl' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/SubSectionModal.jsx:285:40 | error | react/prop-types | 'modalData.videoUrl' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/SubSectionModal.jsx:286:56 | error | react/prop-types | 'modalData._id' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseBuilder/SubSectionModal.jsx:286:72 | error | react/prop-types | 'modalData._id' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseInformation/ChipInput.jsx:7:37 | error | react/prop-types | 'label' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseInformation/ChipInput.jsx:7:44 | error | react/prop-types | 'name' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseInformation/ChipInput.jsx:7:50 | error | react/prop-types | 'placeholder' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseInformation/ChipInput.jsx:7:63 | error | react/prop-types | 'register' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseInformation/ChipInput.jsx:7:73 | error | react/prop-types | 'errors' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseInformation/ChipInput.jsx:7:81 | error | react/prop-types | 'setValue' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseInformation/ChipInput.jsx:7:91 | error | react/prop-types | 'initialData' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseInformation/ChipInput.jsx:27:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has missing dependencies: 'name' and 'register'. Either include them or remove the dependency array. If 'register' changes too often, find the parent component that defines it and wrap that definition in useCallback. |
| frontend/src/components/core/Dashboard/AddCourse/CourseInformation/ChipInput.jsx:32:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has missing dependencies: 'name' and 'setValue'. Either include them or remove the dependency array. If 'setValue' changes too often, find the parent component that defines it and wrap that definition in useCallback. |
| frontend/src/components/core/Dashboard/AddCourse/CourseInformation/CourseInformationForm.jsx:70:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has missing dependencies: 'course.category', 'course.certificateEnabled', 'course.courseDescription', 'course.courseName', 'course.instructions', 'course.instructor', 'course.price', 'course.tag', 'course.thumbnail', 'course.whatYouWillLearn', 'editCourse', 'setValue', 'token', and 'user?.accountType'. Either include them or remove the dependency array. |
| frontend/src/components/core/Dashboard/AddCourse/CourseInformation/RequirementField.jsx:9:45 | error | react/prop-types | 'name' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseInformation/RequirementField.jsx:9:51 | error | react/prop-types | 'label' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseInformation/RequirementField.jsx:9:58 | error | react/prop-types | 'register' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseInformation/RequirementField.jsx:9:68 | error | react/prop-types | 'setValue' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseInformation/RequirementField.jsx:9:78 | error | react/prop-types | 'errors' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseInformation/RequirementField.jsx:9:86 | error | react/prop-types | 'initialData' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/CourseInformation/RequirementField.jsx:28:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has missing dependencies: 'name' and 'register'. Either include them or remove the dependency array. If 'register' changes too often, find the parent component that defines it and wrap that definition in useCallback. |
| frontend/src/components/core/Dashboard/AddCourse/CourseInformation/RequirementField.jsx:32:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has missing dependencies: 'name' and 'setValue'. Either include them or remove the dependency array. If 'setValue' changes too often, find the parent component that defines it and wrap that definition in useCallback. |
| frontend/src/components/core/Dashboard/AddCourse/DocumentUpload.jsx:4:10 | error | no-unused-vars | 'toast' is defined but never used. |
| frontend/src/components/core/Dashboard/AddCourse/DocumentUpload.jsx:7:3 | error | react/prop-types | 'name' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/DocumentUpload.jsx:8:3 | error | react/prop-types | 'label' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/DocumentUpload.jsx:9:3 | error | react/prop-types | 'register' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/DocumentUpload.jsx:10:3 | error | react/prop-types | 'setValue' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/DocumentUpload.jsx:11:3 | error | react/prop-types | 'errors' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/DocumentUpload.jsx:12:3 | error | react/prop-types | 'viewData' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/DocumentUpload.jsx:13:3 | error | react/prop-types | 'editData' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/DocumentUpload.jsx:14:3 | error | react/prop-types | 'documentType' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/DocumentUpload.jsx:129:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'name'. Either include it or remove the dependency array. |
| frontend/src/components/core/Dashboard/AddCourse/PublishCourse/index.jsx:24:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has missing dependencies: 'course?.status' and 'setValue'. Either include them or remove the dependency array. |
| frontend/src/components/core/Dashboard/AddCourse/PublishCourse/index.jsx:61:21 | error | no-unused-vars | 'data' is defined but never used. |
| frontend/src/components/core/Dashboard/AddCourse/RenderSteps.jsx:8:8 | error | no-unused-vars | 'EditCourse' is defined but never used. |
| frontend/src/components/core/Dashboard/AddCourse/Upload.jsx:11:34 | error | react/prop-types | 'name' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/Upload.jsx:11:40 | error | react/prop-types | 'label' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/Upload.jsx:11:47 | error | react/prop-types | 'register' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/Upload.jsx:11:57 | error | react/prop-types | 'setValue' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/Upload.jsx:11:67 | error | react/prop-types | 'errors' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/Upload.jsx:11:75 | error | react/prop-types | 'video' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/Upload.jsx:11:90 | error | react/prop-types | 'viewData' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/Upload.jsx:11:107 | error | react/prop-types | 'editData' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/Upload.jsx:11:124 | error | react/prop-types | 'setImageFile' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/Upload.jsx:11:145 | error | react/prop-types | 'subSectionId' is missing in props validation |
| frontend/src/components/core/Dashboard/AddCourse/Upload.jsx:808:51 | error | react/no-unescaped-entities | `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. |
| frontend/src/components/core/Dashboard/AddCourse/Upload.jsx:808:68 | error | react/no-unescaped-entities | `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. |
| frontend/src/components/core/Dashboard/AdminQuizAnalytics.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/Dashboard/AdminQuizAnalytics.jsx:164:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fetchAnalyticsData'. Either include it or remove the dependency array. |
| frontend/src/components/core/Dashboard/AdminQuizAnalytics.jsx:681:36 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/components/core/Dashboard/AdminQuizAnalytics.jsx:879:68 | error | no-unused-vars | 'index' is defined but never used. |
| frontend/src/components/core/Dashboard/AdminQuizAnalytics.jsx:1212:18 | error | no-undef | 'process' is not defined. |
| frontend/src/components/core/Dashboard/Admin/AdminDashboard.jsx:11:10 | error | no-unused-vars | 'loading' is assigned a value but never used. |
| frontend/src/components/core/Dashboard/Admin/AdminDashboard.jsx:16:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fetchAnalytics'. Either include it or remove the dependency array. |
| frontend/src/components/core/Dashboard/Admin/AdminSidebar.jsx:15:8 | error | no-unused-vars | 'NotificationBadge' is defined but never used. |
| frontend/src/components/core/Dashboard/Admin/AdminSidebar.jsx:17:25 | error | react/prop-types | 'activeTab' is missing in props validation |
| frontend/src/components/core/Dashboard/Admin/AdminSidebar.jsx:17:36 | error | react/prop-types | 'onTabChange' is missing in props validation |
| frontend/src/components/core/Dashboard/Admin/AdminSidebar.jsx:125:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fetchNotificationCounts'. Either include it or remove the dependency array. |
| frontend/src/components/core/Dashboard/Admin/BulkUserActions.jsx:4:67 | error | no-unused-vars | 'bulkRestoreUsers' is defined but never used. |
| frontend/src/components/core/Dashboard/Admin/BulkUserActions.jsx:153:26 | error | react/prop-types | 'userId' is missing in props validation |
| frontend/src/components/core/Dashboard/Admin/BulkUserUpload.jsx:26:42 | error | react/prop-types | 'onSuccess' is missing in props validation |
| frontend/src/components/core/Dashboard/Admin/BulkUserUpload.jsx:233:70 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/components/core/Dashboard/Admin/ContactMessages.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/Dashboard/Admin/ContactMessages.jsx:23:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has missing dependencies: 'fetchMessages' and 'fetchStats'. Either include them or remove the dependency array. |
| frontend/src/components/core/Dashboard/Admin/ContactMessages.jsx:278:31 | error | react/no-unescaped-entities | `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. |
| frontend/src/components/core/Dashboard/Admin/ContactMessages.jsx:278:44 | error | react/no-unescaped-entities | `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. |
| frontend/src/components/core/Dashboard/Admin/ContactMessages.jsx:281:34 | error | react/no-unescaped-entities | `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. |
| frontend/src/components/core/Dashboard/Admin/ContactMessages.jsx:281:49 | error | react/no-unescaped-entities | `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. |
| frontend/src/components/core/Dashboard/Admin/CourseAccessRequests.jsx:19:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fetchAccessRequests'. Either include it or remove the dependency array. |
| frontend/src/components/core/Dashboard/Admin/CourseTypeManager.jsx:1:31 | error | no-unused-vars | 'useCallback' is defined but never used. |
| frontend/src/components/core/Dashboard/Admin/CourseTypeManager.jsx:1:44 | error | no-unused-vars | 'useMemo' is defined but never used. |
| frontend/src/components/core/Dashboard/Admin/CourseTypeManager.jsx:3:18 | error | no-unused-vars | 'FiUser' is defined but never used. |
| frontend/src/components/core/Dashboard/Admin/CourseTypeManager.jsx:3:47 | error | no-unused-vars | 'FiSettings' is defined but never used. |
| frontend/src/components/core/Dashboard/Admin/CourseTypeManager.jsx:3:79 | error | no-unused-vars | 'FiCalendar' is defined but never used. |
| frontend/src/components/core/Dashboard/Admin/CourseTypeManager.jsx:3:91 | error | no-unused-vars | 'FiChevronLeft' is defined but never used. |
| frontend/src/components/core/Dashboard/Admin/CourseTypeManager.jsx:3:106 | error | no-unused-vars | 'FiChevronRight' is defined but never used. |
| frontend/src/components/core/Dashboard/Admin/CourseTypeManager.jsx:5:10 | error | no-unused-vars | 'formatDate' is defined but never used. |
| frontend/src/components/core/Dashboard/Admin/CourseTypeManager.jsx:5:22 | error | no-unused-vars | 'getRelativeTime' is defined but never used. |
| frontend/src/components/core/Dashboard/Admin/CourseTypeManager.jsx:19:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fetchCourses'. Either include it or remove the dependency array. |
| frontend/src/components/core/Dashboard/Admin/PaymentReports.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/Dashboard/Admin/PaymentReports.jsx:3:32 | error | no-unused-vars | 'FaSearch' is defined but never used. |
| frontend/src/components/core/Dashboard/Admin/PaymentReports.jsx:17:9 | error | no-unused-vars | 'invoiceRef' is assigned a value but never used. |
| frontend/src/components/core/Dashboard/Admin/PaymentReports.jsx:35:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fetchReports'. Either include it or remove the dependency array. |
| frontend/src/components/core/Dashboard/Admin/PaymentReports.jsx:157:9 | error | no-unused-vars | 'handlePrintInvoice' is assigned a value but never used. |
| frontend/src/components/core/Dashboard/Admin/Table.jsx:1:25 | error | react/prop-types | 'children' is missing in props validation |
| frontend/src/components/core/Dashboard/Admin/Table.jsx:17:25 | error | react/prop-types | 'children' is missing in props validation |
| frontend/src/components/core/Dashboard/Admin/Table.jsx:25:25 | error | react/prop-types | 'children' is missing in props validation |
| frontend/src/components/core/Dashboard/Admin/Table.jsx:33:22 | error | react/prop-types | 'children' is missing in props validation |
| frontend/src/components/core/Dashboard/Admin/Table.jsx:41:22 | error | react/prop-types | 'children' is missing in props validation |
| frontend/src/components/core/Dashboard/Admin/Table.jsx:52:22 | error | react/prop-types | 'children' is missing in props validation |
| frontend/src/components/core/Dashboard/AssignmentDetail.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/Dashboard/AssignmentDetail.jsx:4:78 | error | no-unused-vars | 'FiUser' is defined but never used. |
| frontend/src/components/core/Dashboard/AssignmentDetail.jsx:10:44 | error | react/prop-types | 'assignmentIdProp' is missing in props validation |
| frontend/src/components/core/Dashboard/AssignmentDetail.jsx:10:62 | error | react/prop-types | 'inModal' is missing in props validation |
| frontend/src/components/core/Dashboard/AssignmentDetail.jsx:10:79 | error | react/prop-types | 'onClose' is missing in props validation |
| frontend/src/components/core/Dashboard/AssignmentDetail.jsx:27:8 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fetchAssignmentDetails'. Either include it or remove the dependency array. |
| frontend/src/components/core/Dashboard/AssignmentDetail.jsx:173:69 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/components/core/Dashboard/AssignmentDetail.jsx:173:90 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/components/core/Dashboard/AssignmentDetail.jsx:173:109 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/components/core/Dashboard/AssignmentDetailModal.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/Dashboard/AssignmentDetailModal.jsx:5:49 | error | react/prop-types | 'assignmentId' is missing in props validation |
| frontend/src/components/core/Dashboard/AssignmentDetailModal.jsx:5:63 | error | react/prop-types | 'onClose' is missing in props validation |
| frontend/src/components/core/Dashboard/Cart/Cart.jsx:113:47 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/components/core/Dashboard/Cart/CouponInput.jsx:7:39 | error | react/prop-types | 'totalAmount' is missing in props validation |
| frontend/src/components/core/Dashboard/Cart/CouponInput.jsx:7:52 | error | react/prop-types | 'onCouponApply' is missing in props validation |
| frontend/src/components/core/Dashboard/Cart/CouponInput.jsx:7:67 | error | react/prop-types | 'checkoutType' is missing in props validation |
| frontend/src/components/core/Dashboard/Cart/CouponInput.jsx:14:10 | error | no-unused-vars | 'pricePreview' is assigned a value but never used. |
| frontend/src/components/core/Dashboard/Cart/RenderCartCourses.jsx:3:10 | error | no-unused-vars | 'FiClock' is defined but never used. |
| frontend/src/components/core/Dashboard/Cart/RenderCartCourses.jsx:15:26 | error | no-unused-vars | 'indx' is defined but never used. |
| frontend/src/components/core/Dashboard/Cart/RenderTotalAmount.jsx:8:10 | error | no-unused-vars | 'FiCreditCard' is defined but never used. |
| frontend/src/components/core/Dashboard/Cart/RenderTotalAmount.jsx:8:24 | error | no-unused-vars | 'FiShield' is defined but never used. |
| frontend/src/components/core/Dashboard/Cart/RenderTotalAmount.jsx:8:34 | error | no-unused-vars | 'FiZap' is defined but never used. |
| frontend/src/components/core/Dashboard/Cart/RenderTotalAmount.jsx:8:41 | error | no-unused-vars | 'FiGift' is defined but never used. |
| frontend/src/components/core/Dashboard/Cart/RenderTotalAmount.jsx:45:9 | error | no-unused-vars | 'originalPrice' is assigned a value but never used. |
| frontend/src/components/core/Dashboard/CoursePerformanceReport.jsx:4:18 | error | no-unused-vars | 'AnimatePresence' is defined but never used. |
| frontend/src/components/core/Dashboard/CoursePerformanceReport.jsx:11:7 | error | no-unused-vars | 'styles' is assigned a value but never used. |
| frontend/src/components/core/Dashboard/CoursePerformanceReport.jsx:111:9 | error | no-unused-vars | 'isNewAttempt' is assigned a value but never used. |
| frontend/src/components/core/Dashboard/CoursePerformanceReport.jsx:349:54 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/components/core/Dashboard/CoursePerformanceReport.jsx:645:57 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/components/core/Dashboard/CreateAssignment.jsx:32:8 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fetchCourses'. Either include it or remove the dependency array. |
| frontend/src/components/core/Dashboard/CreateAssignment.jsx:43:8 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fetchCourseSections'. Either include it or remove the dependency array. |
| frontend/src/components/core/Dashboard/CreateAssignment.jsx:56:8 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'sections'. Either include it or remove the dependency array. |
| frontend/src/components/core/Dashboard/DynamicMarksheet.jsx:15:10 | error | no-unused-vars | 'error' is assigned a value but never used. |
| frontend/src/components/core/Dashboard/DynamicMarksheet.jsx:20:10 | error | no-unused-vars | 'dateRange' is assigned a value but never used. |
| frontend/src/components/core/Dashboard/DynamicMarksheet.jsx:20:21 | error | no-unused-vars | 'setDateRange' is assigned a value but never used. |
| frontend/src/components/core/Dashboard/DynamicMarksheet.jsx:23:10 | error | no-unused-vars | 'comparisonView' is assigned a value but never used. |
| frontend/src/components/core/Dashboard/DynamicMarksheet.jsx:23:26 | error | no-unused-vars | 'setComparisonView' is assigned a value but never used. |
| frontend/src/components/core/Dashboard/DynamicMarksheet.jsx:130:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fetchMarksheetData'. Either include it or remove the dependency array. |
| frontend/src/components/core/Dashboard/DynamicMarksheet.jsx:141:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fetchMarksheetData'. Either include it or remove the dependency array. |
| frontend/src/components/core/Dashboard/EditCourse/EditCourse.jsx:36:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has missing dependencies: 'courseId', 'dispatch', and 'token'. Either include them or remove the dependency array. |
| frontend/src/components/core/Dashboard/EnrolledCourses.jsx:8:8 | error | no-unused-vars | 'IconBtn' is defined but never used. |
| frontend/src/components/core/Dashboard/EnrolledCourses.jsx:121:53 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/components/core/Dashboard/Instructor.jsx:27:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has missing dependencies: 'token' and 'user?.accountType'. Either include them or remove the dependency array. |
| frontend/src/components/core/Dashboard/Instructor.jsx:64:14 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/components/core/Dashboard/Instructor.jsx:188:22 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/components/core/Dashboard/InstructorAssignments.jsx:17:8 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fetchAssignments'. Either include it or remove the dependency array. |
| frontend/src/components/core/Dashboard/InstructorCourses/CoursesTable.jsx:1:10 | error | no-unused-vars | 'useDispatch' is defined but never used. |
| frontend/src/components/core/Dashboard/InstructorCourses/CoursesTable.jsx:4:10 | error | no-unused-vars | 'useState' is defined but never used. |
| frontend/src/components/core/Dashboard/InstructorCourses/CoursesTable.jsx:20:40 | error | react/prop-types | 'courses' is missing in props validation |
| frontend/src/components/core/Dashboard/InstructorCourses/CoursesTable.jsx:20:49 | error | react/prop-types | 'setCourses' is missing in props validation |
| frontend/src/components/core/Dashboard/InstructorCourses/CoursesTable.jsx:20:61 | error | react/prop-types | 'loading' is missing in props validation |
| frontend/src/components/core/Dashboard/InstructorCourses/CoursesTable.jsx:20:70 | error | react/prop-types | 'setLoading' is missing in props validation |
| frontend/src/components/core/Dashboard/InstructorCourses/CoursesTable.jsx:109:33 | error | react/prop-types | 'courses.length' is missing in props validation |
| frontend/src/components/core/Dashboard/InstructorCourses/CoursesTable.jsx:117:24 | error | react/prop-types | 'courses.map' is missing in props validation |
| frontend/src/components/core/Dashboard/InstructorCreateQuiz.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/Dashboard/InstructorCreateQuiz.jsx:30:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fetchInstructorCourses'. Either include it or remove the dependency array. |
| frontend/src/components/core/Dashboard/InstructorCreateQuiz.jsx:39:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fetchCourseSections'. Either include it or remove the dependency array. |
| frontend/src/components/core/Dashboard/InstructorCreateQuiz.jsx:47:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fetchSectionSubSections'. Either include it or remove the dependency array. |
| frontend/src/components/core/Dashboard/InstructorCreateQuiz.jsx:54:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fetchExistingQuiz'. Either include it or remove the dependency array. |
| frontend/src/components/core/Dashboard/InstructorCreateQuiz.jsx:357:30 | error | no-unused-vars | 'result' is defined but never used. |
| frontend/src/components/core/Dashboard/InstructorDashboard/InstructorChart.jsx:7:43 | error | react/prop-types | 'courses' is missing in props validation |
| frontend/src/components/core/Dashboard/InstructorDashboard/InstructorChart.jsx:26:21 | error | react/prop-types | 'courses.map' is missing in props validation |
| frontend/src/components/core/Dashboard/InstructorDashboard/InstructorChart.jsx:29:23 | error | react/prop-types | 'courses.map' is missing in props validation |
| frontend/src/components/core/Dashboard/InstructorDashboard/InstructorChart.jsx:30:55 | error | react/prop-types | 'courses.length' is missing in props validation |
| frontend/src/components/core/Dashboard/InstructorDashboard/InstructorChart.jsx:31:51 | error | react/prop-types | 'courses.length' is missing in props validation |
| frontend/src/components/core/Dashboard/InstructorDashboard/InstructorChart.jsx:38:21 | error | react/prop-types | 'courses.map' is missing in props validation |
| frontend/src/components/core/Dashboard/InstructorDashboard/InstructorChart.jsx:41:23 | error | react/prop-types | 'courses.map' is missing in props validation |
| frontend/src/components/core/Dashboard/InstructorDashboard/InstructorChart.jsx:42:55 | error | react/prop-types | 'courses.length' is missing in props validation |
| frontend/src/components/core/Dashboard/InstructorDashboard/InstructorChart.jsx:43:51 | error | react/prop-types | 'courses.length' is missing in props validation |
| frontend/src/components/core/Dashboard/InstructorDashboard/InstructorChart.jsx:131:25 | error | react/prop-types | 'courses.reduce' is missing in props validation |
| frontend/src/components/core/Dashboard/InstructorDashboard/InstructorChart.jsx:132:29 | error | react/prop-types | 'courses.reduce' is missing in props validation |
| frontend/src/components/core/Dashboard/InstructorDashboard/InstructorChart.jsx:138:68 | error | react/prop-types | 'courses.length' is missing in props validation |
| frontend/src/components/core/Dashboard/InstructorQuizAnalytics.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/Dashboard/InstructorQuizAnalytics.jsx:22:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fetchQuizAnalytics'. Either include it or remove the dependency array. |
| frontend/src/components/core/Dashboard/InstructorQuizAnalytics.jsx:133:40 | error | react/no-unescaped-entities | `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. |
| frontend/src/components/core/Dashboard/InstructorQuizAnalytics.jsx:133:53 | error | react/no-unescaped-entities | `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. |
| frontend/src/components/core/Dashboard/InstructorQuizAnalytics.jsx:305:29 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/components/core/Dashboard/InstructorQuizManagement.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/Dashboard/InstructorQuizManagement.jsx:12:11 | error | no-unused-vars | 'user' is assigned a value but never used. |
| frontend/src/components/core/Dashboard/InstructorQuizManagement.jsx:21:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fetchInstructorCourses'. Either include it or remove the dependency array. |
| frontend/src/components/core/Dashboard/InstructorZoomAttendance.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/Dashboard/InstructorZoomAttendance.jsx:2:76 | error | no-unused-vars | 'FaUserTimes' is defined but never used. |
| frontend/src/components/core/Dashboard/InstructorZoomAttendance.jsx:16:9 | error | no-unused-vars | 'hasMeetingStarted' is assigned a value but never used. |
| frontend/src/components/core/Dashboard/InstructorZoomAttendance.jsx:48:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has missing dependencies: 'fetchCourseAttendance' and 'fetchMeetings'. Either include them or remove the dependency array. |
| frontend/src/components/core/Dashboard/InstructorZoomAttendance.jsx:54:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fetchMeetingAttendance'. Either include it or remove the dependency array. |
| frontend/src/components/core/Dashboard/InstructorZoomAttendance.jsx:205:9 | error | no-unused-vars | 'getAttendanceColor' is assigned a value but never used. |
| frontend/src/components/core/Dashboard/InstructorZoomDashboard.jsx:86:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fetchMeetings'. Either include it or remove the dependency array. |
| frontend/src/components/core/Dashboard/InstructorZoomDashboard.jsx:93:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fetchCourses'. Either include it or remove the dependency array. |
| frontend/src/components/core/Dashboard/MyCourses.jsx:2:10 | error | no-unused-vars | 'VscAdd' is defined but never used. |
| frontend/src/components/core/Dashboard/MyCourses.jsx:7:8 | error | no-unused-vars | 'IconBtn' is defined but never used. |
| frontend/src/components/core/Dashboard/MyCourses.jsx:15:9 | error | no-unused-vars | 'navigate' is assigned a value but never used. |
| frontend/src/components/core/Dashboard/MyCourses.jsx:30:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has missing dependencies: 'token' and 'user?.accountType'. Either include them or remove the dependency array. |
| frontend/src/components/core/Dashboard/MyProfile.jsx:3:10 | error | no-unused-vars | 'formatDate' is defined but never used. |
| frontend/src/components/core/Dashboard/MyProfile.jsx:117:23 | error | react/prop-types | 'label' is missing in props validation |
| frontend/src/components/core/Dashboard/MyProfile.jsx:117:30 | error | react/prop-types | 'value' is missing in props validation |
| frontend/src/components/core/Dashboard/MyProfile.jsx:117:37 | error | react/prop-types | 'icon' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:4:40 | error | react/prop-types | 'order' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:4:47 | error | react/prop-types | 'onClose' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:14:36 | error | react/prop-types | 'order.transactionId' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:169:37 | error | react/prop-types | 'order.user' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:169:43 | error | react/prop-types | 'order.user.firstName' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:169:68 | error | react/prop-types | 'order.user' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:169:74 | error | react/prop-types | 'order.user.lastName' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:173:34 | error | react/prop-types | 'order.user' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:173:40 | error | react/prop-types | 'order.user.email' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:174:34 | error | react/prop-types | 'order.user' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:174:40 | error | react/prop-types | 'order.user.additionalDetails' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:174:59 | error | react/prop-types | 'order.user.additionalDetails.contactNumber' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:183:37 | error | react/prop-types | 'order.invoiceNumber' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:183:67 | error | react/prop-types | 'order._id' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:183:71 | error | react/prop-types | 'order._id.slice' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:187:46 | error | react/prop-types | 'order.purchaseDate' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:217:36 | error | react/prop-types | 'order.course' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:217:44 | error | react/prop-types | 'order.course.courseName' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:218:86 | error | react/prop-types | 'order.course' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:218:94 | error | react/prop-types | 'order.course.instructor' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:218:106 | error | react/prop-types | 'order.course.instructor.firstName' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:224:36 | error | react/prop-types | 'order.originalPrice' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:224:69 | error | react/prop-types | 'order.originalPrice' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:224:94 | error | react/prop-types | 'order.amount' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:224:131 | error | react/prop-types | 'order.amount' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:227:36 | error | react/prop-types | 'order.originalPrice' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:227:69 | error | react/prop-types | 'order.originalPrice' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:227:94 | error | react/prop-types | 'order.amount' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:227:131 | error | react/prop-types | 'order.amount' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:235:34 | error | react/prop-types | 'order.couponUsed' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:235:46 | error | react/prop-types | 'order.couponUsed.code' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:235:60 | error | react/prop-types | 'order.discountAmount' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:238:36 | error | react/prop-types | 'order.originalPrice' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:238:69 | error | react/prop-types | 'order.originalPrice' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:238:94 | error | react/prop-types | 'order.amount' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:238:131 | error | react/prop-types | 'order.amount' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:239:34 | error | react/prop-types | 'order.couponUsed' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:239:46 | error | react/prop-types | 'order.couponUsed.discountAmount' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:239:74 | error | react/prop-types | 'order.discountAmount' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:239:138 | error | react/prop-types | 'order.couponUsed' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:239:150 | error | react/prop-types | 'order.couponUsed.discountAmount' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:239:180 | error | react/prop-types | 'order.discountAmount' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:247:36 | error | react/prop-types | 'order.amount' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:247:73 | error | react/prop-types | 'order.amount' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:261:37 | error | react/prop-types | 'order.paymentMethod' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:265:37 | error | react/prop-types | 'order.transactionId' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:345:26 | error | react/prop-types | 'order.invoiceNumber' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:345:56 | error | react/prop-types | 'order._id' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:345:60 | error | react/prop-types | 'order._id.slice' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:374:31 | error | react/prop-types | 'order.user' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:374:37 | error | react/prop-types | 'order.user.firstName' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:374:62 | error | react/prop-types | 'order.user' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:374:68 | error | react/prop-types | 'order.user.lastName' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:376:63 | error | react/prop-types | 'order.user' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:376:69 | error | react/prop-types | 'order.user.additionalDetails' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:376:88 | error | react/prop-types | 'order.user.additionalDetails.contactNumber' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:377:63 | error | react/prop-types | 'order.user' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:377:69 | error | react/prop-types | 'order.user.email' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:391:75 | error | react/prop-types | 'order.invoiceNumber' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:391:105 | error | react/prop-types | 'order._id' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:391:109 | error | react/prop-types | 'order._id.slice' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:396:35 | error | react/prop-types | 'order.purchaseDate' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:405:85 | error | react/prop-types | 'order.transactionId' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:409:86 | error | react/prop-types | 'order.paymentMethod' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:443:76 | error | react/prop-types | 'order.course' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:443:84 | error | react/prop-types | 'order.course.courseName' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:445:91 | error | react/prop-types | 'order.course' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:445:99 | error | react/prop-types | 'order.course.instructor' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:445:111 | error | react/prop-types | 'order.course.instructor.firstName' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:452:74 | error | react/prop-types | 'order.originalPrice' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:452:104 | error | react/prop-types | 'order.originalPrice' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:452:129 | error | react/prop-types | 'order.amount' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:452:163 | error | react/prop-types | 'order.amount' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:455:72 | error | react/prop-types | 'order.originalPrice' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:455:102 | error | react/prop-types | 'order.originalPrice' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:455:127 | error | react/prop-types | 'order.amount' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:455:161 | error | react/prop-types | 'order.amount' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:460:27 | error | react/prop-types | 'order.discountAmount' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:460:55 | error | react/prop-types | 'order.couponUsed' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:460:67 | error | react/prop-types | 'order.couponUsed.discountAmount' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:464:79 | error | react/prop-types | 'order.originalPrice' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:464:102 | error | react/prop-types | 'order.amount' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:468:27 | error | react/prop-types | 'order.discountAmount' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:468:55 | error | react/prop-types | 'order.couponUsed' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:468:67 | error | react/prop-types | 'order.couponUsed.discountAmount' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:471:41 | error | react/prop-types | 'order.couponUsed' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:471:53 | error | react/prop-types | 'order.couponUsed.code' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:471:71 | error | react/prop-types | 'order.couponUsed' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:471:82 | error | react/prop-types | 'order.couponUsed.code' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:474:80 | error | react/prop-types | 'order.couponUsed' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:474:92 | error | react/prop-types | 'order.couponUsed.discountAmount' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:474:122 | error | react/prop-types | 'order.discountAmount' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:481:78 | error | react/prop-types | 'order.amount' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/InvoiceModal.jsx:481:112 | error | react/prop-types | 'order.amount' is missing in props validation |
| frontend/src/components/core/Dashboard/PurchaseHistory/PurchaseHistory.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/Dashboard/PurchaseHistory/PurchaseHistory.jsx:90:24 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/components/core/Dashboard/QuizPerformanceReport.jsx:172:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'attemptNumber'. Either include it or remove the dependency array. |
| frontend/src/components/core/Dashboard/QuizPerformanceReport.jsx:226:9 | error | no-unused-vars | 'failedAttempts' is assigned a value but never used. |
| frontend/src/components/core/Dashboard/ReportsManagement.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/Dashboard/ReportsManagement.jsx:26:10 | error | no-unused-vars | 'generatedReports' is assigned a value but never used. |
| frontend/src/components/core/Dashboard/ReportsManagement.jsx:26:28 | error | no-unused-vars | 'setGeneratedReports' is assigned a value but never used. |
| frontend/src/components/core/Dashboard/ReportsManagement.jsx:92:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fetchInitialData'. Either include it or remove the dependency array. |
| frontend/src/components/core/Dashboard/Settings/UpdatePassword.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/Dashboard/Sidebar.jsx:10:8 | error | no-unused-vars | 'Loading' is defined but never used. |
| frontend/src/components/core/Dashboard/Sidebar.jsx:14:10 | error | no-unused-vars | 'FiSettings' is defined but never used. |
| frontend/src/components/core/Dashboard/Sidebar.jsx:33:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'dispatch'. Either include it or remove the dependency array. |
| frontend/src/components/core/Dashboard/Sidebar.jsx:40:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'dispatch'. Either include it or remove the dependency array. |
| frontend/src/components/core/Dashboard/SidebarLink.jsx:7:39 | error | react/prop-types | 'link' is missing in props validation |
| frontend/src/components/core/Dashboard/SidebarLink.jsx:7:45 | error | react/prop-types | 'iconName' is missing in props validation |
| frontend/src/components/core/Dashboard/SidebarLink.jsx:7:55 | error | react/prop-types | 'isCollapsed' is missing in props validation |
| frontend/src/components/core/Dashboard/SidebarLink.jsx:12:84 | error | react/prop-types | 'link.name' is missing in props validation |
| frontend/src/components/core/Dashboard/SidebarLink.jsx:29:16 | error | react/prop-types | 'link.path' is missing in props validation |
| frontend/src/components/core/Dashboard/SidebarLink.jsx:38:33 | error | react/prop-types | 'link.name' is missing in props validation |
| frontend/src/components/core/Dashboard/SidebarLink.jsx:43:27 | error | react/prop-types | 'link.path' is missing in props validation |
| frontend/src/components/core/Dashboard/SidebarLink.jsx:54:53 | error | react/prop-types | 'link.name' is missing in props validation |
| frontend/src/components/core/Dashboard/SidebarLink.jsx:58:24 | error | react/prop-types | 'link.path' is missing in props validation |
| frontend/src/components/core/Dashboard/SidebarLink.jsx:65:17 | error | react/prop-types | 'link.name' is missing in props validation |
| frontend/src/components/core/Dashboard/StudentAssignments.jsx:21:8 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fetchAssignments'. Either include it or remove the dependency array. |
| frontend/src/components/core/Dashboard/StudentDetailsAnalysis.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/Dashboard/StudentDetailsAnalysis.jsx:29:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fetchStudentsData'. Either include it or remove the dependency array. |
| frontend/src/components/core/Dashboard/StudentDetailsAnalysis.jsx:78:30 | error | no-unused-vars | 'index' is defined but never used. |
| frontend/src/components/core/Dashboard/StudentQuizReport.jsx:6:10 | error | no-unused-vars | 'generateCourseMarksheetPDF' is defined but never used. |
| frontend/src/components/core/Dashboard/StudentQuizReport.jsx:30:31 | error | no-unused-vars | 'index' is defined but never used. |
| frontend/src/components/core/Dashboard/StudentQuizReport.jsx:337:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fetchData'. Either include it or remove the dependency array. |
| frontend/src/components/core/Dashboard/StudentQuizReport.jsx:1008:38 | error | no-unused-vars | 'index' is defined but never used. |
| frontend/src/components/core/Dashboard/StudentQuizReport.jsx:1031:38 | error | no-unused-vars | 'index' is defined but never used. |
| frontend/src/components/core/Dashboard/StudentQuizReport.jsx:1213:45 | error | no-unused-vars | 'index' is defined but never used. |
| frontend/src/components/core/Dashboard/StudentQuizReport.jsx:1279:55 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/components/core/Dashboard/StudentQuizReport.jsx:1410:68 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/components/core/Dashboard/StudentQuizReport.jsx:1422:77 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/components/core/Dashboard/StudentQuizReport_OLD.jsx:46:9 | error | no-unused-vars | 'getQuizStatsByCourse' is assigned a value but never used. |
| frontend/src/components/core/Dashboard/StudentQuizReport_OLD.jsx:112:55 | error | no-unused-vars | 'idx' is defined but never used. |
| frontend/src/components/core/Dashboard/StudentQuizReport_OLD.jsx:465:14 | error | react/no-unknown-property | Unknown property 'jsx' found |
| frontend/src/components/core/Dashboard/StudentQuizReport_OLD.jsx:707:55 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/components/core/Dashboard/StudentQuizReport_OLD.jsx:1489:113 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/components/core/Dashboard/StudentQuizReport_OLD.jsx:1489:125 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/components/core/Dashboard/SubmitAssignment.jsx:24:8 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fetchAssignment'. Either include it or remove the dependency array. |
| frontend/src/components/core/Dashboard/UserAnalytics.jsx:5:10 | error | no-unused-vars | 'Pie' is defined but never used. |
| frontend/src/components/core/Dashboard/UserAnalytics.jsx:5:21 | error | no-unused-vars | 'Bar' is defined but never used. |
| frontend/src/components/core/Dashboard/UserAnalytics.jsx:13:10 | error | no-unused-vars | 'activityData' is assigned a value but never used. |
| frontend/src/components/core/Dashboard/UserAnalytics.jsx:16:26 | error | no-unused-vars | 'setSelectedPeriod' is assigned a value but never used. |
| frontend/src/components/core/Dashboard/ViewSubmissions.jsx:4:36 | error | no-unused-vars | 'FiClock' is defined but never used. |
| frontend/src/components/core/Dashboard/ViewSubmissions.jsx:10:43 | error | react/prop-types | 'assignmentIdProp' is missing in props validation |
| frontend/src/components/core/Dashboard/ViewSubmissions.jsx:10:61 | error | react/prop-types | 'inModal' is missing in props validation |
| frontend/src/components/core/Dashboard/ViewSubmissions.jsx:10:78 | error | react/prop-types | 'onClose' is missing in props validation |
| frontend/src/components/core/Dashboard/ViewSubmissions.jsx:58:8 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fetchAssignmentAndSubmissions'. Either include it or remove the dependency array. |
| frontend/src/components/core/Dashboard/ViewSubmissions.jsx:186:69 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/components/core/HomePage/Button.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/HomePage/Button.jsx:4:18 | error | react/prop-types | 'children' is missing in props validation |
| frontend/src/components/core/HomePage/Button.jsx:4:28 | error | react/prop-types | 'active' is missing in props validation |
| frontend/src/components/core/HomePage/Button.jsx:4:36 | error | react/prop-types | 'linkto' is missing in props validation |
| frontend/src/components/core/HomePage/CodeBlocks.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/HomePage/CodeBlocks.jsx:7:5 | error | react/prop-types | 'position' is missing in props validation |
| frontend/src/components/core/HomePage/CodeBlocks.jsx:8:5 | error | react/prop-types | 'heading' is missing in props validation |
| frontend/src/components/core/HomePage/CodeBlocks.jsx:9:5 | error | react/prop-types | 'subheading' is missing in props validation |
| frontend/src/components/core/HomePage/CodeBlocks.jsx:10:5 | error | react/prop-types | 'ctabtn1' is missing in props validation |
| frontend/src/components/core/HomePage/CodeBlocks.jsx:11:5 | error | react/prop-types | 'ctabtn2' is missing in props validation |
| frontend/src/components/core/HomePage/CodeBlocks.jsx:12:5 | error | react/prop-types | 'codeblock' is missing in props validation |
| frontend/src/components/core/HomePage/CodeBlocks.jsx:13:5 | error | react/prop-types | 'backgroundGradient' is missing in props validation |
| frontend/src/components/core/HomePage/CodeBlocks.jsx:14:5 | error | react/prop-types | 'codeColor' is missing in props validation |
| frontend/src/components/core/HomePage/CodeBlocks.jsx:31:48 | error | react/prop-types | 'ctabtn1.active' is missing in props validation |
| frontend/src/components/core/HomePage/CodeBlocks.jsx:31:72 | error | react/prop-types | 'ctabtn1.link' is missing in props validation |
| frontend/src/components/core/HomePage/CodeBlocks.jsx:33:38 | error | react/prop-types | 'ctabtn1.btnText' is missing in props validation |
| frontend/src/components/core/HomePage/CodeBlocks.jsx:37:48 | error | react/prop-types | 'ctabtn2.active' is missing in props validation |
| frontend/src/components/core/HomePage/CodeBlocks.jsx:37:72 | error | react/prop-types | 'ctabtn2.link' is missing in props validation |
| frontend/src/components/core/HomePage/CodeBlocks.jsx:38:34 | error | react/prop-types | 'ctabtn2.btnText' is missing in props validation |
| frontend/src/components/core/HomePage/CourseCard.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/HomePage/CourseCard.jsx:4:10 | error | no-unused-vars | 'ImTree' is defined but never used. |
| frontend/src/components/core/HomePage/CourseCard.jsx:6:8 | error | no-unused-vars | 'RatingStars' is defined but never used. |
| frontend/src/components/core/HomePage/CourseCard.jsx:9:23 | error | react/prop-types | 'cardData' is missing in props validation |
| frontend/src/components/core/HomePage/CourseCard.jsx:9:33 | error | react/prop-types | 'currentCard' is missing in props validation |
| frontend/src/components/core/HomePage/CourseCard.jsx:9:46 | error | react/prop-types | 'setCurrentCard' is missing in props validation |
| frontend/src/components/core/HomePage/CourseCard.jsx:20:37 | error | react/prop-types | 'cardData.heading' is missing in props validation |
| frontend/src/components/core/HomePage/CourseCard.jsx:26:23 | error | react/prop-types | 'cardData.heading' is missing in props validation |
| frontend/src/components/core/HomePage/CourseCard.jsx:27:35 | error | react/prop-types | 'cardData.heading' is missing in props validation |
| frontend/src/components/core/HomePage/CourseCard.jsx:36:25 | error | react/prop-types | 'cardData.heading' is missing in props validation |
| frontend/src/components/core/HomePage/CourseCard.jsx:37:37 | error | react/prop-types | 'cardData.heading' is missing in props validation |
| frontend/src/components/core/HomePage/CourseCard.jsx:47:20 | error | react/prop-types | 'cardData.thumbnail' is missing in props validation |
| frontend/src/components/core/HomePage/CourseCard.jsx:49:27 | error | react/prop-types | 'cardData.thumbnail' is missing in props validation |
| frontend/src/components/core/HomePage/CourseCard.jsx:50:27 | error | react/prop-types | 'cardData.heading' is missing in props validation |
| frontend/src/components/core/HomePage/CourseCard.jsx:60:39 | error | react/prop-types | 'cardData.thumbnail' is missing in props validation |
| frontend/src/components/core/HomePage/CourseCard.jsx:64:81 | error | react/prop-types | 'cardData.heading' is missing in props validation |
| frontend/src/components/core/HomePage/CourseCard.jsx:74:39 | error | react/prop-types | 'cardData.heading' is missing in props validation |
| frontend/src/components/core/HomePage/CourseCard.jsx:75:22 | error | react/prop-types | 'cardData.heading' is missing in props validation |
| frontend/src/components/core/HomePage/CourseCard.jsx:79:22 | error | react/prop-types | 'cardData.description' is missing in props validation |
| frontend/src/components/core/HomePage/CourseCard.jsx:84:39 | error | react/prop-types | 'cardData.heading' is missing in props validation |
| frontend/src/components/core/HomePage/CourseCard.jsx:87:30 | error | react/prop-types | 'cardData.level' is missing in props validation |
| frontend/src/components/core/HomePage/CourseCard.jsx:95:22 | error | react/prop-types | 'cardData.price' is missing in props validation |
| frontend/src/components/core/HomePage/CourseCard.jsx:97:43 | error | react/prop-types | 'cardData.heading' is missing in props validation |
| frontend/src/components/core/HomePage/CourseCard.jsx:98:25 | error | react/prop-types | 'cardData.price' is missing in props validation |
| frontend/src/components/core/HomePage/CourseCard.jsx:102:31 | error | react/prop-types | 'cardData.originalPrice' is missing in props validation |
| frontend/src/components/core/HomePage/CourseCard.jsx:102:58 | error | react/prop-types | 'cardData.price' is missing in props validation |
| frontend/src/components/core/HomePage/CourseCard.jsx:108:35 | error | react/prop-types | 'cardData.price' is missing in props validation |
| frontend/src/components/core/HomePage/ExploreMore.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/HomePage/FeaturedCourses.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/HomePage/HighlightText.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/HomePage/HighlightText.jsx:3:26 | error | react/prop-types | 'text' is missing in props validation |
| frontend/src/components/core/HomePage/InstructorSection.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/HomePage/InstructorSection.jsx:4:8 | error | no-unused-vars | 'HighlightText' is defined but never used. |
| frontend/src/components/core/HomePage/InstructorSection.jsx:5:8 | error | no-unused-vars | 'CTAButton' is defined but never used. |
| frontend/src/components/core/HomePage/InstructorSection.jsx:6:10 | error | no-unused-vars | 'FaArrowRight' is defined but never used. |
| frontend/src/components/core/HomePage/LearningLanguageSection.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/HomePage/SplitScreen.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/HomePage/SplitScreen.jsx:4:18 | error | no-unused-vars | 'scaleUp' is defined but never used. |
| frontend/src/components/core/HomePage/SplitScreen.jsx:39:26 | error | react/prop-types | 'direction' is missing in props validation |
| frontend/src/components/core/HomePage/SplitScreen.jsx:39:44 | error | react/prop-types | 'logos' is missing in props validation |
| frontend/src/components/core/HomePage/TeamSlider.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/HomePage/TeamSlider.jsx:9:23 | error | react/prop-types | 'members' is missing in props validation |
| frontend/src/components/core/HomePage/TeamSlider.jsx:25:3 | error | react-hooks/rules-of-hooks | React Hook "useEffect" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return? |
| frontend/src/components/core/HomePage/TeamSlider.jsx:44:3 | error | react-hooks/rules-of-hooks | React Hook "useEffect" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return? |
| frontend/src/components/core/HomePage/TeamSlider.jsx:56:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'teamMembers.length'. Either include it or remove the dependency array. |
| frontend/src/components/core/HomePage/TimelineSection.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/LMSAccessModal.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/LMSAccessModal.jsx:7:3 | error | react/prop-types | 'isOpen' is missing in props validation |
| frontend/src/components/core/LMSAccessModal.jsx:8:3 | error | react/prop-types | 'onClose' is missing in props validation |
| frontend/src/components/core/LMSAccessModal.jsx:9:3 | error | react/prop-types | 'pid' is missing in props validation |
| frontend/src/components/core/LMSAccessModal.jsx:10:3 | error | react/prop-types | 'courseId' is missing in props validation |
| frontend/src/components/core/LMSAccessModal.jsx:11:3 | error | react/prop-types | 'courseTitle' is missing in props validation |
| frontend/src/components/core/LMSAccessModal.jsx:12:3 | error | react/prop-types | 'token' is missing in props validation |
| frontend/src/components/core/LMSAccessModal.jsx:13:3 | error | react/prop-types | 'onSuccess' is missing in props validation |
| frontend/src/components/core/PHPLoginHandler.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/PHPLoginHandler.jsx:6:33 | error | no-unused-vars | 'fetchUserCourseSubscriptions' is defined but never used. |
| frontend/src/components/core/PHPLoginHandler.jsx:9:28 | error | react/prop-types | 'children' is missing in props validation |
| frontend/src/components/core/PHPLoginHandler.jsx:11:9 | error | no-unused-vars | 'navigate' is assigned a value but never used. |
| frontend/src/components/core/PHPLoginHandler.jsx:21:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'checkPHPSession'. Either include it or remove the dependency array. |
| frontend/src/components/core/PHPLoginHandler.jsx:28:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'initializePHPIntegration'. Either include it or remove the dependency array. |
| frontend/src/components/core/PlanActivation.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/PlanActivation.jsx:1:27 | error | no-unused-vars | 'useEffect' is defined but never used. |
| frontend/src/components/core/PlanActivation.jsx:3:10 | error | no-unused-vars | 'getPlanStatusColor' is defined but never used. |
| frontend/src/components/core/PlanActivation.jsx:9:3 | error | react/prop-types | 'pid' is missing in props validation |
| frontend/src/components/core/PlanActivation.jsx:10:3 | error | react/prop-types | 'courseId' is missing in props validation |
| frontend/src/components/core/PlanActivation.jsx:11:3 | error | react/prop-types | 'onSuccess' is missing in props validation |
| frontend/src/components/core/PlanActivation.jsx:12:3 | error | react/prop-types | 'onError' is missing in props validation |
| frontend/src/components/core/PlanActivation.jsx:13:3 | error | react/prop-types | 'redirectPath' is missing in props validation |
| frontend/src/components/core/PlanActivation.jsx:14:3 | error | react/prop-types | 'showPlanDetails' is missing in props validation |
| frontend/src/components/core/PlanDashboard.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/PlanDashboard.jsx:7:3 | error | no-unused-vars | 'hasPlanAccess' is defined but never used. |
| frontend/src/components/core/PlanDashboard.jsx:8:3 | error | no-unused-vars | 'getRemainingUsage' is defined but never used. |
| frontend/src/components/core/PlanDashboard.jsx:17:3 | error | no-unused-vars | 'FiCheckCircle' is defined but never used. |
| frontend/src/components/core/PlanDashboard.jsx:19:3 | error | no-unused-vars | 'FiClock' is defined but never used. |
| frontend/src/components/core/PlanDashboard.jsx:20:3 | error | no-unused-vars | 'FiExternalLink' is defined but never used. |
| frontend/src/components/core/PlanDashboard.jsx:25:26 | error | react/prop-types | 'pid' is missing in props validation |
| frontend/src/components/core/PlanDashboard.jsx:25:31 | error | react/prop-types | 'token' is missing in props validation |
| frontend/src/components/core/PlanDashboard.jsx:27:10 | error | no-unused-vars | 'planData' is assigned a value but never used. |
| frontend/src/components/core/PlanDashboard.jsx:30:10 | error | no-unused-vars | 'enrollmentStatus' is assigned a value but never used. |
| frontend/src/components/core/PlanDashboard.jsx:68:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fetchPlanData'. Either include it or remove the dependency array. |
| frontend/src/components/core/PlanStatusCard.jsx:170:115 | error | parse | Parsing error: Unexpected token } |
| frontend/src/components/core/ViewCourse/CourseReviewModal.jsx:14:45 | error | react/prop-types | 'setReviewModal' is missing in props validation |
| frontend/src/components/core/ViewCourse/DocumentViewer.jsx:6:3 | error | react/prop-types | 'pdfUrl' is missing in props validation |
| frontend/src/components/core/ViewCourse/DocumentViewer.jsx:7:3 | error | react/prop-types | 'pptUrl' is missing in props validation |
| frontend/src/components/core/ViewCourse/DocumentViewer.jsx:8:3 | error | react/prop-types | 'pptPdfUrl' is missing in props validation |
| frontend/src/components/core/ViewCourse/DocumentViewer.jsx:9:3 | error | react/prop-types | 'lectureTitle' is missing in props validation |
| frontend/src/components/core/ViewCourse/DocumentViewer.jsx:22:10 | error | no-unused-vars | 'pptError' is assigned a value but never used. |
| frontend/src/components/core/ViewCourse/DocumentViewer.jsx:24:10 | error | no-unused-vars | 'retryCount' is assigned a value but never used. |
| frontend/src/components/core/ViewCourse/DocumentViewer.jsx:70:3 | error | react-hooks/rules-of-hooks | React Hook "useEffect" is called conditionally. React Hooks must be called in the exact same order in every component render. |
| frontend/src/components/core/ViewCourse/EnhancedZoomMeetingViewer.jsx:4:20 | error | no-unused-vars | 'FiMessageSquare' is defined but never used. |
| frontend/src/components/core/ViewCourse/EnhancedZoomMeetingViewer.jsx:5:5 | error | no-unused-vars | 'FiMic' is defined but never used. |
| frontend/src/components/core/ViewCourse/EnhancedZoomMeetingViewer.jsx:5:12 | error | no-unused-vars | 'FiMicOff' is defined but never used. |
| frontend/src/components/core/ViewCourse/EnhancedZoomMeetingViewer.jsx:5:22 | error | no-unused-vars | 'FiCamera' is defined but never used. |
| frontend/src/components/core/ViewCourse/EnhancedZoomMeetingViewer.jsx:5:32 | error | no-unused-vars | 'FiCameraOff' is defined but never used. |
| frontend/src/components/core/ViewCourse/EnhancedZoomMeetingViewer.jsx:5:45 | error | no-unused-vars | 'FiMonitor' is defined but never used. |
| frontend/src/components/core/ViewCourse/EnhancedZoomMeetingViewer.jsx:5:56 | error | no-unused-vars | 'FiThumbsUp' is defined but never used. |
| frontend/src/components/core/ViewCourse/EnhancedZoomMeetingViewer.jsx:6:5 | error | no-unused-vars | 'FiHeart' is defined but never used. |
| frontend/src/components/core/ViewCourse/EnhancedZoomMeetingViewer.jsx:6:14 | error | no-unused-vars | 'FiStar' is defined but never used. |
| frontend/src/components/core/ViewCourse/EnhancedZoomMeetingViewer.jsx:6:22 | error | no-unused-vars | 'FiSmile' is defined but never used. |
| frontend/src/components/core/ViewCourse/EnhancedZoomMeetingViewer.jsx:6:31 | error | no-unused-vars | 'FiTrendingUp' is defined but never used. |
| frontend/src/components/core/ViewCourse/EnhancedZoomMeetingViewer.jsx:15:53 | error | react/prop-types | 'subSectionId' is missing in props validation |
| frontend/src/components/core/ViewCourse/EnhancedZoomMeetingViewer.jsx:15:67 | error | react/prop-types | 'lectureTitle' is missing in props validation |
| frontend/src/components/core/ViewCourse/EnhancedZoomMeetingViewer.jsx:15:67 | error | no-unused-vars | 'lectureTitle' is assigned a value but never used. |
| frontend/src/components/core/ViewCourse/EnhancedZoomMeetingViewer.jsx:20:12 | error | no-unused-vars | 'showChat' is assigned a value but never used. |
| frontend/src/components/core/ViewCourse/EnhancedZoomMeetingViewer.jsx:20:22 | error | no-unused-vars | 'setShowChat' is assigned a value but never used. |
| frontend/src/components/core/ViewCourse/EnhancedZoomMeetingViewer.jsx:22:12 | error | no-unused-vars | 'engagementData' is assigned a value but never used. |
| frontend/src/components/core/ViewCourse/EnhancedZoomMeetingViewer.jsx:22:28 | error | no-unused-vars | 'setEngagementData' is assigned a value but never used. |
| frontend/src/components/core/ViewCourse/EnhancedZoomMeetingViewer.jsx:98:8 | warning | react-hooks/exhaustive-deps | React Hook useEffect has missing dependencies: 'trackEvent' and 'updateEngagement'. Either include them or remove the dependency array. |
| frontend/src/components/core/ViewCourse/EnhancedZoomMeetingViewer.jsx:620:20 | error | react/no-unknown-property | Unknown property 'jsx' found |
| frontend/src/components/core/ViewCourse/MobileZoomMeetingViewer.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/ViewCourse/MobileZoomMeetingViewer.jsx:4:36 | error | react/prop-types | 'meeting' is missing in props validation |
| frontend/src/components/core/ViewCourse/MobileZoomMeetingViewer.jsx:4:45 | error | react/prop-types | 'isInstructor' is missing in props validation |
| frontend/src/components/core/ViewCourse/MobileZoomMeetingViewer.jsx:4:67 | error | react/prop-types | 'onJoinMeeting' is missing in props validation |
| frontend/src/components/core/ViewCourse/MobileZoomMeetingViewer.jsx:5:10 | error | no-unused-vars | 'connectionStatus' is assigned a value but never used. |
| frontend/src/components/core/ViewCourse/MobileZoomMeetingViewer.jsx:5:28 | error | no-unused-vars | 'setConnectionStatus' is assigned a value but never used. |
| frontend/src/components/core/ViewCourse/MobileZoomMeetingViewer.jsx:63:19 | error | react/prop-types | 'meeting.startTime' is missing in props validation |
| frontend/src/components/core/ViewCourse/MobileZoomMeetingViewer.jsx:67:44 | error | react/prop-types | 'meeting.startTime' is missing in props validation |
| frontend/src/components/core/ViewCourse/MobileZoomMeetingViewer.jsx:91:16 | error | react/prop-types | 'meeting.startTime' is missing in props validation |
| frontend/src/components/core/ViewCourse/MobileZoomMeetingViewer.jsx:208:71 | error | react/prop-types | 'meeting.topic' is missing in props validation |
| frontend/src/components/core/ViewCourse/MobileZoomMeetingViewer.jsx:213:27 | error | react/prop-types | 'meeting.startTime' is missing in props validation |
| frontend/src/components/core/ViewCourse/MobileZoomMeetingViewer.jsx:213:56 | error | react/prop-types | 'meeting.startTime' is missing in props validation |
| frontend/src/components/core/ViewCourse/MobileZoomMeetingViewer.jsx:218:51 | error | react/prop-types | 'meeting.duration' is missing in props validation |
| frontend/src/components/core/ViewCourse/MobileZoomMeetingViewer.jsx:236:25 | error | react/prop-types | 'meeting.totalParticipants' is missing in props validation |
| frontend/src/components/core/ViewCourse/MobileZoomMeetingViewer.jsx:258:19 | error | react/prop-types | 'meeting.password' is missing in props validation |
| frontend/src/components/core/ViewCourse/MobileZoomMeetingViewer.jsx:261:58 | error | react/prop-types | 'meeting.password' is missing in props validation |
| frontend/src/components/core/ViewCourse/QuizView.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/ViewCourse/QuizView.jsx:2:10 | error | no-unused-vars | 'useDispatch' is defined but never used. |
| frontend/src/components/core/ViewCourse/QuizView.jsx:8:19 | error | no-unused-vars | 'FiCheckCircle' is defined but never used. |
| frontend/src/components/core/ViewCourse/QuizView.jsx:16:9 | error | no-unused-vars | 'location' is assigned a value but never used. |
| frontend/src/components/core/ViewCourse/QuizView.jsx:18:30 | error | no-unused-vars | 'courseEntireData' is assigned a value but never used. |
| frontend/src/components/core/ViewCourse/QuizView.jsx:18:48 | error | no-unused-vars | 'completedLectures' is assigned a value but never used. |
| frontend/src/components/core/ViewCourse/QuizView.jsx:82:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'navigate'. Either include it or remove the dependency array. |
| frontend/src/components/core/ViewCourse/QuizView.jsx:135:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'handleTimerExpiry'. Either include it or remove the dependency array. |
| frontend/src/components/core/ViewCourse/QuizView.jsx:172:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'shuffleUntilDifferent'. Either include it or remove the dependency array. |
| frontend/src/components/core/ViewCourse/RealTimeAttendance.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/ViewCourse/RealTimeAttendance.jsx:2:63 | error | no-unused-vars | 'FaWifi' is defined but never used. |
| frontend/src/components/core/ViewCourse/RealTimeAttendance.jsx:2:71 | error | no-unused-vars | 'FaSync' is defined but never used. |
| frontend/src/components/core/ViewCourse/RealTimeAttendance.jsx:5:31 | error | react/prop-types | 'meetingId' is missing in props validation |
| frontend/src/components/core/ViewCourse/RealTimeAttendance.jsx:5:42 | error | react/prop-types | 'isInstructor' is missing in props validation |
| frontend/src/components/core/ViewCourse/RealTimeAttendance.jsx:29:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'connectWebSocket'. Either include it or remove the dependency array. |
| frontend/src/components/core/ViewCourse/RecordingViewer.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/ViewCourse/RecordingViewer.jsx:1:27 | error | no-unused-vars | 'useEffect' is defined but never used. |
| frontend/src/components/core/ViewCourse/RecordingViewer.jsx:2:58 | error | no-unused-vars | 'FaUsers' is defined but never used. |
| frontend/src/components/core/ViewCourse/RecordingViewer.jsx:2:67 | error | no-unused-vars | 'FaShare' is defined but never used. |
| frontend/src/components/core/ViewCourse/RecordingViewer.jsx:5:28 | error | react/prop-types | 'recordings' is missing in props validation |
| frontend/src/components/core/ViewCourse/RecordingViewer.jsx:5:40 | error | react/prop-types | 'courseId' is missing in props validation |
| frontend/src/components/core/ViewCourse/RecordingViewer.jsx:5:40 | error | no-unused-vars | 'courseId' is defined but never used. |
| frontend/src/components/core/ViewCourse/RecordingViewer.jsx:5:50 | error | react/prop-types | 'isInstructor' is missing in props validation |
| frontend/src/components/core/ViewCourse/RecordingViewer.jsx:5:72 | error | react/prop-types | 'onRecordingUpdate' is missing in props validation |
| frontend/src/components/core/ViewCourse/RecordingViewer.jsx:8:10 | error | no-unused-vars | 'playbackStats' is assigned a value but never used. |
| frontend/src/components/core/ViewCourse/RecordingViewer.jsx:8:25 | error | no-unused-vars | 'setPlaybackStats' is assigned a value but never used. |
| frontend/src/components/core/ViewCourse/RecordingViewer.jsx:66:13 | error | no-unused-vars | 'token' is assigned a value but never used. |
| frontend/src/components/core/ViewCourse/RecordingViewer.jsx:170:33 | error | react/prop-types | 'recordings.length' is missing in props validation |
| frontend/src/components/core/ViewCourse/RecordingViewer.jsx:192:61 | error | react/prop-types | 'recordings.length' is missing in props validation |
| frontend/src/components/core/ViewCourse/RecordingViewer.jsx:203:29 | error | react/prop-types | 'recordings.reduce' is missing in props validation |
| frontend/src/components/core/ViewCourse/RecordingViewer.jsx:215:44 | error | react/prop-types | 'recordings.reduce' is missing in props validation |
| frontend/src/components/core/ViewCourse/RecordingViewer.jsx:227:44 | error | react/prop-types | 'recordings.reduce' is missing in props validation |
| frontend/src/components/core/ViewCourse/RecordingViewer.jsx:245:23 | error | react/prop-types | 'recordings.map' is missing in props validation |
| frontend/src/components/core/ViewCourse/SlideViewer.jsx:5:3 | error | react/prop-types | 'slides' is missing in props validation |
| frontend/src/components/core/ViewCourse/SlideViewer.jsx:6:3 | error | react/prop-types | 'pptUrl' is missing in props validation |
| frontend/src/components/core/ViewCourse/SlideViewer.jsx:7:3 | error | react/prop-types | 'lectureTitle' is missing in props validation |
| frontend/src/components/core/ViewCourse/SlideViewer.jsx:182:8 | error | react-hooks/rules-of-hooks | React Hook "useEffect" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return? |
| frontend/src/components/core/ViewCourse/SlideViewer.jsx:192:10 | warning | react-hooks/exhaustive-deps | React Hook useEffect has missing dependencies: 'nextSlide', 'prevSlide', and 'toggleFullscreen'. Either include them or remove the dependency array. |
| frontend/src/components/core/ViewCourse/VideoDetails.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/components/core/ViewCourse/VideoDetails.jsx:7:10 | error | no-unused-vars | 'apiConnector' is defined but never used. |
| frontend/src/components/core/ViewCourse/VideoDetails.jsx:8:10 | error | no-unused-vars | 'endpoints' is defined but never used. |
| frontend/src/components/core/ViewCourse/VideoDetails.jsx:9:10 | error | no-unused-vars | 'getPlaybackUrl' is defined but never used. |
| frontend/src/components/core/ViewCourse/VideoDetails.jsx:9:26 | error | no-unused-vars | 'isChunkedVideo' is defined but never used. |
| frontend/src/components/core/ViewCourse/VideoDetails.jsx:9:42 | error | no-unused-vars | 'checkVideoAvailability' is defined but never used. |
| frontend/src/components/core/ViewCourse/VideoDetails.jsx:12:8 | error | no-unused-vars | 'IconBtn' is defined but never used. |
| frontend/src/components/core/ViewCourse/VideoDetails.jsx:19:81 | error | no-unused-vars | 'FiChevronLeft' is defined but never used. |
| frontend/src/components/core/ViewCourse/VideoDetails.jsx:19:96 | error | no-unused-vars | 'FiChevronRight' is defined but never used. |
| frontend/src/components/core/ViewCourse/VideoDetails.jsx:28:9 | error | no-unused-vars | 'location' is assigned a value but never used. |
| frontend/src/components/core/ViewCourse/VideoDetails.jsx:34:67 | error | no-unused-vars | 'completedQuizzes' is assigned a value but never used. |
| frontend/src/components/core/ViewCourse/VideoDetails.jsx:34:85 | error | no-unused-vars | 'passedQuizzes' is assigned a value but never used. |
| frontend/src/components/core/ViewCourse/VideoDetails.jsx:38:10 | error | no-unused-vars | 'previewSource' is assigned a value but never used. |
| frontend/src/components/core/ViewCourse/VideoDetails.jsx:39:10 | error | no-unused-vars | 'videoEnded' is assigned a value but never used. |
| frontend/src/components/core/ViewCourse/VideoDetails.jsx:41:25 | error | no-unused-vars | 'setCheckingVideo' is assigned a value but never used. |
| frontend/src/components/core/ViewCourse/VideoDetails.jsx:42:26 | error | no-unused-vars | 'setVideoAvailable' is assigned a value but never used. |
| frontend/src/components/core/ViewCourse/VideoDetails.jsx:43:25 | error | no-unused-vars | 'setPlaybackSpeed' is assigned a value but never used. |
| frontend/src/components/core/ViewCourse/VideoDetails.jsx:59:9 | error | no-unused-vars | 'hasZoom' is assigned a value but never used. |
| frontend/src/components/core/ViewCourse/VideoDetails.jsx:60:9 | error | no-unused-vars | 'hasVideo' is assigned a value but never used. |
| frontend/src/components/core/ViewCourse/VideoDetails.jsx:86:9 | error | no-unused-vars | 'toggleAllPanels' is assigned a value but never used. |
| frontend/src/components/core/ViewCourse/VideoDetails.jsx:542:65 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/components/core/ViewCourse/VideoDetailsSidebar.jsx:1:31 | error | no-unused-vars | 'useCallback' is defined but never used. |
| frontend/src/components/core/ViewCourse/VideoDetailsSidebar.jsx:7:10 | error | no-unused-vars | 'checkSectionAccess' is defined but never used. |
| frontend/src/components/core/ViewCourse/VideoDetailsSidebar.jsx:20:47 | error | react/prop-types | 'setReviewModal' is missing in props validation |
| frontend/src/components/core/ViewCourse/VideoDetailsSidebar.jsx:95:5 | error | no-extra-semi | Unnecessary semicolon. |
| frontend/src/components/core/ViewCourse/VideoDetailsSidebar.jsx:103:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has missing dependencies: 'sectionId' and 'subSectionId'. Either include them or remove the dependency array. |
| frontend/src/components/core/ViewCourse/VideoDetailsSidebar.jsx:337:51 | error | no-unused-vars | 'i' is defined but never used. |
| frontend/src/components/core/ViewCourse/VideoDetailsSidebar.jsx:343:41 | error | no-prototype-builtins | Do not access Object.prototype method 'hasOwnProperty' from target object. |
| frontend/src/components/core/ViewCourse/ZoomMeetingViewer.jsx:10:45 | error | react/prop-types | 'subSectionId' is missing in props validation |
| frontend/src/components/core/ViewCourse/ZoomMeetingViewer.jsx:10:59 | error | react/prop-types | 'lectureTitle' is missing in props validation |
| frontend/src/components/core/ViewCourse/ZoomMeetingViewer.jsx:10:59 | error | no-unused-vars | 'lectureTitle' is assigned a value but never used. |
| frontend/src/components/core/ViewCourse/ZoomMeetingViewer.jsx:16:11 | error | no-unused-vars | 'user' is assigned a value but never used. |
| frontend/src/config/api.js:15:41 | error | no-undef | 'process' is not defined. |
| frontend/src/config/api.js:15:56 | error | no-undef | 'process' is not defined. |
| frontend/src/config/api.js:16:12 | error | no-undef | 'process' is not defined. |
| frontend/src/contexts/ThemeContext.jsx:6:14 | warning | react-refresh/only-export-components | Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components. |
| frontend/src/contexts/ThemeContext.jsx:25:33 | error | react/prop-types | 'children' is missing in props validation |
| frontend/src/contexts/ThemeContext.jsx:25:43 | error | react/prop-types | 'allowLocalToggle' is missing in props validation |
| frontend/src/contexts/UploadContext.jsx:6:14 | warning | react-refresh/only-export-components | Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components. |
| frontend/src/contexts/UploadContext.jsx:14:34 | error | react/prop-types | 'children' is missing in props validation |
| frontend/src/pages/About.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/About.jsx:57:28 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/pages/Admin/AdminZoomAttendance.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/Admin/AdminZoomAttendance.jsx:2:76 | error | no-unused-vars | 'FaUserTimes' is defined but never used. |
| frontend/src/pages/Admin/AdminZoomAttendance.jsx:48:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has missing dependencies: 'fetchCourseAttendance' and 'fetchMeetings'. Either include them or remove the dependency array. |
| frontend/src/pages/Admin/AdminZoomAttendance.jsx:70:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has missing dependencies: 'fetchCourseAttendance' and 'fetchMeetingAttendance'. Either include them or remove the dependency array. |
| frontend/src/pages/Admin/Dashboard.jsx:3:10 | error | no-unused-vars | 'useNavigate' is defined but never used. |
| frontend/src/pages/Admin/Dashboard.jsx:54:11 | error | no-unused-vars | 'user' is assigned a value but never used. |
| frontend/src/pages/Admin/components/AdminAssignments.jsx:19:11 | error | no-unused-vars | 'navigate' is assigned a value but never used. |
| frontend/src/pages/Admin/components/AdminAssignments.jsx:23:8 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fetchData'. Either include it or remove the dependency array. |
| frontend/src/pages/Admin/components/AdminAssignments.jsx:44:31 | error | no-unused-vars | 'assignmentEndpoint' is assigned a value but never used. |
| frontend/src/pages/Admin/components/AdminCourseBuilder.jsx:17:46 | error | react/prop-types | 'course' is missing in props validation |
| frontend/src/pages/Admin/components/AdminCourseBuilder.jsx:17:54 | error | react/prop-types | 'onCourseUpdate' is missing in props validation |
| frontend/src/pages/Admin/components/AdminCourseBuilder.jsx:38:19 | error | react/prop-types | 'course._id' is missing in props validation |
| frontend/src/pages/Admin/components/AdminCourseBuilder.jsx:41:72 | error | react/prop-types | 'course._id' is missing in props validation |
| frontend/src/pages/Admin/components/AdminCourseBuilder.jsx:42:73 | error | react/prop-types | 'course._id' is missing in props validation |
| frontend/src/pages/Admin/components/AdminCourseBuilder.jsx:75:38 | error | react/prop-types | 'course.courseContent' is missing in props validation |
| frontend/src/pages/Admin/components/AdminCourseBuilder.jsx:86:36 | error | react/prop-types | 'course.courseContent' is missing in props validation |
| frontend/src/pages/Admin/components/AdminCourseBuilder.jsx:98:34 | error | react/prop-types | 'course.courseContent' is missing in props validation |
| frontend/src/pages/Admin/components/AdminSubSectionModal.jsx:8:3 | error | no-unused-vars | 'createSubSection' is defined but never used. |
| frontend/src/pages/Admin/components/AdminSubSectionModal.jsx:9:3 | error | no-unused-vars | 'updateSubSection' is defined but never used. |
| frontend/src/pages/Admin/components/AdminSubSectionModal.jsx:11:10 | error | no-unused-vars | 'getAllQuizzes' is defined but never used. |
| frontend/src/pages/Admin/components/AdminSubSectionModal.jsx:16:3 | error | react/prop-types | 'modalData' is missing in props validation |
| frontend/src/pages/Admin/components/AdminSubSectionModal.jsx:17:3 | error | react/prop-types | 'setModalData' is missing in props validation |
| frontend/src/pages/Admin/components/AdminSubSectionModal.jsx:18:3 | error | react/prop-types | 'add' is missing in props validation |
| frontend/src/pages/Admin/components/AdminSubSectionModal.jsx:19:3 | error | react/prop-types | 'view' is missing in props validation |
| frontend/src/pages/Admin/components/AdminSubSectionModal.jsx:20:3 | error | react/prop-types | 'edit' is missing in props validation |
| frontend/src/pages/Admin/components/AdminSubSectionModal.jsx:21:3 | error | react/prop-types | 'onUpdate' is missing in props validation |
| frontend/src/pages/Admin/components/AdminSubSectionModal.jsx:31:19 | error | no-unused-vars | 'setLoading' is assigned a value but never used. |
| frontend/src/pages/Admin/components/AdminSubSectionModal.jsx:32:11 | error | no-unused-vars | 'token' is assigned a value but never used. |
| frontend/src/pages/Admin/components/AdminSubSectionModal.jsx:39:34 | error | react/prop-types | 'modalData._id' is missing in props validation |
| frontend/src/pages/Admin/components/AdminSubSectionModal.jsx:40:30 | error | react/prop-types | 'modalData.videoUrl' is missing in props validation |
| frontend/src/pages/Admin/components/AdminSubSectionModal.jsx:41:27 | error | react/prop-types | 'modalData.title' is missing in props validation |
| frontend/src/pages/Admin/components/AdminSubSectionModal.jsx:43:42 | error | react/prop-types | 'modalData.title' is missing in props validation |
| frontend/src/pages/Admin/components/AdminSubSectionModal.jsx:44:41 | error | react/prop-types | 'modalData.description' is missing in props validation |
| frontend/src/pages/Admin/components/AdminSubSectionModal.jsx:45:42 | error | react/prop-types | 'modalData.videoUrl' is missing in props validation |
| frontend/src/pages/Admin/components/AdminSubSectionModal.jsx:46:40 | error | react/prop-types | 'modalData.pdfUrl' is missing in props validation |
| frontend/src/pages/Admin/components/AdminSubSectionModal.jsx:47:40 | error | react/prop-types | 'modalData.pptUrl' is missing in props validation |
| frontend/src/pages/Admin/components/AdminSubSectionModal.jsx:49:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has missing dependencies: 'edit', 'modalData', 'setValue', and 'view'. Either include them or remove the dependency array. |
| frontend/src/pages/Admin/components/AdminSubSectionModal.jsx:56:67 | error | react/prop-types | 'modalData.title' is missing in props validation |
| frontend/src/pages/Admin/components/AdminSubSectionModal.jsx:57:65 | error | react/prop-types | 'modalData.description' is missing in props validation |
| frontend/src/pages/Admin/components/AdminSubSectionModal.jsx:58:59 | error | react/prop-types | 'modalData.quiz' is missing in props validation |
| frontend/src/pages/Admin/components/AdminSubSectionModal.jsx:58:65 | error | react/prop-types | 'modalData.quiz._id' is missing in props validation |
| frontend/src/pages/Admin/components/AdminSubSectionModal.jsx:64:67 | error | react/prop-types | 'modalData.videoUrl' is missing in props validation |
| frontend/src/pages/Admin/components/AdminSubSectionModal.jsx:70:63 | error | react/prop-types | 'modalData.pdfUrl' is missing in props validation |
| frontend/src/pages/Admin/components/AdminSubSectionModal.jsx:76:63 | error | react/prop-types | 'modalData.pptUrl' is missing in props validation |
| frontend/src/pages/Admin/components/AdminSubSectionModal.jsx:104:98 | error | react/prop-types | 'modalData.videoUrl' is missing in props validation |
| frontend/src/pages/Admin/components/AdminSubSectionModal.jsx:111:94 | error | react/prop-types | 'modalData.pdfUrl' is missing in props validation |
| frontend/src/pages/Admin/components/AdminSubSectionModal.jsx:117:94 | error | react/prop-types | 'modalData.pptUrl' is missing in props validation |
| frontend/src/pages/Admin/components/AdminSubSectionModal.jsx:233:40 | error | react/prop-types | 'modalData.videoUrl' is missing in props validation |
| frontend/src/pages/Admin/components/AdminSubSectionModal.jsx:234:40 | error | react/prop-types | 'modalData.videoUrl' is missing in props validation |
| frontend/src/pages/Admin/components/AdminSubSectionModal.jsx:235:56 | error | react/prop-types | 'modalData._id' is missing in props validation |
| frontend/src/pages/Admin/components/AdminSubSectionModal.jsx:235:72 | error | react/prop-types | 'modalData._id' is missing in props validation |
| frontend/src/pages/Admin/components/AdminSubSectionModal.jsx:246:40 | error | react/prop-types | 'modalData.pdfUrl' is missing in props validation |
| frontend/src/pages/Admin/components/AdminSubSectionModal.jsx:247:40 | error | react/prop-types | 'modalData.pdfUrl' is missing in props validation |
| frontend/src/pages/Admin/components/AdminSubSectionModal.jsx:258:40 | error | react/prop-types | 'modalData.pptUrl' is missing in props validation |
| frontend/src/pages/Admin/components/AdminSubSectionModal.jsx:259:40 | error | react/prop-types | 'modalData.pptUrl' is missing in props validation |
| frontend/src/pages/Admin/components/AdminZoomMeetings.jsx:2:65 | error | no-unused-vars | 'FiEdit' is defined but never used. |
| frontend/src/pages/Admin/components/AdminZoomMeetings.jsx:2:157 | error | no-unused-vars | 'FiEye' is defined but never used. |
| frontend/src/pages/Admin/components/AdminZoomMeetings.jsx:158:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fetchMeetings'. Either include it or remove the dependency array. |
| frontend/src/pages/Admin/components/AdminZoomMeetings.jsx:165:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fetchCourses'. Either include it or remove the dependency array. |
| frontend/src/pages/Admin/components/AdminZoomMeetings.jsx:929:40 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/pages/Admin/components/Analytics.jsx:46:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fetchAnalytics'. Either include it or remove the dependency array. |
| frontend/src/pages/Admin/components/BundleAccessRequests.jsx:16:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fetchBundleRequests'. Either include it or remove the dependency array. |
| frontend/src/pages/Admin/components/CareersManagement.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/Admin/components/CareersManagement.jsx:35:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has missing dependencies: 'fetchAnalytics', 'fetchApplications', and 'fetchJobs'. Either include them or remove the dependency array. |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:3:71 | error | no-unused-vars | 'FaCalendarAlt' is defined but never used. |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:5:29 | error | react/prop-types | 'analytics' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:23:23 | error | react/prop-types | 'icon' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:23:29 | error | react/prop-types | 'title' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:23:36 | error | react/prop-types | 'value' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:23:43 | error | react/prop-types | 'subtitle' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:23:53 | error | react/prop-types | 'color' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:67:28 | error | react/prop-types | 'analytics.jobs' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:67:34 | error | react/prop-types | 'analytics.jobs.total' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:68:34 | error | react/prop-types | 'analytics.jobs' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:68:40 | error | react/prop-types | 'analytics.jobs.published' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:75:28 | error | react/prop-types | 'analytics.applications' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:75:42 | error | react/prop-types | 'analytics.applications.total' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:76:34 | error | react/prop-types | 'analytics.applications' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:76:48 | error | react/prop-types | 'analytics.applications.pending' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:83:28 | error | react/prop-types | 'analytics.applications' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:83:42 | error | react/prop-types | 'analytics.applications.shortlisted' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:91:28 | error | react/prop-types | 'analytics.applications' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:91:42 | error | react/prop-types | 'analytics.applications.hired' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:113:43 | error | react/prop-types | 'analytics.jobs' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:113:49 | error | react/prop-types | 'analytics.jobs.total' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:113:72 | error | react/prop-types | 'analytics.jobs' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:113:77 | error | react/prop-types | 'analytics.jobs.published' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:113:99 | error | react/prop-types | 'analytics.jobs' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:113:104 | error | react/prop-types | 'analytics.jobs.total' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:117:75 | error | react/prop-types | 'analytics.jobs' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:117:81 | error | react/prop-types | 'analytics.jobs.published' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:128:43 | error | react/prop-types | 'analytics.jobs' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:128:49 | error | react/prop-types | 'analytics.jobs.total' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:128:72 | error | react/prop-types | 'analytics.jobs' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:128:77 | error | react/prop-types | 'analytics.jobs.draft' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:128:95 | error | react/prop-types | 'analytics.jobs' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:128:100 | error | react/prop-types | 'analytics.jobs.total' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:132:75 | error | react/prop-types | 'analytics.jobs' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:132:81 | error | react/prop-types | 'analytics.jobs.draft' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:147:73 | error | react/prop-types | 'analytics.applications' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:147:87 | error | react/prop-types | 'analytics.applications.pending' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:151:73 | error | react/prop-types | 'analytics.applications' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:151:87 | error | react/prop-types | 'analytics.applications.shortlisted' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:155:73 | error | react/prop-types | 'analytics.applications' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:155:87 | error | react/prop-types | 'analytics.applications.hired' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:162:18 | error | react/prop-types | 'analytics.applicationsByDepartment' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:162:56 | error | react/prop-types | 'analytics.applicationsByDepartment' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:162:81 | error | react/prop-types | 'analytics.applicationsByDepartment.length' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:170:24 | error | react/prop-types | 'analytics.applicationsByDepartment' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:170:49 | error | react/prop-types | 'analytics.applicationsByDepartment.map' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:171:54 | error | react/prop-types | 'analytics.applicationsByDepartment' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:171:79 | error | react/prop-types | 'analytics.applicationsByDepartment.map' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:194:18 | error | react/prop-types | 'analytics.recentApplications' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:194:50 | error | react/prop-types | 'analytics.recentApplications' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:194:69 | error | react/prop-types | 'analytics.recentApplications.length' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:202:24 | error | react/prop-types | 'analytics.recentApplications' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:202:43 | error | react/prop-types | 'analytics.recentApplications.slice' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:226:20 | error | react/prop-types | 'analytics.jobs' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:226:26 | error | react/prop-types | 'analytics.jobs.total' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:226:46 | error | react/prop-types | 'analytics.applications' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/CareersAnalytics.jsx:226:60 | error | react/prop-types | 'analytics.applications.total' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/JobApplications.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/Admin/components/CareersManagement/JobApplications.jsx:5:22 | error | no-unused-vars | 'FaEye' is defined but never used. |
| frontend/src/pages/Admin/components/CareersManagement/JobApplications.jsx:5:46 | error | no-unused-vars | 'FaFilter' is defined but never used. |
| frontend/src/pages/Admin/components/CareersManagement/JobApplications.jsx:6:10 | error | no-unused-vars | 'getJobApplications' is defined but never used. |
| frontend/src/pages/Admin/components/CareersManagement/JobApplications.jsx:8:28 | error | react/prop-types | 'selectedJob' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/JobApplications.jsx:8:41 | error | react/prop-types | 'applications' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/JobApplications.jsx:8:55 | error | react/prop-types | 'onRefresh' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/JobApplications.jsx:15:23 | error | react/prop-types | 'selectedJob._id' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/JobApplications.jsx:22:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'filterApplications'. Either include it or remove the dependency array. |
| frontend/src/pages/Admin/components/CareersManagement/JobApplications.jsx:96:31 | error | react/prop-types | 'applications.reduce' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/JobApplications.jsx:187:34 | error | react/prop-types | 'selectedJob.title' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/JobForm.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/Admin/components/CareersManagement/JobForm.jsx:5:20 | error | react/prop-types | 'job' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/JobForm.jsx:5:25 | error | react/prop-types | 'onSubmit' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/JobForm.jsx:5:35 | error | react/prop-types | 'onCancel' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/JobForm.jsx:5:45 | error | react/prop-types | 'loading' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/JobForm.jsx:30:20 | error | react/prop-types | 'job.title' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/JobForm.jsx:31:23 | error | react/prop-types | 'job.location' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/JobForm.jsx:32:25 | error | react/prop-types | 'job.department' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/JobForm.jsx:33:26 | error | react/prop-types | 'job.description' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/JobForm.jsx:34:31 | error | react/prop-types | 'job.responsibilities' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/JobForm.jsx:34:49 | error | react/prop-types | 'job.responsibilities.length' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/JobForm.jsx:34:66 | error | react/prop-types | 'job.responsibilities' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/JobForm.jsx:35:27 | error | react/prop-types | 'job.requirements' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/JobForm.jsx:35:41 | error | react/prop-types | 'job.requirements.length' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/JobForm.jsx:35:58 | error | react/prop-types | 'job.requirements' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/JobForm.jsx:36:34 | error | react/prop-types | 'job.applicationDeadline' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/JobForm.jsx:36:69 | error | react/prop-types | 'job.applicationDeadline' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/JobForm.jsx:37:29 | error | react/prop-types | 'job.employmentType' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/JobForm.jsx:38:30 | error | react/prop-types | 'job.experienceLevel' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/JobForm.jsx:40:20 | error | react/prop-types | 'job.salaryRange' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/JobForm.jsx:40:33 | error | react/prop-types | 'job.salaryRange.min' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/JobForm.jsx:41:20 | error | react/prop-types | 'job.salaryRange' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/JobForm.jsx:41:33 | error | react/prop-types | 'job.salaryRange.max' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/JobForm.jsx:42:25 | error | react/prop-types | 'job.salaryRange' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/JobForm.jsx:42:38 | error | react/prop-types | 'job.salaryRange.currency' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/JobForm.jsx:44:23 | error | react/prop-types | 'job.benefits' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/JobForm.jsx:44:33 | error | react/prop-types | 'job.benefits.length' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/JobForm.jsx:44:50 | error | react/prop-types | 'job.benefits' is missing in props validation |
| frontend/src/pages/Admin/components/CareersManagement/JobForm.jsx:45:26 | error | react/prop-types | 'job.isPublished' is missing in props validation |
| frontend/src/pages/Admin/components/CouponForm.jsx:1:20 | error | no-unused-vars | 'useEffect' is defined but never used. |
| frontend/src/pages/Admin/components/CouponForm.jsx:6:94 | error | no-unused-vars | 'FiClock' is defined but never used. |
| frontend/src/pages/Admin/components/CouponForm.jsx:12:38 | error | react/prop-types | 'onSuccess' is missing in props validation |
| frontend/src/pages/Admin/components/CouponForm.jsx:16:10 | error | no-unused-vars | 'courses' is assigned a value but never used. |
| frontend/src/pages/Admin/components/CouponForm.jsx:16:19 | error | no-unused-vars | 'setCourses' is assigned a value but never used. |
| frontend/src/pages/Admin/components/CouponForm.jsx:17:10 | error | no-unused-vars | 'categories' is assigned a value but never used. |
| frontend/src/pages/Admin/components/CouponForm.jsx:17:22 | error | no-unused-vars | 'setCategories' is assigned a value but never used. |
| frontend/src/pages/Admin/components/CouponList.jsx:113:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fetchCoupons'. Either include it or remove the dependency array. |
| frontend/src/pages/Admin/components/CouponList.jsx:264:59 | error | react/no-unescaped-entities | `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. |
| frontend/src/pages/Admin/components/CouponList.jsx:264:73 | error | react/no-unescaped-entities | `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. |
| frontend/src/pages/Admin/components/CourseAssignmentManagement.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/Admin/components/CourseAssignmentManagement.jsx:6:80 | error | no-unused-vars | 'updateUser' is defined but never used. |
| frontend/src/pages/Admin/components/CourseAssignmentManagement.jsx:45:8 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fetchData'. Either include it or remove the dependency array. |
| frontend/src/pages/Admin/components/CourseManagement.jsx:3:40 | error | no-unused-vars | 'deleteCourse' is defined but never used. |
| frontend/src/pages/Admin/components/CourseManagement.jsx:6:10 | error | no-unused-vars | 'FaCheck' is defined but never used. |
| frontend/src/pages/Admin/components/CourseManagement.jsx:85:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fetchCourses'. Either include it or remove the dependency array. |
| frontend/src/pages/Admin/components/CourseManagement.jsx:87:9 | error | no-unused-vars | 'handleApproveCourse' is assigned a value but never used. |
| frontend/src/pages/Admin/components/CourseManagement.jsx:110:6 | warning | react-hooks/exhaustive-deps | React Hook useCallback has a missing dependency: 'confirmDeleteCourse'. Either include it or remove the dependency array. |
| frontend/src/pages/Admin/components/CourseManagement.jsx:112:60 | error | no-unused-vars | 'courseName' is defined but never used. |
| frontend/src/pages/Admin/components/CourseManagement.jsx:215:9 | error | no-unused-vars | 'handleViewCourse' is assigned a value but never used. |
| frontend/src/pages/Admin/components/CourseManagement.jsx:255:25 | error | react/prop-types | 'course' is missing in props validation |
| frontend/src/pages/Admin/components/CourseManagement.jsx:259:96 | error | react/prop-types | 'course.courseName' is missing in props validation |
| frontend/src/pages/Admin/components/CourseManagement.jsx:261:21 | error | react/prop-types | 'course.instructor' is missing in props validation |
| frontend/src/pages/Admin/components/CourseManagement.jsx:261:33 | error | react/prop-types | 'course.instructor.firstName' is missing in props validation |
| frontend/src/pages/Admin/components/CourseManagement.jsx:261:52 | error | react/prop-types | 'course.instructor' is missing in props validation |
| frontend/src/pages/Admin/components/CourseManagement.jsx:261:64 | error | react/prop-types | 'course.instructor.lastName' is missing in props validation |
| frontend/src/pages/Admin/components/CourseManagement.jsx:266:20 | error | react/prop-types | 'course.status' is missing in props validation |
| frontend/src/pages/Admin/components/CourseManagement.jsx:270:21 | error | react/prop-types | 'course.status' is missing in props validation |
| frontend/src/pages/Admin/components/CourseManagement.jsx:273:20 | error | react/prop-types | 'course.courseType' is missing in props validation |
| frontend/src/pages/Admin/components/CourseManagement.jsx:277:21 | error | react/prop-types | 'course.courseType' is missing in props validation |
| frontend/src/pages/Admin/components/CourseManagement.jsx:285:51 | error | react/prop-types | 'course.category' is missing in props validation |
| frontend/src/pages/Admin/components/CourseManagement.jsx:285:61 | error | react/prop-types | 'course.category.name' is missing in props validation |
| frontend/src/pages/Admin/components/CourseManagement.jsx:289:67 | error | react/prop-types | 'course.price' is missing in props validation |
| frontend/src/pages/Admin/components/CourseManagement.jsx:296:58 | error | react/prop-types | 'course._id' is missing in props validation |
| frontend/src/pages/Admin/components/CourseManagement.jsx:298:22 | error | react/prop-types | 'course.isVisible' is missing in props validation |
| frontend/src/pages/Admin/components/CourseManagement.jsx:302:51 | error | react/prop-types | 'course._id' is missing in props validation |
| frontend/src/pages/Admin/components/CourseManagement.jsx:304:42 | error | react/prop-types | 'course._id' is missing in props validation |
| frontend/src/pages/Admin/components/CourseManagement.jsx:308:25 | error | react/prop-types | 'course.isVisible' is missing in props validation |
| frontend/src/pages/Admin/components/CourseManagement.jsx:309:31 | error | react/prop-types | 'course.isVisible' is missing in props validation |
| frontend/src/pages/Admin/components/CourseManagement.jsx:315:58 | error | react/prop-types | 'course._id' is missing in props validation |
| frontend/src/pages/Admin/components/CourseManagement.jsx:315:70 | error | react/prop-types | 'course.courseType' is missing in props validation |
| frontend/src/pages/Admin/components/CourseManagement.jsx:317:22 | error | react/prop-types | 'course.courseType' is missing in props validation |
| frontend/src/pages/Admin/components/CourseManagement.jsx:321:47 | error | react/prop-types | 'course._id' is missing in props validation |
| frontend/src/pages/Admin/components/CourseManagement.jsx:323:38 | error | react/prop-types | 'course._id' is missing in props validation |
| frontend/src/pages/Admin/components/CourseManagement.jsx:327:25 | error | react/prop-types | 'course.courseType' is missing in props validation |
| frontend/src/pages/Admin/components/CourseManagement.jsx:328:31 | error | react/prop-types | 'course.courseType' is missing in props validation |
| frontend/src/pages/Admin/components/CourseManagement.jsx:339:50 | error | react/prop-types | 'course._id' is missing in props validation |
| frontend/src/pages/Admin/components/CourseManagement.jsx:341:41 | error | react/prop-types | 'course._id' is missing in props validation |
| frontend/src/pages/Admin/components/CourseManagement.jsx:346:47 | error | react/prop-types | 'course._id' is missing in props validation |
| frontend/src/pages/Admin/components/CourseManagement.jsx:361:51 | error | react/prop-types | 'course._id' is missing in props validation |
| frontend/src/pages/Admin/components/CourseManagement.jsx:364:42 | error | react/prop-types | 'course._id' is missing in props validation |
| frontend/src/pages/Admin/components/CourseManagement.jsx:481:33 | error | react/no-unescaped-entities | `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. |
| frontend/src/pages/Admin/components/CourseManagement.jsx:481:46 | error | react/no-unescaped-entities | `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. |
| frontend/src/pages/Admin/components/CourseManagement.jsx:484:36 | error | react/no-unescaped-entities | `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. |
| frontend/src/pages/Admin/components/CourseManagement.jsx:484:51 | error | react/no-unescaped-entities | `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. |
| frontend/src/pages/Admin/components/CourseManagement.jsx:524:20 | error | no-unused-vars | 'updatedCourse' is defined but never used. |
| frontend/src/pages/Admin/components/CreateCourse/CreateCourse.jsx:2:23 | error | no-unused-vars | 'useSelector' is defined but never used. |
| frontend/src/pages/Admin/components/CreateCourse/CreateCourse.jsx:8:40 | error | react/prop-types | 'onCancel' is missing in props validation |
| frontend/src/pages/Admin/components/CreateCourse/CreateCourse.jsx:8:40 | error | no-unused-vars | 'onCancel' is defined but never used. |
| frontend/src/pages/Admin/components/CreateCourse/CreateCourse.jsx:10:9 | error | no-unused-vars | 'navigate' is assigned a value but never used. |
| frontend/src/pages/Admin/components/EditCourse.jsx:14:38 | error | react/prop-types | 'course' is missing in props validation |
| frontend/src/pages/Admin/components/EditCourse.jsx:14:46 | error | react/prop-types | 'onCancel' is missing in props validation |
| frontend/src/pages/Admin/components/EditCourse.jsx:14:56 | error | react/prop-types | 'onSave' is missing in props validation |
| frontend/src/pages/Admin/components/EditCourse.jsx:45:38 | error | react/prop-types | 'course.courseName' is missing in props validation |
| frontend/src/pages/Admin/components/EditCourse.jsx:46:42 | error | react/prop-types | 'course.courseDescription' is missing in props validation |
| frontend/src/pages/Admin/components/EditCourse.jsx:47:38 | error | react/prop-types | 'course.price' is missing in props validation |
| frontend/src/pages/Admin/components/EditCourse.jsx:48:41 | error | react/prop-types | 'course.category' is missing in props validation |
| frontend/src/pages/Admin/components/EditCourse.jsx:48:51 | error | react/prop-types | 'course.category._id' is missing in props validation |
| frontend/src/pages/Admin/components/EditCourse.jsx:49:37 | error | react/prop-types | 'course.tag' is missing in props validation |
| frontend/src/pages/Admin/components/EditCourse.jsx:50:41 | error | react/prop-types | 'course.whatYouWillLearn' is missing in props validation |
| frontend/src/pages/Admin/components/EditCourse.jsx:51:45 | error | react/prop-types | 'course.instructions' is missing in props validation |
| frontend/src/pages/Admin/components/EditCourse.jsx:52:38 | error | react/prop-types | 'course.thumbnail' is missing in props validation |
| frontend/src/pages/Admin/components/EditCourse.jsx:53:45 | error | react/prop-types | 'course.certificateEnabled' is missing in props validation |
| frontend/src/pages/Admin/components/EditCourse.jsx:54:18 | error | react/prop-types | 'course.instructor' is missing in props validation |
| frontend/src/pages/Admin/components/EditCourse.jsx:55:41 | error | react/prop-types | 'course.instructor' is missing in props validation |
| frontend/src/pages/Admin/components/EditCourse.jsx:55:52 | error | react/prop-types | 'course.instructor._id' is missing in props validation |
| frontend/src/pages/Admin/components/EditCourse.jsx:63:33 | error | no-unused-vars | 'e' is defined but never used. |
| frontend/src/pages/Admin/components/EditCourse.jsx:92:42 | error | react/prop-types | 'course._id' is missing in props validation |
| frontend/src/pages/Admin/components/EditCourse.jsx:95:39 | error | react/prop-types | 'course.courseName' is missing in props validation |
| frontend/src/pages/Admin/components/EditCourse.jsx:98:43 | error | react/prop-types | 'course.courseDescription' is missing in props validation |
| frontend/src/pages/Admin/components/EditCourse.jsx:101:39 | error | react/prop-types | 'course.price' is missing in props validation |
| frontend/src/pages/Admin/components/EditCourse.jsx:104:42 | error | react/prop-types | 'course.category' is missing in props validation |
| frontend/src/pages/Admin/components/EditCourse.jsx:104:52 | error | react/prop-types | 'course.category._id' is missing in props validation |
| frontend/src/pages/Admin/components/EditCourse.jsx:107:69 | error | react/prop-types | 'course.tag' is missing in props validation |
| frontend/src/pages/Admin/components/EditCourse.jsx:110:42 | error | react/prop-types | 'course.whatYouWillLearn' is missing in props validation |
| frontend/src/pages/Admin/components/EditCourse.jsx:113:77 | error | react/prop-types | 'course.instructions' is missing in props validation |
| frontend/src/pages/Admin/components/EditCourse.jsx:116:39 | error | react/prop-types | 'course.thumbnail' is missing in props validation |
| frontend/src/pages/Admin/components/EditCourse.jsx:119:40 | error | react/prop-types | 'course.instructor' is missing in props validation |
| frontend/src/pages/Admin/components/EditCourse.jsx:119:52 | error | react/prop-types | 'course.instructor._id' is missing in props validation |
| frontend/src/pages/Admin/components/EditCourse.jsx:128:49 | error | react/prop-types | 'course.certificateEnabled' is missing in props validation |
| frontend/src/pages/Admin/components/EditCourse.jsx:308:32 | error | react/prop-types | 'course.tag' is missing in props validation |
| frontend/src/pages/Admin/components/EditCourse.jsx:318:29 | error | react/prop-types | 'course.thumbnail' is missing in props validation |
| frontend/src/pages/Admin/components/EditCourse.jsx:350:34 | error | react/prop-types | 'course.instructions' is missing in props validation |
| frontend/src/pages/Admin/components/EditCourse.jsx:361:37 | error | react/prop-types | 'course.certificateEnabled' is missing in props validation |
| frontend/src/pages/Admin/components/EmailLogs.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/Admin/components/EmailLogs.jsx:1:38 | error | no-unused-vars | 'useCallback' is defined but never used. |
| frontend/src/pages/Admin/components/EmailLogs.jsx:29:10 | error | no-unused-vars | 'pagination' is assigned a value but never used. |
| frontend/src/pages/Admin/components/EnhancedAnalytics.jsx:17:3 | error | no-unused-vars | 'FaFilter' is defined but never used. |
| frontend/src/pages/Admin/components/EnhancedAnalytics.jsx:24:3 | error | no-unused-vars | 'FaChartLine' is defined but never used. |
| frontend/src/pages/Admin/components/EnhancedAnalytics.jsx:26:3 | error | no-unused-vars | 'FaUserClock' is defined but never used. |
| frontend/src/pages/Admin/components/EnhancedAnalytics.jsx:28:3 | error | no-unused-vars | 'FaHistory' is defined but never used. |
| frontend/src/pages/Admin/components/EnhancedAnalytics.jsx:41:27 | error | no-unused-vars | 'setRefreshInterval' is assigned a value but never used. |
| frontend/src/pages/Admin/components/EnhancedAnalytics.jsx:44:10 | error | no-unused-vars | 'theme' is assigned a value but never used. |
| frontend/src/pages/Admin/components/EnhancedAnalytics.jsx:44:17 | error | no-unused-vars | 'setTheme' is assigned a value but never used. |
| frontend/src/pages/Admin/components/EnhancedAnalytics.jsx:56:11 | error | no-unused-vars | 'startTime' is assigned a value but never used. |
| frontend/src/pages/Admin/components/EnhancedAnalytics.jsx:156:20 | error | no-undef | 'mockAnalytics' is not defined. |
| frontend/src/pages/Admin/components/EnhancedAnalytics.jsx:574:11 | error | no-unused-vars | 'data' is assigned a value but never used. |
| frontend/src/pages/Admin/components/FaqManagement.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/Admin/components/FaqManagement.jsx:3:20 | error | no-unused-vars | 'FaCheck' is defined but never used. |
| frontend/src/pages/Admin/components/FaqManagement.jsx:3:29 | error | no-unused-vars | 'FaTimes' is defined but never used. |
| frontend/src/pages/Admin/components/FaqManagement.jsx:34:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fetchFaqs'. Either include it or remove the dependency array. |
| frontend/src/pages/Admin/components/FeaturedCoursesManagement.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/Admin/components/FeaturedCoursesManagement.jsx:3:34 | error | no-unused-vars | 'FaEdit' is defined but never used. |
| frontend/src/pages/Admin/components/FeaturedCoursesManagement.jsx:130:25 | error | react/prop-types | 'course' is missing in props validation |
| frontend/src/pages/Admin/components/FeaturedCoursesManagement.jsx:130:33 | error | react/prop-types | 'isFeatured' is missing in props validation |
| frontend/src/pages/Admin/components/FeaturedCoursesManagement.jsx:130:45 | error | react/prop-types | 'section' is missing in props validation |
| frontend/src/pages/Admin/components/FeaturedCoursesManagement.jsx:130:45 | error | no-unused-vars | 'section' is defined but never used. |
| frontend/src/pages/Admin/components/FeaturedCoursesManagement.jsx:130:54 | error | react/prop-types | 'onAdd' is missing in props validation |
| frontend/src/pages/Admin/components/FeaturedCoursesManagement.jsx:130:61 | error | react/prop-types | 'onRemove' is missing in props validation |
| frontend/src/pages/Admin/components/FeaturedCoursesManagement.jsx:138:87 | error | react/prop-types | 'course.courseName' is missing in props validation |
| frontend/src/pages/Admin/components/FeaturedCoursesManagement.jsx:139:74 | error | react/prop-types | 'course.courseDescription' is missing in props validation |
| frontend/src/pages/Admin/components/FeaturedCoursesManagement.jsx:143:44 | error | react/prop-types | 'course._id' is missing in props validation |
| frontend/src/pages/Admin/components/FeaturedCoursesManagement.jsx:150:41 | error | react/prop-types | 'course._id' is missing in props validation |
| frontend/src/pages/Admin/components/FeaturedCoursesManagement.jsx:161:25 | error | react/prop-types | 'course.studentsEnrolled' is missing in props validation |
| frontend/src/pages/Admin/components/FeaturedCoursesManagement.jsx:161:43 | error | react/prop-types | 'course.studentsEnrolled.length' is missing in props validation |
| frontend/src/pages/Admin/components/FeaturedCoursesManagement.jsx:165:25 | error | react/prop-types | 'course.totalViews' is missing in props validation |
| frontend/src/pages/Admin/components/FeaturedCoursesManagement.jsx:240:24 | error | react/no-unescaped-entities | `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. |
| frontend/src/pages/Admin/components/FeaturedCoursesManagement.jsx:240:37 | error | react/no-unescaped-entities | `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. |
| frontend/src/pages/Admin/components/NotificationManagement.jsx:10:3 | error | no-unused-vars | 'FiEdit3' is defined but never used. |
| frontend/src/pages/Admin/components/NotificationManagement.jsx:11:3 | error | no-unused-vars | 'FiFilter' is defined but never used. |
| frontend/src/pages/Admin/components/NotificationManagement.jsx:16:3 | error | no-unused-vars | 'FiCheckCircle' is defined but never used. |
| frontend/src/pages/Admin/components/NotificationManagement.jsx:17:3 | error | no-unused-vars | 'FiAlertCircle' is defined but never used. |
| frontend/src/pages/Admin/components/NotificationManagement.jsx:19:10 | error | no-unused-vars | 'BsCheckAll' is defined but never used. |
| frontend/src/pages/Admin/components/NotificationManagement.jsx:28:3 | error | no-unused-vars | 'getPriorityColor' is defined but never used. |
| frontend/src/pages/Admin/components/NotificationManagement.jsx:56:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has missing dependencies: 'fetchNotifications' and 'fetchUsers'. Either include them or remove the dependency array. |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:4:42 | error | react/prop-types | 'order' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:4:49 | error | react/prop-types | 'onClose' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:5:9 | error | no-unused-vars | 'handlePrint' is assigned a value but never used. |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:24:36 | error | react/prop-types | 'order.transactionId' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:179:37 | error | react/prop-types | 'order.user' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:179:43 | error | react/prop-types | 'order.user.firstName' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:179:68 | error | react/prop-types | 'order.user' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:179:74 | error | react/prop-types | 'order.user.lastName' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:183:34 | error | react/prop-types | 'order.user' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:183:40 | error | react/prop-types | 'order.user.email' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:184:34 | error | react/prop-types | 'order.user' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:184:40 | error | react/prop-types | 'order.user.additionalDetails' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:184:59 | error | react/prop-types | 'order.user.additionalDetails.contactNumber' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:193:37 | error | react/prop-types | 'order.invoiceNumber' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:193:67 | error | react/prop-types | 'order._id' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:193:71 | error | react/prop-types | 'order._id.slice' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:197:46 | error | react/prop-types | 'order.purchaseDate' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:227:36 | error | react/prop-types | 'order.course' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:227:44 | error | react/prop-types | 'order.course.courseName' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:228:86 | error | react/prop-types | 'order.course' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:228:94 | error | react/prop-types | 'order.course.instructor' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:228:106 | error | react/prop-types | 'order.course.instructor.firstName' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:234:36 | error | react/prop-types | 'order.originalPrice' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:234:69 | error | react/prop-types | 'order.originalPrice' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:234:94 | error | react/prop-types | 'order.amount' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:234:131 | error | react/prop-types | 'order.amount' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:237:36 | error | react/prop-types | 'order.originalPrice' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:237:69 | error | react/prop-types | 'order.originalPrice' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:237:94 | error | react/prop-types | 'order.amount' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:237:131 | error | react/prop-types | 'order.amount' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:245:34 | error | react/prop-types | 'order.couponUsed' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:245:46 | error | react/prop-types | 'order.couponUsed.code' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:245:60 | error | react/prop-types | 'order.discountAmount' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:248:36 | error | react/prop-types | 'order.originalPrice' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:248:69 | error | react/prop-types | 'order.originalPrice' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:248:94 | error | react/prop-types | 'order.amount' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:248:131 | error | react/prop-types | 'order.amount' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:249:34 | error | react/prop-types | 'order.couponUsed' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:249:46 | error | react/prop-types | 'order.couponUsed.discountAmount' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:249:74 | error | react/prop-types | 'order.discountAmount' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:249:138 | error | react/prop-types | 'order.couponUsed' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:249:150 | error | react/prop-types | 'order.couponUsed.discountAmount' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:249:180 | error | react/prop-types | 'order.discountAmount' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:257:36 | error | react/prop-types | 'order.amount' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:257:73 | error | react/prop-types | 'order.amount' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:271:37 | error | react/prop-types | 'order.paymentMethod' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:275:37 | error | react/prop-types | 'order.transactionId' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:355:26 | error | react/prop-types | 'order.invoiceNumber' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:355:56 | error | react/prop-types | 'order._id' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:355:60 | error | react/prop-types | 'order._id.slice' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:384:31 | error | react/prop-types | 'order.user' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:384:37 | error | react/prop-types | 'order.user.firstName' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:384:62 | error | react/prop-types | 'order.user' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:384:68 | error | react/prop-types | 'order.user.lastName' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:386:63 | error | react/prop-types | 'order.user' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:386:69 | error | react/prop-types | 'order.user.additionalDetails' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:386:88 | error | react/prop-types | 'order.user.additionalDetails.contactNumber' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:387:63 | error | react/prop-types | 'order.user' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:387:69 | error | react/prop-types | 'order.user.email' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:401:75 | error | react/prop-types | 'order.invoiceNumber' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:401:105 | error | react/prop-types | 'order._id' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:401:109 | error | react/prop-types | 'order._id.slice' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:406:35 | error | react/prop-types | 'order.purchaseDate' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:415:85 | error | react/prop-types | 'order.transactionId' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:419:86 | error | react/prop-types | 'order.paymentMethod' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:453:76 | error | react/prop-types | 'order.course' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:453:84 | error | react/prop-types | 'order.course.courseName' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:455:91 | error | react/prop-types | 'order.course' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:455:99 | error | react/prop-types | 'order.course.instructor' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:455:111 | error | react/prop-types | 'order.course.instructor.firstName' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:462:74 | error | react/prop-types | 'order.originalPrice' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:462:104 | error | react/prop-types | 'order.originalPrice' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:462:129 | error | react/prop-types | 'order.amount' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:462:163 | error | react/prop-types | 'order.amount' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:465:72 | error | react/prop-types | 'order.originalPrice' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:465:102 | error | react/prop-types | 'order.originalPrice' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:465:127 | error | react/prop-types | 'order.amount' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:465:161 | error | react/prop-types | 'order.amount' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:470:27 | error | react/prop-types | 'order.discountAmount' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:470:55 | error | react/prop-types | 'order.couponUsed' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:470:67 | error | react/prop-types | 'order.couponUsed.discountAmount' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:474:79 | error | react/prop-types | 'order.originalPrice' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:474:102 | error | react/prop-types | 'order.amount' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:478:27 | error | react/prop-types | 'order.discountAmount' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:478:55 | error | react/prop-types | 'order.couponUsed' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:478:67 | error | react/prop-types | 'order.couponUsed.discountAmount' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:481:41 | error | react/prop-types | 'order.couponUsed' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:481:53 | error | react/prop-types | 'order.couponUsed.code' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:481:71 | error | react/prop-types | 'order.couponUsed' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:481:82 | error | react/prop-types | 'order.couponUsed.code' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:484:80 | error | react/prop-types | 'order.couponUsed' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:484:92 | error | react/prop-types | 'order.couponUsed.discountAmount' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:484:122 | error | react/prop-types | 'order.discountAmount' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:491:78 | error | react/prop-types | 'order.amount' is missing in props validation |
| frontend/src/pages/Admin/components/OrderViewModal.jsx:491:112 | error | react/prop-types | 'order.amount' is missing in props validation |
| frontend/src/pages/Admin/components/Orders.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/Admin/components/QuizCreator.jsx:8:39 | error | react/prop-types | 'subSectionId' is missing in props validation |
| frontend/src/pages/Admin/components/QuizCreator.jsx:8:53 | error | react/prop-types | 'existingQuiz' is missing in props validation |
| frontend/src/pages/Admin/components/QuizCreator.jsx:8:67 | error | react/prop-types | 'onClose' is missing in props validation |
| frontend/src/pages/Admin/components/QuizCreator.jsx:8:76 | error | react/prop-types | 'onSuccess' is missing in props validation |
| frontend/src/pages/Admin/components/QuizCreator.jsx:35:24 | error | react/prop-types | 'existingQuiz.questions' is missing in props validation |
| frontend/src/pages/Admin/components/QuizCreator.jsx:36:49 | error | react/prop-types | 'existingQuiz.questions' is missing in props validation |
| frontend/src/pages/Admin/components/QuizCreator.jsx:36:59 | error | react/prop-types | 'existingQuiz.questions.map' is missing in props validation |
| frontend/src/pages/Admin/components/QuizCreator.jsx:86:24 | error | react/prop-types | 'existingQuiz.timeLimit' is missing in props validation |
| frontend/src/pages/Admin/components/QuizCreator.jsx:87:46 | error | react/prop-types | 'existingQuiz.timeLimit' is missing in props validation |
| frontend/src/pages/Admin/components/QuizCreator.jsx:93:5 | error | no-unused-vars | 'register' is assigned a value but never used. |
| frontend/src/pages/Admin/components/QuizCreator.jsx:94:5 | error | no-unused-vars | 'handleSubmit' is assigned a value but never used. |
| frontend/src/pages/Admin/components/QuizCreator.jsx:95:18 | error | no-unused-vars | 'errors' is assigned a value but never used. |
| frontend/src/pages/Admin/components/QuizCreator.jsx:286:44 | error | react/prop-types | 'existingQuiz.title' is missing in props validation |
| frontend/src/pages/Admin/components/QuizCreator.jsx:287:50 | error | react/prop-types | 'existingQuiz.description' is missing in props validation |
| frontend/src/pages/Admin/components/QuizCreator.jsx:294:48 | error | react/prop-types | 'existingQuiz._id' is missing in props validation |
| frontend/src/pages/Admin/components/QuizCreator.jsx:325:52 | error | react/prop-types | 'existingQuiz._id' is missing in props validation |
| frontend/src/pages/Admin/components/QuizManagement.jsx:373:85 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/pages/Admin/components/RecycleBin.jsx:3:19 | error | no-unused-vars | 'FaUndo' is defined but never used. |
| frontend/src/pages/Admin/components/RecycleBin.jsx:3:88 | error | no-unused-vars | 'FaFilter' is defined but never used. |
| frontend/src/pages/Admin/components/RecycleBin.jsx:13:22 | error | no-unused-vars | 'getRelativeTime' is defined but never used. |
| frontend/src/pages/Admin/components/RecycleBin.jsx:39:8 | warning | react-hooks/exhaustive-deps | React Hook useEffect has missing dependencies: 'fetchRecycleBinItems' and 'fetchStats'. Either include them or remove the dependency array. |
| frontend/src/pages/Admin/components/ReviewManagement.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/Admin/components/ReviewManagement.jsx:7:3 | error | no-unused-vars | 'FaUser' is defined but never used. |
| frontend/src/pages/Admin/components/ReviewManagement.jsx:52:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fetchReviews'. Either include it or remove the dependency array. |
| frontend/src/pages/Admin/components/SiteThemeSettings.jsx:26:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'load'. Either include it or remove the dependency array. |
| frontend/src/pages/Admin/components/StudentProgress/CategoryList.jsx:6:25 | error | react/prop-types | 'onCategorySelect' is missing in props validation |
| frontend/src/pages/Admin/components/StudentProgress/CourseList.jsx:6:23 | error | react/prop-types | 'categoryId' is missing in props validation |
| frontend/src/pages/Admin/components/StudentProgress/CourseList.jsx:6:35 | error | react/prop-types | 'onCourseSelect' is missing in props validation |
| frontend/src/pages/Admin/components/StudentProgress/ProgressDetails.jsx:3:30 | error | no-unused-vars | 'FaCheckCircle' is defined but never used. |
| frontend/src/pages/Admin/components/StudentProgress/ProgressDetails.jsx:3:45 | error | no-unused-vars | 'FaTimesCircle' is defined but never used. |
| frontend/src/pages/Admin/components/StudentProgress/ProgressDetails.jsx:7:28 | error | react/prop-types | 'courseId' is missing in props validation |
| frontend/src/pages/Admin/components/StudentProgress/ProgressDetails.jsx:7:38 | error | react/prop-types | 'studentId' is missing in props validation |
| frontend/src/pages/Admin/components/StudentProgress/StudentList.jsx:7:24 | error | react/prop-types | 'courseId' is missing in props validation |
| frontend/src/pages/Admin/components/StudentProgress/StudentList.jsx:7:34 | error | react/prop-types | 'onStudentSelect' is missing in props validation |
| frontend/src/pages/Admin/components/TeamMembersManagement.jsx:60:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'fetchMembers'. Either include it or remove the dependency array. |
| frontend/src/pages/Admin/components/TeamMembersManagement.jsx:132:48 | error | react/no-unescaped-entities | `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. |
| frontend/src/pages/Admin/components/TeamMembersManagement.jsx:132:69 | error | react/no-unescaped-entities | `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. |
| frontend/src/pages/Admin/components/TeamMembersManagement.jsx:299:48 | error | react/no-unescaped-entities | `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. |
| frontend/src/pages/Admin/components/TeamMembersManagement.jsx:299:59 | error | react/no-unescaped-entities | `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. |
| frontend/src/pages/Admin/components/UserManagement.jsx:3:47 | error | no-unused-vars | 'deleteUser' is defined but never used. |
| frontend/src/pages/Admin/components/UserManagement.jsx:4:67 | error | no-unused-vars | 'bulkRestoreUsers' is defined but never used. |
| frontend/src/pages/Admin/components/UserManagement.jsx:307:13 | error | no-unused-vars | 'result' is assigned a value but never used. |
| frontend/src/pages/Admin/components/UserManagement.jsx:329:13 | error | no-unused-vars | 'result' is assigned a value but never used. |
| frontend/src/pages/Admin/components/UserManagement.jsx:420:11 | error | no-unused-vars | 'headers' is assigned a value but never used. |
| frontend/src/pages/Admin/components/UserManagement.jsx:551:21 | error | no-unused-vars | 'data' is defined but never used. |
| frontend/src/pages/Admin/components/UserManagementClean.jsx:7:11 | error | no-unused-vars | 'token' is assigned a value but never used. |
| frontend/src/pages/Admin/components/UserManagementClean.jsx:52:34 | error | react/no-unescaped-entities | `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. |
| frontend/src/pages/Admin/components/UserManagementClean.jsx:52:46 | error | react/no-unescaped-entities | `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. |
| frontend/src/pages/BackgroundEffect.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/BackgroundEffect.jsx:86:22 | warning | react-hooks/exhaustive-deps | The ref value 'particlesRef.current' will likely have changed by the time this effect cleanup function runs. If this ref points to a node rendered by React, copy 'particlesRef.current' to a variable inside the effect, and use that variable in the cleanup function. |
| frontend/src/pages/BundleCheckout.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/BundleCheckout.jsx:8:56 | error | no-unused-vars | 'FiClock' is defined but never used. |
| frontend/src/pages/BundleCheckout.jsx:74:11 | error | no-unused-vars | 'finalPrice' is assigned a value but never used. |
| frontend/src/pages/BundleCheckout.jsx:75:11 | error | no-unused-vars | 'courseIds' is assigned a value but never used. |
| frontend/src/pages/BundleCheckout.jsx:108:45 | error | no-undef | 'navigadte' is not defined. |
| frontend/src/pages/BundleCheckout.jsx:288:37 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/pages/Business.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/Business.jsx:14:42 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/pages/Business.jsx:14:101 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/pages/Business.jsx:67:71 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/pages/Business.jsx:86:17 | error | react/no-unescaped-entities | `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. |
| frontend/src/pages/Business.jsx:88:51 | error | react/no-unescaped-entities | `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. |
| frontend/src/pages/Business.jsx:97:51 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/pages/Card/components/TeamCard.jsx:97:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/Card/components/TeamCard.jsx:97:17 | error | no-unused-vars | 'Fragment' is defined but never used. |
| frontend/src/pages/Card/components/TeamCard.jsx:104:18 | error | no-unused-vars | 'setPeople' is assigned a value but never used. |
| frontend/src/pages/Careers.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/Careers.jsx:144:15 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/pages/Careers.jsx:144:50 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/pages/Careers.jsx:144:92 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/pages/Careers.jsx:285:43 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/pages/Catalog.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/Catalog.jsx:8:8 | error | no-unused-vars | 'Course_Card' is defined but never used. |
| frontend/src/pages/Catalog.jsx:30:9 | error | no-extra-semi | Unnecessary semicolon. |
| frontend/src/pages/Catalog.jsx:46:13 | error | no-extra-semi | Unnecessary semicolon. |
| frontend/src/pages/Contact.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/CourseCheckout.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/CourseCheckout.jsx:69:11 | error | no-unused-vars | 'finalPrice' is assigned a value but never used. |
| frontend/src/pages/CourseDetails.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/CourseDetails.jsx:18:10 | error | no-unused-vars | 'buyCourse' is defined but never used. |
| frontend/src/pages/CourseDetails.jsx:29:8 | error | no-unused-vars | 'copy' is defined but never used. |
| frontend/src/pages/CourseDetails.jsx:157:10 | error | no-unused-vars | 'course_id' is assigned a value but never used. |
| frontend/src/pages/CourseDetails.jsx:169:7 | error | no-unsafe-optional-chaining | Unsafe usage of optional chaining. If it short-circuits with 'undefined' the evaluation will throw TypeError. |
| frontend/src/pages/CourseDetails.jsx:421:75 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/pages/CourseDetails.jsx:500:77 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/pages/Courses.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/Courses.jsx:5:18 | error | no-unused-vars | 'FaDatabase' is defined but never used. |
| frontend/src/pages/Courses.jsx:5:30 | error | no-unused-vars | 'FaMobile' is defined but never used. |
| frontend/src/pages/Courses.jsx:5:40 | error | no-unused-vars | 'FaCloud' is defined but never used. |
| frontend/src/pages/Courses.jsx:5:49 | error | no-unused-vars | 'FaShieldAlt' is defined but never used. |
| frontend/src/pages/Courses.jsx:5:62 | error | no-unused-vars | 'FaCogs' is defined but never used. |
| frontend/src/pages/Courses.jsx:5:80 | error | no-unused-vars | 'FaFilter' is defined but never used. |
| frontend/src/pages/Courses.jsx:11:26 | error | no-unused-vars | 'setActiveCategory' is assigned a value but never used. |
| frontend/src/pages/Courses.jsx:78:9 | error | no-unused-vars | 'containerVariants' is assigned a value but never used. |
| frontend/src/pages/Courses.jsx:99:25 | error | react/prop-types | 'course' is missing in props validation |
| frontend/src/pages/Courses.jsx:99:33 | error | react/prop-types | 'featured' is missing in props validation |
| frontend/src/pages/Courses.jsx:100:30 | error | react/prop-types | 'course._id' is missing in props validation |
| frontend/src/pages/Courses.jsx:100:45 | error | react/prop-types | 'course.id' is missing in props validation |
| frontend/src/pages/Courses.jsx:103:39 | error | react/prop-types | 'course.studentsEnrolled' is missing in props validation |
| frontend/src/pages/Courses.jsx:104:14 | error | react/prop-types | 'course.studentsEnrolled' is missing in props validation |
| frontend/src/pages/Courses.jsx:104:31 | error | react/prop-types | 'course.studentsEnrolled.some' is missing in props validation |
| frontend/src/pages/Courses.jsx:146:23 | error | react/prop-types | 'course.thumbnail' is missing in props validation |
| frontend/src/pages/Courses.jsx:146:43 | error | react/prop-types | 'course.image' is missing in props validation |
| frontend/src/pages/Courses.jsx:147:23 | error | react/prop-types | 'course.courseName' is missing in props validation |
| frontend/src/pages/Courses.jsx:151:19 | error | react/prop-types | 'course.bestseller' is missing in props validation |
| frontend/src/pages/Courses.jsx:169:74 | error | react/prop-types | 'course.level' is missing in props validation |
| frontend/src/pages/Courses.jsx:176:19 | error | react/prop-types | 'course.courseName' is missing in props validation |
| frontend/src/pages/Courses.jsx:180:19 | error | react/prop-types | 'course.courseDescription' is missing in props validation |
| frontend/src/pages/Courses.jsx:185:33 | error | react/prop-types | 'course.totalDuration' is missing in props validation |
| frontend/src/pages/Courses.jsx:188:33 | error | react/prop-types | 'course.studentsEnrolled' is missing in props validation |
| frontend/src/pages/Courses.jsx:188:51 | error | react/prop-types | 'course.studentsEnrolled.length' is missing in props validation |
| frontend/src/pages/Courses.jsx:191:60 | error | react/prop-types | 'course.averageRating' is missing in props validation |
| frontend/src/pages/Courses.jsx:191:75 | error | react/prop-types | 'course.averageRating.toFixed' is missing in props validation |
| frontend/src/pages/Courses.jsx:196:19 | error | react/prop-types | 'course.tag' is missing in props validation |
| frontend/src/pages/Courses.jsx:196:24 | error | react/prop-types | 'course.tag.slice' is missing in props validation |
| frontend/src/pages/Courses.jsx:204:19 | error | react/prop-types | 'course.tag' is missing in props validation |
| frontend/src/pages/Courses.jsx:204:33 | error | react/prop-types | 'course.tag' is missing in props validation |
| frontend/src/pages/Courses.jsx:204:37 | error | react/prop-types | 'course.tag.length' is missing in props validation |
| frontend/src/pages/Courses.jsx:205:67 | error | react/prop-types | 'course.tag' is missing in props validation |
| frontend/src/pages/Courses.jsx:205:71 | error | react/prop-types | 'course.tag.length' is missing in props validation |
| frontend/src/pages/Courses.jsx:211:21 | error | react/prop-types | 'course.courseType' is missing in props validation |
| frontend/src/pages/Courses.jsx:211:53 | error | react/prop-types | 'course.adminSetFree' is missing in props validation |
| frontend/src/pages/Courses.jsx:215:78 | error | react/prop-types | 'course.price' is missing in props validation |
| frontend/src/pages/Courses.jsx:216:25 | error | react/prop-types | 'course.originalPrice' is missing in props validation |
| frontend/src/pages/Courses.jsx:216:49 | error | react/prop-types | 'course.originalPrice' is missing in props validation |
| frontend/src/pages/Courses.jsx:216:74 | error | react/prop-types | 'course.price' is missing in props validation |
| frontend/src/pages/Courses.jsx:217:83 | error | react/prop-types | 'course.originalPrice' is missing in props validation |
| frontend/src/pages/Courses.jsx:233:23 | error | react/prop-types | 'course.instructor' is missing in props validation |
| frontend/src/pages/Courses.jsx:233:35 | error | react/prop-types | 'course.instructor.firstName' is missing in props validation |
| frontend/src/pages/Courses.jsx:233:54 | error | react/prop-types | 'course.instructor' is missing in props validation |
| frontend/src/pages/Courses.jsx:233:66 | error | react/prop-types | 'course.instructor.lastName' is missing in props validation |
| frontend/src/pages/Dashboard.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/Dashboard.jsx:5:8 | error | no-unused-vars | 'Loading' is defined but never used. |
| frontend/src/pages/Dashboard.jsx:21:5 | error | react-hooks/rules-of-hooks | React Hook "useEffect" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return? |
| frontend/src/pages/Dashboard/AdminChats.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/Dashboard/AdminChats.jsx:7:3 | error | no-unused-vars | 'BsFilter' is defined but never used. |
| frontend/src/pages/Dashboard/AdminChats.jsx:55:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'loadChats'. Either include it or remove the dependency array. |
| frontend/src/pages/Dashboard/AdminChats.jsx:59:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'filterChats'. Either include it or remove the dependency array. |
| frontend/src/pages/Dashboard/Certificates.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/Dashboard/Certificates.jsx:41:20 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/pages/Dashboard/InstructorChats.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/Dashboard/InstructorChats.jsx:32:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'loadChats'. Either include it or remove the dependency array. |
| frontend/src/pages/Dashboard/InstructorChats.jsx:36:6 | warning | react-hooks/exhaustive-deps | React Hook useEffect has a missing dependency: 'filterChats'. Either include it or remove the dependency array. |
| frontend/src/pages/EnhancedDashboard.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/EnhancedDashboard.jsx:110:5 | error | react-hooks/rules-of-hooks | React Hook "useEffect" is called conditionally. React Hooks must be called in the exact same order in every component render. Did you accidentally call a React Hook after an early return? |
| frontend/src/pages/Faqs.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/FinalDynamicCareers.jsx:3:80 | error | no-unused-vars | 'FaEnvelope' is defined but never used. |
| frontend/src/pages/FinalDynamicCareers.jsx:8:8 | error | no-unused-vars | 'styles' is defined but never used. |
| frontend/src/pages/FinalDynamicCareers.jsx:11:25 | error | react/display-name | Component definition is missing display name |
| frontend/src/pages/FinalDynamicCareers.jsx:11:39 | error | react/prop-types | 'selectedJob' is missing in props validation |
| frontend/src/pages/FinalDynamicCareers.jsx:11:52 | error | react/prop-types | 'onClose' is missing in props validation |
| frontend/src/pages/FinalDynamicCareers.jsx:11:61 | error | react/prop-types | 'onSubmit' is missing in props validation |
| frontend/src/pages/FinalDynamicCareers.jsx:83:51 | error | react/prop-types | 'selectedJob._id' is missing in props validation |
| frontend/src/pages/FinalDynamicCareers.jsx:114:6 | warning | react-hooks/exhaustive-deps | React Hook useCallback has a missing dependency: 'token'. Either include it or remove the dependency array. |
| frontend/src/pages/FinalDynamicCareers.jsx:129:38 | error | react/prop-types | 'selectedJob.title' is missing in props validation |
| frontend/src/pages/FinalDynamicCareers.jsx:132:28 | error | react/prop-types | 'selectedJob.department' is missing in props validation |
| frontend/src/pages/FinalDynamicCareers.jsx:132:55 | error | react/prop-types | 'selectedJob.location' is missing in props validation |
| frontend/src/pages/FinalDynamicCareers.jsx:296:11 | error | no-unused-vars | 'token' is assigned a value but never used. |
| frontend/src/pages/FinalDynamicCareers.jsx:462:15 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/pages/FinalDynamicCareers.jsx:462:50 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/pages/FinalDynamicCareers.jsx:462:92 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/pages/ForgotPassword.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/ForgotPassword.jsx:50:48 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/pages/ForgotPassword.jsx:53:65 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/pages/Home.jsx:3:10 | error | no-unused-vars | 'Link' is defined but never used. |
| frontend/src/pages/Home.jsx:12:8 | error | no-unused-vars | 'LearningLanguageSection' is defined but never used. |
| frontend/src/pages/Home.jsx:27:10 | error | no-unused-vars | 'FaArrowRight' is defined but never used. |
| frontend/src/pages/Home.jsx:39:9 | error | no-unused-vars | 'dispatch' is assigned a value but never used. |
| frontend/src/pages/Home.jsx:281:45 | error | no-useless-escape | Unnecessary escape character: \". |
| frontend/src/pages/Home.jsx:281:52 | error | no-useless-escape | Unnecessary escape character: \". |
| frontend/src/pages/InstituteService.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/InstituteService.jsx:147:85 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/pages/InstituteService.jsx:147:106 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/pages/InstituteService.jsx:175:28 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/pages/PIDLogin.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/PageNotFound.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/PageNotFound.jsx:17:32 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/pages/Partnership.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/Partnership.jsx:52:17 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/pages/Partnership.jsx:126:57 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/pages/PlanActivation.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/PlanActivation.jsx:45:36 | error | no-unused-vars | 'planData' is defined but never used. |
| frontend/src/pages/PlanActivation.jsx:45:46 | error | no-unused-vars | 'lmsData' is defined but never used. |
| frontend/src/pages/PlanDashboard.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/PressHours.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/PressHours.jsx:33:41 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/pages/PrivacyPolicy.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/PrivacyPolicy.jsx:514:17 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/pages/Resources.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/Resources.jsx:3:92 | error | no-unused-vars | 'FaFilter' is defined but never used. |
| frontend/src/pages/Resources.jsx:110:9 | error | no-unused-vars | 'containerVariants' is assigned a value but never used. |
| frontend/src/pages/Resources.jsx:142:27 | error | react/prop-types | 'resource' is missing in props validation |
| frontend/src/pages/Resources.jsx:142:37 | error | react/prop-types | 'featured' is missing in props validation |
| frontend/src/pages/Resources.jsx:152:33 | error | react/prop-types | 'resource.type' is missing in props validation |
| frontend/src/pages/Resources.jsx:157:25 | error | react/prop-types | 'resource.title' is missing in props validation |
| frontend/src/pages/Resources.jsx:159:68 | error | react/prop-types | 'resource.type' is missing in props validation |
| frontend/src/pages/Resources.jsx:170:19 | error | react/prop-types | 'resource.description' is missing in props validation |
| frontend/src/pages/Resources.jsx:175:21 | error | react/prop-types | 'resource.downloads' is missing in props validation |
| frontend/src/pages/Resources.jsx:177:40 | error | react/prop-types | 'resource.downloads' is missing in props validation |
| frontend/src/pages/Resources.jsx:181:62 | error | react/prop-types | 'resource.rating' is missing in props validation |
| frontend/src/pages/Resources.jsx:185:21 | error | react/prop-types | 'resource.type' is missing in props validation |
| frontend/src/pages/Resources.jsx:185:52 | error | react/prop-types | 'resource.type' is missing in props validation |
| frontend/src/pages/Resources.jsx:186:21 | error | react/prop-types | 'resource.type' is missing in props validation |
| frontend/src/pages/Resources.jsx:186:52 | error | react/prop-types | 'resource.type' is missing in props validation |
| frontend/src/pages/SSOLogin.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/StudentService.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/StudentService.jsx:3:18 | error | no-unused-vars | 'bounce' is defined but never used. |
| frontend/src/pages/StudentService.jsx:4:8 | error | no-unused-vars | 'HighlightText' is defined but never used. |
| frontend/src/pages/StudentService.jsx:17:3 | error | no-unused-vars | 'FaPlay' is defined but never used. |
| frontend/src/pages/StudentService.jsx:77:9 | error | no-unused-vars | 'stats' is assigned a value but never used. |
| frontend/src/pages/StudentService.jsx:163:21 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/pages/StudentService.jsx:327:45 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/pages/Support.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/Support.jsx:152:15 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/pages/Support.jsx:379:18 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/pages/Support.jsx:379:34 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/pages/Support.jsx:380:45 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/pages/TempPage.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/Terms.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/Terms.jsx:21:49 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/pages/Terms.jsx:113:89 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/pages/Terms.jsx:198:49 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/pages/Terms.jsx:351:111 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/pages/TestAnalytics.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/Testimonials.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/Testimonials.jsx:3:31 | error | no-unused-vars | 'FaLinkedin' is defined but never used. |
| frontend/src/pages/Testimonials.jsx:3:43 | error | no-unused-vars | 'FaTwitter' is defined but never used. |
| frontend/src/pages/Testimonials.jsx:3:54 | error | no-unused-vars | 'FaFilter' is defined but never used. |
| frontend/src/pages/Testimonials.jsx:152:9 | error | no-unused-vars | 'containerVariants' is assigned a value but never used. |
| frontend/src/pages/Testimonials.jsx:173:30 | error | react/prop-types | 'testimonial' is missing in props validation |
| frontend/src/pages/Testimonials.jsx:173:43 | error | react/prop-types | 'featured' is missing in props validation |
| frontend/src/pages/Testimonials.jsx:189:22 | error | react/prop-types | 'testimonial.videoTestimonial' is missing in props validation |
| frontend/src/pages/Testimonials.jsx:197:9 | error | react/no-unescaped-entities | `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. |
| frontend/src/pages/Testimonials.jsx:197:23 | error | react/prop-types | 'testimonial.content' is missing in props validation |
| frontend/src/pages/Testimonials.jsx:197:31 | error | react/no-unescaped-entities | `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`. |
| frontend/src/pages/Testimonials.jsx:202:28 | error | react/prop-types | 'testimonial.image' is missing in props validation |
| frontend/src/pages/Testimonials.jsx:203:28 | error | react/prop-types | 'testimonial.name' is missing in props validation |
| frontend/src/pages/Testimonials.jsx:207:80 | error | react/prop-types | 'testimonial.name' is missing in props validation |
| frontend/src/pages/Testimonials.jsx:208:66 | error | react/prop-types | 'testimonial.role' is missing in props validation |
| frontend/src/pages/Testimonials.jsx:209:62 | error | react/prop-types | 'testimonial.company' is missing in props validation |
| frontend/src/pages/Testimonials.jsx:215:53 | error | react/prop-types | 'testimonial.rating' is missing in props validation |
| frontend/src/pages/Testimonials.jsx:223:106 | error | react/prop-types | 'testimonial.course' is missing in props validation |
| frontend/src/pages/Testimonials.jsx:226:58 | error | react/prop-types | 'testimonial.salaryIncrease' is missing in props validation |
| frontend/src/pages/Testimonials.jsx:227:63 | error | react/prop-types | 'testimonial.timeToJob' is missing in props validation |
| frontend/src/pages/UpdatePassword.jsx:150:57 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/pages/VerifyCertificate.jsx:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/pages/VerifyGoogleOTP.jsx:60:15 | error | react/no-unescaped-entities | `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`. |
| frontend/src/pages/ViewCourse.jsx:5:10 | error | no-unused-vars | 'FiChevronLeft' is defined but never used. |
| frontend/src/services/operations/couponAPI.js:6:66 | error | no-unused-vars | 'VALIDATE_COUPON_API' is assigned a value but never used. |
| frontend/src/services/operations/couponAPI.js:6:87 | error | no-unused-vars | 'APPLY_COUPON_API' is assigned a value but never used. |
| frontend/src/services/operations/couponAPI.js:9:17 | error | no-unused-vars | 'dispatch' is defined but never used. |
| frontend/src/services/operations/courseDetailsAPI.js:2:7 | error | no-unused-vars | 'BASE_URL' is assigned a value but never used. |
| frontend/src/services/operations/courseDetailsAPI.js:3:10 | error | no-unused-vars | 'updateCompletedLectures' is defined but never used. |
| frontend/src/services/operations/courseProgressAPI.js:1:10 | error | no-unused-vars | 'toast' is defined but never used. |
| frontend/src/services/operations/emailAPI.js:1:10 | error | no-unused-vars | 'toast' is defined but never used. |
| frontend/src/services/operations/jobsAPI.js:18:3 | error | no-unused-vars | 'GET_APPLICATION_BY_ID_API' is assigned a value but never used. |
| frontend/src/services/operations/jobsAPI.js:19:3 | error | no-unused-vars | 'DELETE_APPLICATION_API' is assigned a value but never used. |
| frontend/src/services/operations/jobsAPI.js:21:3 | error | no-unused-vars | 'GET_APPLICATION_STATISTICS_API' is assigned a value but never used. |
| frontend/src/services/operations/pageAndComponentData.js:1:8 | error | no-unused-vars | 'React' is defined but never used. |
| frontend/src/services/operations/studentFeaturesAPI.js:5:10 | error | no-unused-vars | 'setPaymentLoading' is defined but never used. |
| frontend/src/services/operations/studentFeaturesAPI.js:240:16 | error | no-unused-vars | 'sendPaymentSuccessEmail' is defined but never used. |
| frontend/src/services/phpIntegrationService.js:2:10 | error | no-unused-vars | 'toast' is defined but never used. |
| frontend/src/services/planService.js:9:3 | error | no-unused-vars | 'GET_ACTIVE_PLANS_API' is assigned a value but never used. |
| frontend/src/services/planService.js:11:3 | error | no-unused-vars | 'GET_MY_PLANS_API' is assigned a value but never used. |
| frontend/src/services/planService.js:12:3 | error | no-unused-vars | 'CONSUME_SKILL_TEST_API' is assigned a value but never used. |
| frontend/src/services/planService.js:13:3 | error | no-unused-vars | 'CONSUME_COURSE_API' is assigned a value but never used. |
| frontend/src/services/planService.js:14:3 | error | no-unused-vars | 'CONSUME_INTERNSHIP_API' is assigned a value but never used. |
| frontend/src/services/planService.js:21:3 | error | no-unused-vars | 'INITIALIZE_COURSE_API' is assigned a value but never used. |
| frontend/src/services/planService.js:22:3 | error | no-unused-vars | 'ENROLL_IN_COURSE_API' is assigned a value but never used. |
| frontend/src/services/planService.js:23:3 | error | no-unused-vars | 'INITIALIZE_INTERNSHIP_API' is assigned a value but never used. |
| frontend/src/services/planService.js:24:3 | error | no-unused-vars | 'START_INTERNSHIP_API' is assigned a value but never used. |
| frontend/src/services/planService.js:38:44 | error | no-unused-vars | 'token' is assigned a value but never used. |
| frontend/src/services/planService.js:63:83 | error | no-unused-vars | 'token' is assigned a value but never used. |
| frontend/src/services/planService.js:146:3 | error | no-useless-catch | Unnecessary try/catch wrapper. |
| frontend/src/services/planService.js:325:3 | error | no-useless-catch | Unnecessary try/catch wrapper. |
| frontend/src/services/planService.js:405:3 | error | no-useless-catch | Unnecessary try/catch wrapper. |
| frontend/src/utils/directUpload.js:1:10 | error | no-unused-vars | 'supabase' is defined but never used. |
| frontend/src/utils/directUpload.js:1:20 | error | no-unused-vars | 'UPLOAD_CONFIG' is defined but never used. |
| frontend/src/utils/directUpload.js:1:35 | error | no-unused-vars | 'getBucketForFileType' is defined but never used. |
| frontend/src/utils/directUpload.js:1:57 | error | no-unused-vars | 'validateFile' is defined but never used. |
| frontend/src/utils/directUpload.js:1:71 | error | no-unused-vars | 'shouldUseResumableUpload' is defined but never used. |
| frontend/src/utils/directUpload.js:66:55 | error | no-unused-vars | 'onProgress' is assigned a value but never used. |
| frontend/src/utils/directUpload.js:173:34 | error | no-unused-vars | 'options' is assigned a value but never used. |
| frontend/src/utils/generateAdminQuizReportPDF.js:39:13 | error | no-unused-vars | 'alpha' is assigned a value but never used. |
| frontend/src/utils/generateAttendancePDF.js:4:79 | error | no-unused-vars | 'studentInfo' is defined but never used. |
| frontend/src/utils/generateAttendancePDF.js:11:9 | error | no-unused-vars | 'warningColor' is assigned a value but never used. |
| frontend/src/utils/generateAttendancePDF.js:12:9 | error | no-unused-vars | 'dangerColor' is assigned a value but never used. |
| frontend/src/utils/generateCourseMarksheetPDF.js:76:32 | error | no-unused-vars | 'index' is defined but never used. |
| frontend/src/utils/generateCoursePerformancePDF.js:5:7 | error | no-unused-vars | 'drawSimplePieChart' is assigned a value but never used. |
| frontend/src/utils/generateCoursePerformancePDF.js:70:7 | error | no-unused-vars | 'drawHorizontalBarChart' is assigned a value but never used. |
| frontend/src/utils/generateCoursePerformancePDF.js:111:7 | error | no-unused-vars | 'drawSimpleTrendChart' is assigned a value but never used. |
| frontend/src/utils/generateCoursePerformancePDF.js:181:11 | error | no-unused-vars | 'warningColor' is assigned a value but never used. |
| frontend/src/utils/generateCoursePerformancePDF.js:255:11 | error | no-unused-vars | 'stats' is assigned a value but never used. |
| frontend/src/utils/generateCoursePerformancePDF.js:517:32 | error | no-unused-vars | 'idx' is defined but never used. |
| frontend/src/utils/generateMarkReportPDF.js:62:32 | error | no-unused-vars | 'index' is defined but never used. |
| frontend/src/utils/generateMarksheetPDF.js:27:11 | error | no-unused-vars | 'headerBg' is assigned a value but never used. |
| frontend/src/utils/generateQuizPerformancePDF.js:5:7 | error | no-unused-vars | 'drawBarChart' is assigned a value but never used. |
| frontend/src/utils/generateQuizPerformancePDF.js:47:7 | error | no-unused-vars | 'drawSimplePieChart' is assigned a value but never used. |
| frontend/src/utils/generateQuizPerformancePDF.js:103:7 | error | no-unused-vars | 'drawSimpleLineChart' is assigned a value but never used. |
| frontend/src/utils/generateStudentReportPDF.js:203:46 | error | no-unused-vars | 'index' is defined but never used. |
| frontend/src/utils/videoUtils.js:15:41 | error | no-undef | 'process' is not defined. |
| frontend/src/utils/videoUtils.js:15:56 | error | no-undef | 'process' is not defined. |
| frontend/src/utils/videoUtils.js:16:12 | error | no-undef | 'process' is not defined. |
