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