# Contributing to the Stock Management System

Thanks for contributing. Please read `docs/SRS.docx` and `docs/Stock_Management_Workflow.pdf` before starting any work, and see `AGENTS.md` for the repo conventions.

## Branching

- `main` and `develop` are **protected**. Never push to them directly and never force-push.
- All work branches off **`develop`**.
- Branch naming: `feature/<module>-<short-desc>`

  Examples:
  - `feature/auth-jwt-rbac`
  - `feature/inventory-fifo-valuation`
  - `feature/stock-receiving-grn`

- Every feature merges via a **pull request** into `develop`. Releases merge from `develop` into `main`.

## Commit messages (Conventional Commits)

Use the Conventional Commits format:

```
<type>(<scope>): <subject>
```

- `type`: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`, `build`, `ci`, `perf`
- `scope`: the module name (e.g. `inventory`, `auth`, `stock-issuing`) or `server`/`client` for cross-cutting changes
- `subject`: imperative, lowercase, no trailing period

Examples:

```
feat(inventory): implement FIFO cost layering on issues
fix(auth): validate refresh token expiry before issue
test(stock-receiving): add integration test for GRN creation
docs: update AGENTS.md with module list
```

## Pull request checklist

Before opening a PR against `develop`:

- [ ] Branch is `feature/<module>-<short-desc>` branched from `develop`.
- [ ] Re-read the relevant section of `docs/SRS.docx` and `docs/Stock_Management_Workflow.pdf`; the implementation matches it. Flag ambiguities in the PR instead of guessing.
- [ ] Backend module uses `server/src/modules/<module>/` layout (`controller.ts`, `service.ts`, `routes.ts`, `validation.ts`).
- [ ] Frontend feature uses `client/src/features/<feature>/` layout (`api.ts`, `hooks.ts`, `components/`).
- [ ] All input is validated (express-validator/zod); errors go through the shared error middleware.
- [ ] Every authenticated route declares its allowed roles (RBAC middleware).
- [ ] DB access is Prisma-only (no raw SQL unless justified and documented).
- [ ] **At least one integration test** (Supertest) exists for the module in `server/tests/integration/`.
- [ ] FIFO logic (if touched) has dedicated tests: cost layering, partial consumption, negative-balance prevention.
- [ ] Filled in the PR template (`.github/PULL_REQUEST_TEMPLATE.md`): what changed, related issue, SRS section reference, how it was tested.
- [ ] Local checks pass (see below).

## Running checks locally

```bash
# Server (Node 18+)
cd server
npm install
cp .env.example .env            # then set DATABASE_URL for a local PostgreSQL
npm run prisma:generate
npm run lint
npm run typecheck
npm test
npm run dev                     # http://localhost:5000

# Client
cd client
npm install
npm run lint
npm run format:check
npm run build
npm run dev                     # http://localhost:5173 (proxies /api to the server)
```

Run the full suite before pushing. CI (`.github/workflows/ci.yml`) runs the same checks on every PR.
