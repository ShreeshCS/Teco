# Teco

Teco is a learning project for building a real-time, one-to-one chat application. The browser client is built with React and Vite; the API is built with Node.js, Express, and TypeScript. PostgreSQL, Prisma, authentication, and Socket.IO will be added as the project develops.

## Project structure

```text
Teco/
├── client/    # React + Vite browser application
├── server/    # Express API
└── docs/      # Architecture and design notes
```

## Prerequisites

- Node.js 20 or later
- npm

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

In a second terminal, install and start the server:

```bash
cd server
npm install
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
