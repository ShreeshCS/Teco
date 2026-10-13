# Teco

Teco is a learning project for a real-time, one-to-one chat application. The repository contains a React + Vite client, an Express + TypeScript API, PostgreSQL with Prisma, and registration and JWT authentication. The server also exposes an authenticated conversation-list endpoint; message delivery and real-time messaging are not implemented yet, and the chat screen remains a placeholder.

## Current project state

- Registration stores users with bcrypt-hashed passwords.
- Login returns a JWT and user details. The client stores the token and updates its authentication context.
- Protected client routes require an authenticated session. On page load, a stored token is checked through `GET /api/user/me`.
- The server protects user routes with JWT authentication and requires `JWT_SECRET` to start.
- PostgreSQL is managed by Docker Compose, and Prisma manages the database schema and migrations.
- Listing the signed-in user's conversations is implemented at `GET /api/conversations`. Contact management, message APIs, and Socket.IO delivery remain future work.

## Repository structure

```text
Teco/
├── .env.example
├── docker-compose.yml
├── client/                 # React + Vite application
├── server/                 # Express + TypeScript API
│   ├── prisma/             # Schema, migrations, and seed script
│   └── src/
├── docs/                   # Architecture and feature notes
└── README.md
```

## Prerequisites

- Node.js 20 or later
- npm
- Docker Desktop (for local PostgreSQL)

## Configure the environment

From the repository root, create a local environment file:

```bash
cp .env.example .env
```

Set `JWT_SECRET` to a private, randomly generated value before running the server. The server refuses to start if it is missing or blank. Keep `.env` out of version control.

The example configures PostgreSQL at `localhost:5432`, the API at port `3000`, and the Vite client at port `5173`. Docker Compose reads the root `.env`; the server loads `server/.env`, so copy the configured file there as well:

```bash
cp .env server/.env
```

The API's current CORS configuration allows `http://localhost:5173`. The client defaults to `http://localhost:3000`; to override that URL, put `VITE_API_URL` in `client/.env.local` because Vite loads environment files from the client directory.

## Start PostgreSQL and the API

Run these commands from the repository root:

```bash
docker compose up -d
cd server
npm ci
npx prisma migrate deploy
npx prisma generate
npm run dev
```

The API listens at `http://localhost:3000`. Its health endpoint is:

```bash
curl http://localhost:3000/health
```

Prisma files are located here:

- Schema: `server/prisma/schema.prisma`
- Migrations: `server/prisma/migrations/`
- Seed script: `server/prisma/seed.ts`
- Generated client: `server/src/generated/prisma/`

When changing the schema in development, create a migration from `server/` with `npx prisma migrate dev --name <migration-name>`, then regenerate the client with `npx prisma generate`. Generated client files are local build output and should not be edited by hand.

## Start the client

In another terminal, from the repository root:

```bash
cd client
npm ci
npm run dev
```

Open `http://localhost:5173`. The client defaults to the API at `http://localhost:3000`. If you need a different API URL, set `VITE_API_URL` in `client/.env.local`.

## Authentication flow

1. Create an account at `/register`.
2. Sign in at `/login`.
3. On successful login, the client passes the returned user and token to the auth provider's `signIn` function. The provider updates in-memory state and stores the token in `localStorage`.
4. On a later page load, the provider checks the stored token with `GET /api/user/me`. Invalid or expired sessions are cleared.
5. `/chat` is protected and currently displays a placeholder. Use the Logout button to clear the local session.

The API routes currently include:

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Create an account |
| `POST` | `/api/auth/login` | Public | Authenticate and return a JWT |
| `GET` | `/api/user/me` | JWT required | Return the authenticated user's details |
| `GET` | `/api/user/details` | JWT required | Return user details |
| `GET` | `/health` | Public | Check that the API is responding |

## Useful commands

Run each command from its package directory:

| Directory | Command | Purpose |
| --- | --- | --- |
| `client/` | `npm run dev` | Start the Vite development server |
| `client/` | `npm run build` | Type-check and build the client |
| `client/` | `npm run lint` | Run ESLint on the client |
| `server/` | `npm run dev` | Start the API in watch mode |
| `server/` | `npm run build` | Compile the server TypeScript |
| `server/` | `npm run lint` | Run ESLint on the server |
| `server/` | `npm test` | Run Node's test runner |

## Database models

The Prisma schema currently defines:

- `User`
- `Conversation`
- `Conversation_Participant`
- `Message`

The conversation and message models establish the planned data structure; corresponding application flows are not yet available.

## Next development areas

- List and manage contacts and conversations
- Create one-to-one conversations
- Send and retrieve messages
- Add Socket.IO real-time delivery
- Expand automated test coverage

Architecture and feature design notes are in `docs/`.
