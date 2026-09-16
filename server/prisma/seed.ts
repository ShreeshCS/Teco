/// <reference types="node" />
import { prisma } from '../src/lib/prisma'

const seedUsers = async () => {
  const user1 = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      name: 'Alice',
      passwordHash: 'mock_hashed_password_1',
    },
  })

  const user2 = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      name: 'Bob',
      passwordHash: 'mock_hashed_password_2',
    },
  })

  return { user1, user2 }
}

const seedConversations = async () => {
  return prisma.conversation.create({
    data: {},
  })
}

const seedConversationParticipants = async (
  conversationId: string,
  userIds: string[],
) => {
  return Promise.all(
    userIds.map((userId) =>
      prisma.conversation_Participant.create({
        data: {
          conversationId,
          userId,
        },
      }),
    ),
  )
}

const seedMessages = async (
  conversationId: string,
  items: { createdById: string; content: string }[],
) => {
  return prisma.message.createMany({
    data: items.map(({ createdById, content }) => ({
      conversationId,
      createdById,
      content,
    })),
  })
}

async function main() {
  await prisma.$transaction(async (tx) => {
    await tx.message.deleteMany()
    await tx.conversation_Participant.deleteMany()
    await tx.conversation.deleteMany()
    await tx.user.deleteMany()
  })

  const { user1, user2 } = await seedUsers()
  const conversation = await seedConversations()

  await seedConversationParticipants(conversation.id, [user1.id, user2.id])

  await seedMessages(conversation.id, [
    { createdById: user1.id, content: "Hi Bob, how are you?" },
    { createdById: user2.id, content: "I'm good, thanks!" },
    { createdById: user1.id, content: "Want to review the app today?" },
    { createdById: user2.id, content: "Yes, let's do it this afternoon." },
  ])

  console.log('Database seeded successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
