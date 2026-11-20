CREATE TYPE "GroupRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

ALTER TABLE "Conversation"
ADD COLUMN "isGroup" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "groupKey" TEXT,
ADD COLUMN "name" TEXT,
ADD COLUMN "description" TEXT,
ADD COLUMN "icon" TEXT,
ADD COLUMN "ownerId" TEXT;

CREATE UNIQUE INDEX "Conversation_groupKey_key" ON "Conversation"("groupKey");

ALTER TABLE "Conversation"
ADD CONSTRAINT "Conversation_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Conversation_Participant"
ADD COLUMN "role" "GroupRole" NOT NULL DEFAULT 'MEMBER';

INSERT INTO "Conversation" ("id", "isGroup", "groupKey", "name", "description", "icon", "createdAt", "updatedAt")
VALUES
  ('00000000-0000-4000-8000-000000000001', true, 'world-chat', '🌍 World Chat', 'Say hi to the world, make new friends, and chat across time zones.', '🌍', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000002', true, 'tech-code', '💻 Tech & Code', 'Talk AI, gadgets, coding, and side projects with global builders.', '💻', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000003', true, 'english-corner', '🗣️ English Corner', 'A friendly, judgment-free space to practice English and build fluency.', '🗣️', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('00000000-0000-4000-8000-000000000004', true, 'love-vibes', '❤️ Love & Vibes', 'Mingle, share relationship stories, or spark a casual connection.', '❤️', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("groupKey") DO NOTHING;

INSERT INTO "Conversation_Participant" ("conversationId", "userId", "role")
SELECT group_room."id", app_user."id", 'MEMBER'::"GroupRole"
FROM "Conversation" AS group_room
CROSS JOIN "User" AS app_user
WHERE group_room."groupKey" IN ('world-chat', 'tech-code', 'english-corner', 'love-vibes')
ON CONFLICT ("conversationId", "userId") DO NOTHING;
