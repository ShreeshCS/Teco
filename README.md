# Teco

Teco is a learning project for building a real-time one-to-one chat app. The current repository is in its foundation stage: the React + Vite frontend, Express API, PostgreSQL service, and Prisma schema are set up, but the actual chat features, authentication, and real-time messaging layer are not implemented yet.

## Current project state

This repo currently includes:

- A React + Vite client in `client/`
- An Express + TypeScript server in `server/`
- A PostgreSQL instance managed by Docker Compose
- A Prisma schema for users, conversations, participants, and messages
- A basic `/health` endpoint on the server

The app is not yet a working chat application. The client is still the default Vite starter UI, and the server does not yet include auth, Socket.IO, conversation endpoints, or message delivery logic.

## Repository structure

```text
Teco/
├── .env.example
├── docker-compose.yml
├── README.md
├── client/                 # React + Vite frontend
│   ├── src/
│   ├── package.json
│   └── ...
├── server/                 # Express + TypeScript API
│   ├── prisma/
│   ├── src/
│   ├── package.json
│   └── ...
├── docs/                   # Design notes and architecture docs
├── shared/
└── .env                    # Local environment file
```

## Prerequisites

- Node.js 20 or later
- npm
- Docker Desktop

## Prisma + PostgreSQL setup

Follow this order for a reproducible setup from a fresh checkout.

1. Configure the local environment file from the example:

```bash
cp .env.example .env
```

2. Start PostgreSQL and Adminer from the repo root:

```bash
cd /Users/shreesh/Desktop/Repos/Teco
docker compose up -d
```

3. Install the server dependencies:

```bash
cd server
npm install
```

4. Apply the committed Prisma migration to the local database:

```bash
cd server
npx prisma migrate deploy
```

5. Generate the Prisma Client that the server imports:

```bash
cd server
npx prisma generate
```

6. Run a database connectivity check:

```bash
cd server
node --env-file ../.env --input-type=module <<'EOF'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './src/generated/prisma/client.js'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })
const result = await prisma.$queryRaw`SELECT 1 AS ok`
console.log(JSON.stringify(result))
await prisma.$disconnect()
EOF
```

Expected output:

```json
[{"ok":1}]
```

This confirms the server can reach PostgreSQL with the configured `DATABASE_URL`.

### Prisma file locations

- Schema: `server/prisma/schema.prisma`
- Migrations: `server/prisma/migrations/`
- Seed script: `server/prisma/seed.ts` (if added later)
- Generated client: `server/src/generated/prisma/`

### What is committed vs local

Committed to Git:
- `server/prisma/schema.prisma`
- `server/prisma/migrations/**`
- any intentionally versioned Prisma seed or config files

Local-only / not committed:
- `.env`, `.env.local`, other environment files
- Docker volume data (`postgres-data`)
- generated Prisma client output under `server/src/generated/prisma/` after `npx prisma generate`

The generated Prisma client is not handwritten; it is refreshed when the schema changes and should be regenerated rather than edited directly.

## Run Client locally
Install and start the client in a second terminal:

```bash
cd client
npm install
npm run dev
```

The client runs at `http://localhost:5173`.

## Current runtime behavior

The current server exposes a simple health check:

```bash
curl http://localhost:3000/health
```

It currently returns:

```json
"Hello from Server!"
```

The client currently uses the default Vite starter UI and calls this health endpoint on button click.

## Available commands

Run these inside the relevant directory (`client/` or `server/`):

```bash
npm run dev      # Start the development server
npm run build    # Create a production build
npm run lint     # Check code with ESLint
npm test         # Run tests (server only for now)
```

## Database and Prisma

The Prisma schema is defined in `server/prisma/schema.prisma` and currently includes models for:

- `User`
- `Conversation`
- `Conversation_Participant`
- `Message`

The generated Prisma client is located under `server/src/generated/prisma`.

## Planned next steps

The project roadmap is still in progress. The next major milestones are expected to include:

- user registration and login
- direct conversation creation
- sending and listing messages
- Socket.IO real-time delivery
- protected routes and auth middleware
- chat UI polish

## Documentation

Additional design notes are in the `docs/` folder, including architecture and data model planning. Those documents describe the intended final architecture, even though the implementation is still being built out.
