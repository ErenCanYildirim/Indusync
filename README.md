# Indusync

A B2B industrial procurement platform for the German SME and enterprise market, covering the full **tender-to-contract lifecycle**: tender publishing, subcontractor matching, contract management, deadline negotiation, document handling, and bidirectional reviews.

Built as a production-deployed SaaS during university. The platform was live and operational before being taken offline due to infrastructure costs.

Link: https://www.indusync.eu/

I am publishing the codebase here as a reference for other developers interested in a platform written from scratch here.

> **Architecture note:**

The codebase is structured as a **Domain-Driven Design modular monolith** (Java/Spring Boot backend, Next.js frontend). The modules: `authentication`, `company`, `order`, `review`, `dashboard`, `notification`, are designed with clear boundaries and could be extracted into separate services if needed. Spring Boot was chosen deliberately for the German enterprise market as it is the dominant stack in German corporate environments, which eases integration acceptance, supports future CRM integrations, and positions the platform for potential acquisition or licensing by larger industrial companies.

---
 
## Table of Contents
 
- [What It Does](#what-it-does)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Matching Engine](#matching-engine)
- [Security](#security)
- [Key Modules](#key-modules)
- [DevSecOps Pipeline](#devsecops-pipeline)
- [Running Locally](#running-locally)
- [Contributors](#contributors)

---
 
## What It Does

Industrial companies (clients) publish procurement tenders. Subcontractors (providers) are automatically matched to relevant tenders based on a weighted scoring algorithm. The full lifecycle then plays out on the platform:

1. Client publishes a tender with required skills, certifications, location, and deadline
2. Matching engine scores and ranks eligible subcontractors
3. Providers express interest; client selects a provider
4. Order moves to `IN_PROGRESS` with deadline management and document exchange
5. Completion is requested, reviewed, and confirmed by both parties
6. Both sides leave structured reviews across multiple rating dimensions

---
 
## Tech Stack
 

| Layer | Technology | Rationale |
|---|---|---|
| Backend | Java, Spring Boot | Standard in German enterprise; strong security and integration ecosystem |
| Frontend | Next.js 14, TypeScript | SSR for SEO; type safety across the stack |
| Database | PostgreSQL | Relational integrity for complex order/match relationships |
| Cache | Redis | Session management, rate limiting, JWT blacklist |
| File Storage | Cloudinary | Document and image storage |
| Auth | JWT (custom security layer) | Key rotation, entropy validation, session risk scoring |
| Migrations | Flyway | Versioned schema management |
| Containerisation | Docker, Docker Compose | Reproducible local and production environments |
| Observability | Micrometer | Matching engine metrics: candidate count, score distribution, duration |

---
 
## Architecture

 
```
backend/src/main/java/com/indusync/indusync_backend/
├── authentication/     # User registration, login, sessions, password management
├── company/            # Company registration, roles, T&Cs, document management
├── order/              # Full order lifecycle, matching engine, deadlines, completion
├── review/             # Bidirectional reviews and ratings aggregation
├── dashboard/          # Statistics and activity data per company role
├── notification/       # Event-driven email notifications
└── shared/             # Cross-cutting: security, JWT, enums, value objects, exceptions
```

Each module follows the same internal structure: `api` (controllers + DTOs) → `application` (services + commands) → `domain` (entities + repositories + events). Modules communicate via Spring's `ApplicationEventPublisher` rather than direct service calls, keeping boundaries clean.
 
Key domain value objects live in `shared/domain/valueobjects/`:
- `Address`, `GeoLocation`, `EmailAddress`, `ContactPerson`

---
 
## Matching Engine

**Entry point:** [`order/application/OrderMatchingService.java`](backend/src/main/java/com/indusync/indusync_backend/order/application/OrderMatchingService.java)
 

When a tender is published, the engine:
 
1. Queries the database for all provider companies within the specified geographic radius using the **Haversine formula**
2. Scores each candidate across six weighted dimensions
3. Persists `OrderMatch` records for all candidates scoring above zero
4. Publishes an `OrderMatchedEvent` for downstream notifications


### Scoring Dimensions
 
| Dimension | Weight | Scoring Logic |
|---|---|---|
| Skills / Specializations | 35% | Exact match = 1.0 · Same taxonomy category = 0.2 · Fuzzy prefix match = 0.6 |
| Industry Branch | 20% | Proportional to fraction of required industries matched |
| Operational Radius | 20% | Within provider's radius = 1.0 · Within 10km over = 0.5 · Beyond = 0.0 |
| Contract Type | 10% | Exact match = 1.0 · Unknown capability = 0.5 |
| Certifications | 10% | Any uploaded certification = 1.0 · None = 0.0 |
| Verification Status | 5% | Verified = 1.0 · Not verified = 0.2 (floored) |


Weights are configurable per-query via `weightOverrides` on the `OrderPublishedEvent`, allowing clients to tune scoring for specialist tenders.

 
**Skills taxonomy:** [`shared/taxonomy/SkillTaxonomyService.java`](backend/src/main/java/com/indusync/indusync_backend/shared/taxonomy/SkillTaxonomyService.java) — loaded from [`resources/taxonomy/specializations.json`](backend/src/main/resources/taxonomy/specializations.json). Provides category-based grouping and fuzzy prefix similarity for skill matching.

**Matching query history** is persisted as `MatchingQuery` entities, storing the full query payload (JSONB), result count, average score, and best match score — allowing clients to review and re-run past queries.

**Preview mode:** `findMatchesForPreview()` runs the full scoring pipeline without persisting results, so clients can see projected matches before publishing a tender. Entry point: [`order/application/MatchingPreviewService.java`](backend/src/main/java/com/indusync/indusync_backend/order/application/MatchingPreviewService.java)
 
**Scoring tests:** [`order/application/OrderMatchingServiceScoringTests.java`](backend/src/test/java/com/indusync/indusync_backend/order/application/OrderMatchingServiceScoringTests.java) -> unit tests for each scoring dimension using reflection to test private methods without changing production visibility.

---
 
## Security


**Entry point:** [`shared/security/`](backend/src/main/java/com/indusync/indusync_backend/shared/security/)
 
The JWT security layer was designed from scratch with production requirements in mind:

- **Key rotation** (`JwtKeyRotationService`): automatic rotation with grace period for in-flight tokens
- **Entropy validation** (`JwtEntropyValidator`, `EntropyAnalysis`):validates that signing keys meet minimum entropy thresholds; rejects weak secrets

- **Token blacklisting** (`JwtBlacklistService`): Redis-backed invalidation on logout or suspicious activity
- **Session risk scoring** (`SessionRiskAssessment`, `SessionSecurityService`) : device fingerprinting and anomaly detection at login
- **Rate limiting** (`JwtRateLimitService`, `RateLimitingFilter`): Redis-backed per-IP and per-user rate limiting on auth endpoints
- **Security audit** (`SecurityAuditService`): key strength assessment and audit reporting

Request flow: `JwtAuthenticationFilter` → `JwtService` (validate + extract claims) → `SecurityClaimsValidation` → `UserDetailsServiceImpl`

---
 
## Key Modules
 
### Order Lifecycle
 
[`order/application/service/OrderLifecycleService.java`](backend/src/main/java/com/indusync/indusync_backend/order/application/service/OrderLifecycleService.java)
 
Manages state transitions: `DRAFT` → `PUBLISHED` → `IN_PROGRESS` → `COMPLETED`. Each transition publishes a domain event consumed by notification and calendar services.
 
### Deadline Management
 
[`order/application/service/OrderDeadlineService.java`](backend/src/main/java/com/indusync/indusync_backend/order/application/service/OrderDeadlineService.java)
 
Providers can propose deadline extensions; clients accept or reject. Full proposal/rejection audit trail via `OrderDeadlineExtensionProposal`.

### Completion Flow
 
[`order/application/service/impl/OrderCompletionServiceImpl.java`](backend/src/main/java/com/indusync/indusync_backend/order/application/service/impl/OrderCompletionServiceImpl.java)
 
Completion must be requested and confirmed by both parties. Publishes `OrderCompletionRequestedEvent` and `OrderCompletedEvent` which trigger review prompts and dashboard updates.

### Reviews
 
[`review/`](backend/src/main/java/com/indusync/indusync_backend/review/)
 
Both client and provider leave structured reviews after order completion. Ratings are aggregated per company across multiple categories (`CompanyRatingsService`). Public company profiles expose aggregated scores.

### Dashboard
 
[`dashboard/`](backend/src/main/java/com/indusync/indusync_backend/dashboard/)
 
Role-aware statistics: clients see order activity, match rates, and deadlines; providers see assigned work and completion rates. Results are cached in Redis. See [`dashboard/caching_notes.md`](backend/src/main/java/com/indusync/indusync_backend/dashboard/caching_notes.md) for cache invalidation strategy.


### Terms & Conditions
 
[`company/domain/TermsConditionsDocument.java`](backend/src/main/java/com/indusync/indusync_backend/company/domain/TermsConditionsDocument.java)
 
Companies can upload their own T&Cs. Access is logged (`TermsConditionsAccessLog`) for legal audit trails.
 
### AWS Lambda Registry Service
 
German commercial registry validation runs as a **separate microservice** hosted on AWS Lambda, calling two official German commercial APIs. This keeps the verification flow decoupled from the main application and avoids vendor-specific infrastructure dependencies in the monolith. The repository for this service is maintained separately: https://github.com/ErenCanYildirim/VAT_ID_Verifier_Lambda


Additionally there is a Lambda service to verify email addresses and detect suspicious or bot emails: https://github.com/ErenCanYildirim/email_verifier_lambda 

---
 
## Frontend Architecture
 
**Entry point:** [`frontend/`](frontend/)
 
The frontend is a Next.js application in TypeScript, targeting the German SME market with German as the default locale and english as an additional locale. As of this version, the backend locale integration is not fully finished. Next.js was chosen for SSR and SEO, relevant for a B2B platform where company profiles and public tender listings need to be indexable.

### Structure
 
```
frontend/
├── app/                  # Next.js App Router pages and layouts
├── components/           # UI components grouped by domain
│   ├── orders/           # Order creation, documents, matching, completion modals
│   ├── dashboard/        # Dashboard-specific components
│   ├── company/          # Company profile and ratings display
│   ├── profile/          # User profile management
│   ├── landing/          # Public-facing landing page
│   └── ui/               # Shared design system components (shadcn/ui base)
├── hooks/                # React hooks for local UI state
├── lib/
│   ├── api/              # API layer,one file per backend domain
│   ├── hooks/            # Server-state hooks (React Query)
│   ├── types/            # TypeScript types mirroring backend domain model
│   └── utils/            # Formatting, permissions, translations, file validation
└── messages/             # i18n translation files (de.json, en.json)
```


### API Client
 
[`lib/api/client.ts`](frontend/lib/api/client.ts)
 
A single Axios instance is configured centrally with request and response interceptors:
 
- **Request interceptor** attaches the JWT Bearer token on every outgoing request, checking expiry before attaching; records a request start timestamp for development logging
- **Response interceptor** handles all HTTP error codes centrally (401 clears the token and redirects to login; 403/404/422/500 surface localised German error messages via toast); avoids duplicating error handling across individual API calls
- A separate `createFormDataClient()` factory reuses the same interceptors with a higher timeout and `multipart/form-data` content type for file uploads
The API layer is split into one file per backend domain (`orders.ts`, `company.ts`, `dashboard.ts`, etc.) all using the shared client instance.


### Server State — React Query Hooks
 
[`lib/hooks/`](frontend/lib/hooks/)
 
All server state is managed through React Query hooks, keeping components free of fetch logic. Each hook wraps a specific API call with loading, error, and data states. Examples:
 
- `useDashboardStatistics` — role-aware dashboard data with caching
- `useOrderMatches` — paginated match results for a given order
- `useMatchingPreview` — calls the preview endpoint without persisting results
- `useCalendarOrders` — orders formatted for calendar view


### Form and Workflow Hooks
 
[`hooks/use-project-creation.ts`](frontend/hooks/use-project-creation.ts)
 
The order creation flow spans a multi-step form (draft save → document upload → publish). Rather than managing this in a component, it is encapsulated in a single hook that:

- Maps frontend form state to the backend `CreateOrderRequest` DTO, including field-level defaults for draft mode (the backend has strict `@NotBlank`/`@NotNull` validation, so drafts are sent with placeholder values where the user hasn't filled in optional fields yet)
- Runs per-step and full-form validation with German error messages before submission
- Orchestrates the three-step workflow: create draft → upload documents in parallel → publish
- Handles edit mode by routing to `updateOrder` instead of `createDraft`
- Exposes a unified loading state combining the hook's own `isSubmitting` with React Query mutation pending states

### Internationalisation
 
[`middleware.ts`](frontend/middleware.ts) / [`messages/`](frontend/messages/)
 
Handled via `next-intl`. German (`de`) is the default locale. The middleware intercepts all non-asset routes and enforces locale prefixing. Translation files cover all user-facing strings; dynamic content (backend enum values, industry names) is mapped to German display names in the API layer rather than the backend, keeping the backend locale-agnostic.
 
### Type System
 
[`lib/types/`](frontend/lib/types/)
 
TypeScript types mirror the backend domain model and are centralised in `lib/types/index.ts` with explicit named exports to avoid namespace collisions (e.g. `CompanyRole` exists in both the ratings and dashboard domains and is re-exported under aliased names `RatingsCompanyRole` and `DashboardCompanyRole`).

---
 
## DevSecOps Pipeline
 
[`.github/workflows/`](backend/.github/workflows/)
 
| Workflow | Tool | Purpose |
|---|---|---|
| `sonarqube-analysis.yml` | SonarQube | Static code analysis, code smell detection |
| `owasp-zap-dynamic.yml` | OWASP ZAP | Dynamic application security testing against running instance |
| `dependency-vulnerabilities.yml` | OWASP Dependency Check | CVE scanning of all dependencies |
| `secrets-scanning.yml` | Custom | Prevents accidental secret commits |
| `docker-security.yml` | Docker scan | Container image vulnerability scanning |
 
---

## Running Locally
 
### Prerequisites
 
- Java 
- Docker
- Node.js 18+ / pnpm

### Backend
 
```bash
cd backend
cp .env.example .env
# Fill in required values (database, Redis, Cloudinary, JWT secret, mail)
docker-compose up -d        # starts PostgreSQL and Redis
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```
 
### Frontend
 
```bash
cd frontend
pnpm install
pnpm dev
```
 
The API will be available at `http://localhost:8080` and the frontend at `http://localhost:3000`.

*Built during university, 2025–2026. Germany.*
