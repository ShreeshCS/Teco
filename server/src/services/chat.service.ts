import { prisma } from '../lib/prisma.js'
import { ConversationResult } from '../types/chat.types.js'
import { toCanonicalOrder } from './friend.service.js'

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
  if (userId1 === userId2) {
    throw new Error('A conversation requires two distinct users')
  }

  const { userOneId, userTwoId } = toCanonicalOrder(userId1, userId2)
  const friendship = await prisma.friendship.findUnique({
    where: {
      userOneId_userTwoId: { userOneId, userTwoId },
    },
    select: { userOneId: true },
  })

  if (!friendship) return null

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

export const isConversationParticipant = async (
  conversationId: string,
  userId: string,
): Promise<boolean> => {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      conversationParticipants: {
        some: { userId },
      },
    },
    select: { id: true },
  })

  return Boolean(conversation)
}

export const getConversationMessages = async (
  conversationId: string,
  userId: string,
) => {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      conversationParticipants: {
        some: { userId },
      },
    },
    select: {
      messages: {
        take: 100,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          content: true,
          createdAt: true,
          createdById: true,
          createdBy: {
            select: { id: true, name: true },
          },
        },
      },
    },
  })

  return conversation ? conversation.messages.reverse() : null
}

export const sendMessage = async (
  conversationId: string,
  userId: string,
  content: string,
) => {
  const isParticipant = await isConversationParticipant(conversationId, userId)
  if (!isParticipant) return null

  return prisma.$transaction(async (tx) => {
    const message = await tx.message.create({
      data: {
        conversationId,
        createdById: userId,
        content,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        createdById: true,
        createdBy: {
          select: { id: true, name: true },
        },
      },
    })

    await tx.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    })

    return message
  })
}
