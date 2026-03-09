# Demo readiness review

Reviewed November 13, 2026. Baseline commit: `4d1d21848487aec222c50cccdde129a76c65a18d`.

## Verdict

The original application was not ready for a reliable or safe demo. The revised application supports an isolated local demonstration with synthetic data. It is not a production payment/insurance platform. The previous hosted Vercel URL returned HTTP 404; this review does not claim a successful hosted deployment.

## Findings and fixes

| Severity | Baseline finding | Result |
| --- | --- | --- |
| Critical | Any valid email authenticated an agent. Agent routes checked only cookie presence; customer routes trusted unsigned JSON. The older session helper ignored its token. | Agent password verification and HMAC-signed, role-bound, expiring cookies; every sensitive route and portal layout validates the session. |
| Critical | POST /api/customers/cancel had no authentication and wrote nonexistent status fields. | Authenticated shared cancellation implementation, correct subscription/payment fields, 404 for missing customers. |
| High | Alternate device endpoints bypassed plan limits; cancelled customers could continue adding devices. | Shared validation, database-backed active-plan checks, and a locking database trigger for concurrent insert limits. Cancelled customers lose access on subsequent requests. |
| High | Build errors were hidden. Dashboard imported redirect from the wrong module; the landing page contained broken unused forms. | Strict production build restored; invalid imports/components removed and types corrected. |
| High | Installed dependencies had critical/high published advisories. | Updated Next.js, React, Zod, compatible dependencies, and targeted transitive fixes. No high/moderate/critical advisories remain at final verification. |
| High | No reproducible environment/database setup or working lint command. | Local seeded PostgreSQL demo, documented environment contract, migration and agent provisioning commands, functioning lint and CI. |
| Medium | Simulated payments were presented as secure/PCI-compliant processing; unsupported claims/support features were advertised. | Persistent demo notice, test-card-only API, accurate copy; real enrollment disabled until a payment integration exists. |
| Medium | Current-month cards were rejected and date-dependent test fixtures had expired. | Month-end expiry validation and dynamic fixtures with explicit date boundary regression tests. |
| Medium | Customer emails were not unique; duplicate records made login ambiguous. | Normalization, duplicate response, and a unique case-insensitive database index. |
| Medium | Address autocomplete sent customer address queries to a third party and failed offline. | Accessible manual address entry with no external geocoding dependency. |
| Medium | No meaningful end-to-end proof of the critical paths. | Production-build API and Chromium tests covering authentication, enrollment, devices, plan concurrency, cancellation, and mobile rendering. |
| Low | Missing mobile navigation labels and unavailable font fallbacks. | Accessible navigation labels and reliable local system font stacks. |

## Verification

Final local results: 60 unit tests and four browser/API scenarios passed; build, type checking, lint, and production dependency audit passed. Jest line coverage is 3.45% across the whole repository, including its unused UI scaffolding. Browser/API execution is separate from that metric; this is focused acceptance testing, not exhaustive coverage.

- Production build succeeds with TypeScript checking enabled and no database credentials required at build time.
- Unit tests cover schemas, session tampering/expiry/roles, password verification, current-month expiry, and invalid calendar dates.
- Browser/API tests run against a real isolated PGlite PostgreSQL database, not mocked SQL.
- Complete desktop UI flow: agent login, enrollment, customer login, gadget registration, and displayed device.
- Mobile landing/sign-in at 390 px: no horizontal overflow or browser runtime errors.
- All sensitive endpoints reject anonymous access; legacy and forged cookies are rejected.
- Alternate device endpoints enforce plan eligibility; concurrent phone insert requests permit exactly one phone.
- Cancellation prevents subsequent profile/device access; logout removes browser access.
- Lint and dependency peer checks succeed.
- Production dependency audit is clean. One low-severity unpatched `deepmerge` advisory remains in Jest's development-only dependency tree; no untrusted configuration is fed to it.

## Limits and remaining production work

The demo customer login uses email and phone and is deliberately disabled outside demo mode. It needs a verified identity provider/OTP flow before real accounts. Payments are simulated; hosted payment fields, provider tokens, webhooks, idempotency, refunds, and reconciliation are not implemented. No actual insurance policy, claims workflow, or support service is included.

Stateless signed sessions expire after 24 hours; add server-side revocation and distributed login throttling for production. Agent access is shared within one organization; multi-tenant or per-agent record restrictions would require a defined authorization model.

Local persistence is single-process. Hosted demos require an explicitly separate Neon demo database and a stable signing secret. No real customer data, remote database schema, or Vercel configuration was modified. Browser tests do not establish production capacity, full accessibility compliance, or hosting readiness.

## Commit metadata

The repository was created March 5, 2026 at 16:12:36 UTC. Per the owner's request, the corrective work is organized into five logical commits, dated once per day from March 5 through March 9, 2026, at 16:12:36 UTC. The review, validation, and history reorganization were performed on November 13, 2026. Earlier project commits are preserved; these dates are requested commit metadata, not the actual execution times.

