-- Add an update timestamp to existing conversations, initialized to their creation time.
ALTER TABLE "Conversation"
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Conversation"
SET "updatedAt" = "createdAt";
