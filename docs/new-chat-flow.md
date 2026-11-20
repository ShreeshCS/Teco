This is the implemented flow for opening a one-to-one conversation with an accepted friend.

```mermaid
flowchart TD
    A[User selects an accepted friend] --> B[Authenticate requester]

    B -->|Authenticated| C[Verify accepted friendship]
    B -->|Not Authenticated| X1[Return 401]

    C -->|Friends| D[Find existing one-to-one conversation]
    C -->|Not friends| X2[Return 403]

    D -->|Conversation exists| E[Return existing conversation ID]

    D -->|Conversation does not exist| F[BEGIN TRANSACTION]

    F --> G[Create Conversation record]
    G --> H[Get conversation_id]

    H --> I[Insert authenticated user participant]
    I --> J[Insert friend participant]

    J --> K{Both inserts successful?}

    K -->|Yes| L[COMMIT TRANSACTION]
    K -->|No| M[ROLLBACK TRANSACTION]

    L --> N[Return conversation_id]
    M --> X3[Return Error]

    E --> O[Chat Ready]
    N --> O
```

Messages are loaded from the participant-protected history endpoint. New messages are sent through the authenticated Socket.IO connection, stored by the server, and then broadcast to the conversation room.
