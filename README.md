RaaSocial — AI-Driven Social Media Management Portal

An AI-driven social media management platform designed for business clients. RaaSocial enables automated content calendar generation, social channel scheduling, custom content suggestion generation, compliance Know-Your-Customer (KYC) verification, and billing management using the Flutterwave subscription checkout flow. It is built to facilitate seamless content planning and publishing with custom n8n automations.

---

## 1. Tech Stack

RaaSocial is constructed as an NPM workspaces monorepo containing the following technical layers:

*   **Backend API:** NestJS (Node.js / TypeScript) utilizing dependency injection, REST controllers, global exception filters, and JWT-based Passport strategies.
*   **Frontend SPA:** React 18 (Vite / JS / JSX) styled with Vanilla CSS and Tailwind CSS, featuring Zustand hooks for state management and charts powered by Recharts.
*   **Database & ORM:** PostgreSQL (Neon Serverless) coupled with Drizzle ORM for schema definitions, relational mapping, and automated SQL migrations.
*   **Automation:** n8n webhooks coordinate long-running asynchronous AI jobs, calendar generation, suggestions creation, and post publication routing.

---

## 2. Monorepo Folder Structure

```text
Ai.social.manager/
├── .github/                        # CI/CD workflow configuration actions
├── apps/                           # Application workspaces
│   ├── backend/                    # NestJS API Server (Port 4000)
│   └── frontend/                   # React + Vite Client (Port 5173)
├── docs/                           # Central architectural guides, theme specifications, and team protocols
├── packages/                       # Shared monorepo libraries
│   ├── shared-types/               # Central TypeScript type definitions shared between backend and frontend
│   └── ui/                         # Shareable frontend UI component workspace (currently unpopulated)
├── scripts/                        # Maintenance and database seeding helpers
├── package.json                    # Monorepo workspaces definition
└── README.md                       # Main workspace onboarding documentation
```

---

## 3. Getting Started & Installation

### Step 1: Clone the Repository & Install Dependencies
Run a single `npm install` from the root workspace folder. NPM workspaces will automatically link and install dependencies for the backend, frontend, and shared types simultaneously:
```bash
git clone <your-repository-url>
cd Ai.social.manager
npm install
```

### Step 2: Environment Variable Setup
Copy the environment template files in both workspaces:
```bash
# Create Backend .env
cp apps/backend/.env.example apps/backend/.env

# Create Frontend .env
cp apps/frontend/.env.example apps/frontend/.env
```

---

## 4. Environment Variables Reference

### Backend Configuration (`apps/backend/.env`)

#### Required Variables
*   `DATABASE_URL`: Connection string for Neon PostgreSQL database instance.
*   `JWT_ACCESS_SECRET`: Secret key used to sign and verify JWT access tokens.
*   `JWT_REFRESH_SECRET`: Secret key used to sign and verify JWT refresh session tokens.
*   `SETTINGS_ENCRYPTION_KEY`: A symmetric key used to encrypt configurations (e.g. SMTP credentials, social tokens) in the database. **Must be exactly 32 characters.**

#### Optional Variables
*   `PORT`: Port for the API server (Defaults to `4000`).
*   `API_PREFIX`: Global API routing prefix (Defaults to `api`).
*   `CORS_ORIGIN`: Allowed origin for CORS headers (Defaults to `http://localhost:5173`).
*   `FRONTEND_URL`: Client-side application callback redirect.
*   `SUPPORT_WHATSAPP_NUMBER`: Digits-only WhatsApp support hotline (e.g. `2348000000000`).

#### Integration Variables (Required for Specific Features)
*   **Payments (Flutterwave):**
    *   `FLUTTERWAVE_SECRET_KEY`: Merchant secret key for Flutterwave checkouts.
    *   `FLUTTERWAVE_WEBHOOK_SECRET_HASH`: Unique signature hash to verify Flutterwave webhooks.
*   **Email (SMTP / Resend):**
    *   `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USERNAME` / `SMTP_PASSWORD`: SMTP server connection.
    *   `SMTP_SENDER_NAME` / `SMTP_SENDER_EMAIL`: Email outgoing signature.
    *   `RESEND_API_KEY`: API access key for Resend email API integration.
*   **AI Providers (Gemini / n8n / OpenClaw):**
    *   `GEMINI_API_KEY`: Key for Gemini LLM.
    *   `N8N_CALENDAR_GENERATION_WEBHOOK_URL`: n8n calendar generator webhook.
    *   `N8N_INTERNAL_API_KEY`: Key to authorize incoming callback webhooks.
    *   `N8N_PUBLISHING_WEBHOOK_URL`: n8n webhook triggered to execute publications.

#### Dead / Stub Environment Variables (Not Currently Wired)
*   `REDIS_URL`: Present in config, but **not imported or used**. No BullMQ queues or Redis cache providers are connected.
*   `OPENCLAW_API_KEY` & `OPENCLAW_GATEWAY_URL`: Present in config, but **no active wiring exists**. The `AiModule` is currently a placeholder.

---

### Frontend Configuration (`apps/frontend/.env`)
*   `VITE_API_BASE_URL`: Endpoint pointing to the NestJS server API (e.g. `http://localhost:4000/api`).

---

## 5. Running the Application Locally

You can run the workspaces together or individually.

### Running Backend and Frontend Together
```bash
# Start both apps concurrently from root
npm run dev
```

### Running Backend Individually
```bash
# Start backend in watch/development mode
npm run start:dev --workspace=apps/backend
```
*   **API URL:** `http://localhost:4000/api`
*   **Swagger Docs:** `http://localhost:4000/api/docs` (Protected by Basic Auth matching `SWAGGER_USERNAME` / `SWAGGER_PASSWORD` in env)

### Running Frontend Individually
```bash
# Start Vite development server
npm run dev --workspace=apps/frontend
```
*   **App URL:** `http://localhost:5173`

---

## 6. Current Feature & Integration Status

| Feature Module | Active Data Source | Status | Description / Notes |
| --- | --- | --- | --- |
| **Authentication & RBAC** | Live Database + JWT | **Real** | Dynamic registration, email verification flow, session cookies, and 5-role guard authorization. |
| **KYC Verification** | Live Database | **Real** | Customer document upload pipeline, admin oversight, and moderation. |
| **Billing & Plans** | Live Database + Flutterwave | **Real** | Subscriptions default to `'free'` tier and are updated via Flutterwave API webhooks. |
| **Content Calendar** | Live Database + n8n | **Real** | Full CRUD capabilities. Bulk calendar generation relies on `N8N_CALENDAR_GENERATION_WEBHOOK_URL` callbacks. |
| **AI Suggestions** | Live Database + n8n | **Real** | Post captions generated asynchronously using `N8N_CONTENT_SUGGESTIONS_WEBHOOK_URL` callback. |
| **Post Scheduling** | In-Memory Cron Job | **Real** | An in-memory cron job poll (`DispatchDuePostsJob`) scans for due posts every 2 minutes. |
| **Post Publishing** | Mock | **Stubbed** | `PublishingService.dispatchPost()` generates mock post IDs; actual API integrations for Facebook/Instagram/X are stubbed. |
| **Redis / BullMQ Queues** | None | **Stubbed** | Config is loaded, but NestJS does not import any queue providers. |
| **MinIO Storage** | Local Disk Storage | **Stubbed** | Files are stored locally inside `apps/backend/uploads/` instead of an S3 object store. |

---

## 7. Contributors

*   **Pascal** — User Settings, Admin Panel user oversight, authentication controllers, schema validation, and layouts.
*   **Treasure** — Billing, Flutterwave payments, company profiles, social API settings, and support services.
