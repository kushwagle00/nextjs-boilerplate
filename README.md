# Device Protection Portal

A Next.js demonstration of agent enrollment, customer device registration, plan limits, and subscription cancellation. The GitHub repository retains its original `nextjs-boilerplate` name.

**Ready for a local demo with synthetic data. Not ready to process real payments or serve real customer accounts.** See [the review](REVIEW.md) for findings, verification, and remaining production work.

## Run the demo

Use Node.js 24 and pnpm 11.25.0.

```sh
pnpm install --frozen-lockfile
pnpm demo
```

Open http://127.0.0.1:3000. No database account or environment file is needed. The launcher generates a local signing secret and initializes a persistent PGlite PostgreSQL database in `.demo-data/`. Both are ignored by Git.

| Role | Email | Credential |
| --- | --- | --- |
| Agent | agent@example.com | Password: DemoAgent123! |
| Customer | alex@example.com | Phone: 2025550100 |

Local demo accounts are deliberately public test credentials. The launcher binds to loopback. Use synthetic information only.

For the production build of the **demo**:

```sh
pnpm build
pnpm demo:start
```

Stop the running server before starting another instance against the same local database. Local PGlite storage is intended for one server process, not serverless or multiple replicas. A fresh `DEMO_DATA_DIR` creates a separate demo dataset.

## Five-minute walkthrough

1. Sign in as the agent and select **Enroll Customer**.
2. Enter a fictitious name, unique email, 10-digit phone number, and US address.
3. Select Phone Plan ($9.99 simulated monthly price) or Gadget + Phone ($19.99).
4. Use **4242 4242 4242 4242**, a future MM/YY expiry, and **101** for approval. **010** demonstrates a decline. Other card numbers and CVVs are rejected. No charge, insurance, or coverage is created.
5. Submit enrollment and review the customer details.
6. Sign out, then use Customer Login with that email and phone. Register a phone or gadget.
7. Return as the agent, search for that customer, view/remove their devices, and cancel the subscription. Cancellation invalidates access on subsequent customer requests.

Phone Plan allows one phone and no gadgets. Gadget + Phone permits multiple supported devices. The API checks the current database state; a database trigger also enforces limits during concurrent requests. Agents share access to customers in this single-organization demonstration.

## Configuration and hosting

`.env.example` documents the variables. `pnpm dev` and `pnpm start` use explicit configuration; only the demo launcher creates a signing secret.

- `DEMO_MODE=true`: enables simulated enrollment and email/phone customer lookup.
- `SESSION_SECRET`: at least 32 random characters; required on hosting and when using Next directly. Rotating it signs everyone out.
- `DEMO_DATABASE_URL`: optional **dedicated synthetic-data Neon database** for a hosted demo. Demo mode never uses `DATABASE_URL`.
- `DATABASE_URL`: non-demo Neon database. Customer lookup and simulated enrollment are disabled when demo mode is off.
- `ENROLLMENT_API_KEY`: optional 32+ character bearer key for enrollment integration testing. Treat it as a secret.
- `DEMO_DATA_DIR`: local data folder override; not used when a demo Neon URL is set.

Local storage is rejected on Vercel. To host a demo, configure `DEMO_MODE`, `DEMO_DATABASE_URL`, and `SESSION_SECRET`, then run the following **against that dedicated demo database**:

```sh
pnpm db:migrate
# Set AGENT_EMAIL, AGENT_PASSWORD (12+ characters), and optionally AGENT_NAME in the environment.
pnpm db:create-agent
pnpm build
pnpm start
```

The migration is idempotent, adds missing columns and indexes, and installs the plan guard. A unique case-insensitive email index prevents ambiguous customer login. Existing duplicate customer emails must be resolved before migration; the script will fail rather than remove records. Account provisioning does not replace existing passwords. Public agent registration is disabled.

No live database migration was run during this review. Neon migration/deployment still needs verification in the hosting environment. The repository's old Vercel URL returned HTTP 404 during review.

Before real use, integrate verified customer authentication and hosted payment fields/webhooks, replace demo credentials/data, add distributed login throttling and session revocation, and complete operational/security review. Customer email plus phone is explicitly a demo lookup, not proof of identity.

## Checks

```sh
pnpm lint
pnpm typecheck
pnpm test:ci
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
pnpm audit --prod
```

Browser tests launch the production build on port 3100 with a new isolated database per run. They cover the full UI walkthrough, mobile layout, unauthorized/forged sessions, ownership, malformed input, payment decline, duplicate enrollment, concurrent device limits, cancellation, and logout. Screenshots and failure traces appear in `test-results/`.

GitHub Actions runs lint, types, unit tests, build, browser tests, and the production dependency audit. Historical debugging notes in the repository are retained for context and are superseded by this README.

