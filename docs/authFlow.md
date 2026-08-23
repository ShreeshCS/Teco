# Teco Authentication Flow

## Overview

Teco uses JWT-based authentication.

The authentication flow consists of:

- User registration
- User login
- JWT access token
- Protected API routes
- Authentication state in React
- Logout

## Registration

```text
User
 │
 │ POST /api/auth/register
 │ { email, password, username }
 ▼
Backend
 │
 ├── Validate input
 │
 ├── Check if user already exists
 │
 ├── Hash password
 │
 ├── Create user in PostgreSQL
 │
 └── Return user information
 ▼
Frontend
```

## Login

```text
User
 │
 │ POST /api/auth/login
 │ { email, password }
 ▼
Backend
 │
 ├── Validate input
 │
 ├── Find user
 │
 ├── Compare password with stored hash
 │
 ├── Generate JWT
 │
 └── Return authentication response
 ▼
Frontend
 │
 └── Store authentication state
 ```

 ## JWT Flow

 ```text
 Login
  │
  ▼
Backend generates JWT
  │
  ▼
Frontend receives JWT
  │
  ▼
Frontend sends JWT with protected requests
  │
  │ Authorization: Bearer <token>
  ▼
Backend authentication middleware
  │
  ├── Verify JWT
  │
  ├── Extract user ID
  │
  └── Attach authenticated user to request
  ▼
Protected route/controller
```

## Protected API Request

```text
React
 │
 │ GET /api/conversations
 │ Authorization: Bearer <JWT>
 ▼
Express
 │
 ▼
Authentication Middleware
 │
 ├── Token missing?
 │      └── 401 Unauthorized
 │
 ├── Token invalid?
 │      └── 401 Unauthorized
 │
 └── Token valid
        │
        ▼
     Controller
        │
        ▼
      Service
        │
        ▼
      Prisma
        │
        ▼
    PostgreSQL

The backend must never trust a user ID supplied by the frontend when the authenticated user ID is already available from the JWT.
```
