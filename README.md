# NovaCare Appointment Booking System

NovaCare is a polished, full-stack appointment scheduling platform for customers, care providers, and administrators. It turns service discovery, live availability, booking, rescheduling, and daily operations into a calm, accessible experience while enforcing permissions and scheduling rules on the server.

The project follows the supplied MERN blueprint and ships with an in-memory demo mode, so the complete workflow works immediately without a MongoDB account. Add `MONGODB_URI` when you are ready to use persistent data.

## Product highlights

### Customers

- Browse a searchable service catalog and verified specialist directory.
- Select real working-day availability and book a live slot.
- View upcoming and past appointments with clear status badges.
- Reschedule active appointments or cancel them through a confirmation flow.
- Use responsive dashboards with loading, empty, error, and success states.

### Providers

- See a focused daily schedule and weekly performance snapshot.
- Confirm pending visits and mark confirmed visits completed or no-show.
- Configure working hours for every weekday.
- Rely on automatic conflict removal for booked and blocked periods.

### Administrators

- Monitor members, providers, appointments, service coverage, and demand.
- Browse the active service catalog and provider network.
- Add validated services from the operations dashboard.
- Use role-protected APIs for all privileged actions.

## Demo workspaces

All demo accounts use the password `Demo123!`.

| Role | Email | Best flow to try |
| --- | --- | --- |
| Customer | `customer@novacare.demo` | Book, reschedule, and cancel care |
| Provider | `provider@novacare.demo` | Confirm visits and update availability |
| Admin | `admin@novacare.demo` | Review metrics and add a service |

## Technology

- React 19, TypeScript, Vite, React Router, and date-fns
- Node.js, Express 5, Zod validation, JWT, and bcrypt
- MongoDB and Mongoose schemas with an instant in-memory demo adapter
- Helmet, CORS restrictions, rate limiting, centralized JSON errors
- Node test runner, Supertest, Vitest, Testing Library, and ESLint

## Architecture

```text
appointment-booking-system/
├── client/
│   ├── src/
│   │   ├── components/      shared interface and application shells
│   │   ├── context/         authenticated session state
│   │   ├── lib/             typed API client
│   │   └── pages/           public and role-aware product screens
│   └── vite.config.ts       local proxy and test environment
├── server/
│   ├── src/
│   │   ├── config/          MongoDB connection strategy
│   │   ├── data/            development demo dataset
│   │   ├── middleware/      auth, roles, validation, and errors
│   │   ├── models/          Mongoose domain schemas and indexes
│   │   ├── routes/          REST endpoints by domain
│   │   └── services/        database/demo repository and booking rules
│   └── test/                end-to-end API tests
└── package.json             npm workspace orchestration
```

The API owns every security and scheduling decision. The client can hide a provider-only button for clarity, but the backend still checks the JWT, role, ownership, current appointment status, and live slot before writing data.

## Run locally

Requirements: Node.js 20 or newer. MongoDB is optional for the default demo experience.

```bash
git clone https://github.com/dskwittahachchi/appointment-booking-system.git
cd appointment-booking-system
npm install
npm run dev
```

Open [http://localhost:5180](http://localhost:5180). The API runs at [http://localhost:5050](http://localhost:5050), and its health endpoint is `/api/health`.

The dedicated ports avoid collisions with other common Vite and API development servers. You can override the backend port through `server/.env` and update the proxy in `client/vite.config.ts`.

## Environment variables

Copy `server/.env.example` to `server/.env` and replace values as needed:

```env
PORT=5050
MONGODB_URI=
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://localhost:5180
DEMO_MODE=true
```

- Keep `DEMO_MODE=true` for the seeded portfolio experience.
- Set `DEMO_MODE=false` and provide `MONGODB_URI` to use MongoDB.
- Never commit `.env`; only the safe `.env.example` files belong in source control.

## API summary

All responses use `{ success, message, data }`; validation failures also include a field-level `errors` array.

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | Runtime and storage-mode health |
| `POST` | `/api/auth/register` | Public | Register a customer |
| `POST` | `/api/auth/login` | Public | Authenticate any role |
| `GET` | `/api/services` | Public | Search and filter services |
| `GET` | `/api/providers` | Public | Browse matching providers |
| `GET` | `/api/availability/slots` | Public | Calculate unoccupied working slots |
| `GET/POST` | `/api/appointments` | Authenticated | List or create appointments |
| `PUT` | `/api/appointments/:id/reschedule` | Owner | Move an active appointment |
| `PUT` | `/api/appointments/:id/status` | Provider/Admin | Apply a valid status transition |
| `DELETE` | `/api/appointments/:id` | Owner/Admin | Cancel an active appointment |
| `GET/POST` | `/api/provider/availability` | Provider | Read or save weekly hours |
| `GET` | `/api/admin/overview` | Admin | Platform summary metrics |
| `POST` | `/api/admin/services` | Admin | Create a validated service |

## Quality checks

```bash
npm run lint
npm test
npm run build
```

The API suite verifies health, unauthenticated access, catalog relationships, slot generation, conflict prevention, role enforcement, status transitions, and service creation. The client suite verifies reusable status presentation, while TypeScript and the production build validate all screens.

## Scheduling and security details

- Slots are calculated from a provider’s weekly availability in service-duration increments.
- Existing active appointments are removed from the result using overlap checks.
- The server calculates the slot again immediately before booking or rescheduling.
- MongoDB appointments use a sparse unique `slotKey` for a final atomic conflict boundary.
- Passwords are hashed with bcrypt and never returned by auth endpoints.
- JWT middleware attaches the current active user; role and ownership checks run before mutations.
- Zod rejects malformed inputs, and production errors never expose stack traces.
- Authentication endpoints are rate limited and the server sends Helmet security headers.

## Current scope and next steps

The v1 experience covers the full MVP workflow in demo mode and includes production-ready MongoDB schemas. The next meaningful extensions are persistent database seed tooling, provider approval actions, notification delivery, Google Calendar sync, deposits, and a deployment pipeline.

## What this project demonstrates

- Vertical full-stack feature delivery rather than disconnected mock screens
- Multi-role interface design and server-enforced authorization
- Time overlap logic and conflict-safe appointment writes
- An original, responsive product system with accessible controls and clear states
- Repeatable builds, linting, automated tests, and setup documentation
