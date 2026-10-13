import { prisma } from '../lib/prisma.js'
import { ConversationResult } from '../types/chat.types.js'

export const getConversationByUser = async (
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

export const createConversation = async (userId1: string, userId2: string) => {
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
