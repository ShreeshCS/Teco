# Teco

Teco is a learning project for building a real-time, one-to-one chat application. The browser client is built with React and Vite; the API is built with Node.js, Express, and TypeScript. PostgreSQL, Prisma, authentication, and Socket.IO will be added as the project develops.

## Project structure

```text
Teco/
├── client/              # React + Vite browser application
├── server/              # Express API and Prisma project
├── docs/                # Architecture and design notes
├── docker-compose.yml   # PostgreSQL + Adminer containers
├── .env.example         # Copy to .env for local development
├── .env                 # Local secrets, not committed
└── .gitignore           # Ignores local environment files and generated outputs
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

## Run locally

Install the client dependencies:

```bash
cd client
npm install
```

In a terminal, start the client:

```bash
cd client
npm run dev
```

Vite prints the local URL, normally `http://localhost:5173`.

In a second terminal, start the server:

```bash
cd server
npm run dev
```

The API runs at `http://localhost:3000`. Confirm it is available by opening `http://localhost:3000/health`; it returns:

```json
{ "status": "ok" }
```

## Available commands

Run these inside either `client/` or `server/` where applicable:

```bash
npm run dev      # Start the development server
npm run build    # Create a production build
npm run lint     # Check code with ESLint
npm test         # Run tests (server only for now)
```
