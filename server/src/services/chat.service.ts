import { prisma } from '../lib/prisma.js'
import { ConversationResult } from '../types/chat.types.js'

export const getConversations = async (
  userId: string,
): Promise<ConversationResult[]> => {
  return await prisma.conversation.findMany({
    where: {
      conversationParticipants: {
        some: {
          userId: userId,
        },
      },
    },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      // The counterpart participant & user
      conversationParticipants: {
        where: {
          userId: {
            not: userId,
          },
        },
        select: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      // Include the most recent message as the conversation preview.
      messages: {
        select: {
          id: true,
          content: true,
          createdAt: true,
        },
        take: 1,
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  })
}

const isConversationExist = async (userId1: string, userId2: string) => {
  if (userId1 === userId2) {
    throw new Error('A conversation requires two distinct users')
  }

  return await prisma.conversation.findFirst({
    where: {
      AND: [
        { conversationParticipants: { some: { userId: userId1 } } },
        { conversationParticipants: { some: { userId: userId2 } } },
        {
          conversationParticipants: {
            every: { userId: { in: [userId1, userId2] } },
          },
        },
      ],
    },
    select: { id: true },
  })
}

export const createConversation = async (userId1: string, userId2: string) => {
  const existingConversation = await isConversationExist(userId1, userId2)
  if (existingConversation) {
    return existingConversation
  }

  return await prisma.$transaction(async (tx) => {
    const conversation = await tx.conversation.create({
      data: {},
      select: {
        id: true,
      },
    })

    await tx.conversation_Participant.createMany({
      data: [
        {
          conversationId: conversation.id,
          userId: userId1,
        },
        {
          conversationId: conversation.id,
          userId: userId2,
        },
      ],
      skipDuplicates: true,
    })

    return conversation
  })
}
