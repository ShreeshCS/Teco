> **Design proposal only:** The current application has no message API, message UI, or Socket.IO delivery. This diagram shows the planned flow.

                    ┌──────────────┐
                    │     User     │
                    └──────┬───────┘
                           │
                       Send message
                           │
                           ▼
                    ┌──────────────┐
                    │    React     │
                    └──────┬───────┘
                           │
                     HTTP POST
                           │
                           ▼
                    ┌──────────────┐
                    │   Express    │
                    └──────┬───────┘
                           │
                  Authenticate
                  Authorize
                  Validate
                           │
                           ▼
                    ┌──────────────┐
                    │   Prisma     │
                    └──────┬───────┘
                           │
                         INSERT
                           │
                           ▼
                    ┌──────────────┐
                    │ PostgreSQL   │
                    └──────┬───────┘
                           │
                      Message ID
                           │
                           ▼
                    ┌──────────────┐
                    │ Socket.IO    │
                    └──────┬───────┘
                           │
                    "message:new"
                           │
                  ┌────────┴────────┐
                  ▼                 ▼
               User A            User B
                  │                 │
                  ▼                 ▼
               React             React
                  │                 │
                  └───────┬─────────┘
                          ▼
                    Message List
