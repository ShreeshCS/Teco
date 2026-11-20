import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getConversations,
  createConversation,
  getConversationMessages,
  isConversationParticipant,
  sendMessage,
} from '@/services/chat.service.js'
import { prisma } from '@/lib/prisma.js'

vi.mock('@/lib/prisma.js', () => ({
  prisma: {
    conversation: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    friendship: { findUnique: vi.fn() },
    message: { create: vi.fn() },
    conversation_Participant: {
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

describe('chat.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getConversations', () => {
    it('should query conversations for the specified user ordered by updatedAt desc', async () => {
      const mockConversations = [
        {
          id: 'conv-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          conversationParticipants: [{ user: { id: 'u2', name: 'Bob' } }],
          messages: [{ id: 'm1', content: 'Hello', createdAt: new Date() }],
        },
      ]
      vi.mocked(prisma.conversation.findMany).mockResolvedValueOnce(
        mockConversations as any,
      )

      const result = await getConversations('u1')

      expect(prisma.conversation.findMany).toHaveBeenCalledWith({
        where: {
          isGroup: false,
          conversationParticipants: {
            some: {
              userId: 'u1',
            },
          },
        },
        select: expect.objectContaining({
          id: true,
          createdAt: true,
          updatedAt: true,
        }),
        orderBy: {
          updatedAt: 'desc',
        },
      })
      expect(result).toEqual(mockConversations)
    })
  })

  describe('createConversation', () => {
    it('should throw an error if both user IDs are identical', async () => {
      await expect(createConversation('user-1', 'user-1')).rejects.toThrow(
        'A conversation requires two distinct users',
      )
    })

    it('should return existing conversation if one already exists', async () => {
      vi.mocked(prisma.friendship.findUnique).mockResolvedValueOnce({
        userOneId: 'user-1',
        userTwoId: 'user-2',
      } as any)
      vi.mocked(prisma.conversation.findFirst).mockResolvedValueOnce({
        id: 'existing-conv',
      } as any)

      const result = await createConversation('user-1', 'user-2')

      expect(result).toEqual({ id: 'existing-conv' })
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it('should create new conversation and participants in a transaction when none exists', async () => {
      vi.mocked(prisma.friendship.findUnique).mockResolvedValueOnce({
        userOneId: 'user-1',
        userTwoId: 'user-2',
      } as any)
      vi.mocked(prisma.conversation.findFirst).mockResolvedValueOnce(null)

      const mockCreatedConversation = { id: 'new-conv-123' }
      vi.mocked(prisma.$transaction).mockImplementationOnce(
        async (callback: any) => {
          const tx = {
            conversation: {
              create: vi.fn().mockResolvedValueOnce(mockCreatedConversation),
            },
            conversation_Participant: {
              createMany: vi.fn().mockResolvedValueOnce({ count: 2 }),
            },
          }
          return await callback(tx)
        },
      )

      const result = await createConversation('user-1', 'user-2')

      expect(result).toEqual(mockCreatedConversation)
      expect(prisma.$transaction).toHaveBeenCalled()
    })

    it('does not create a conversation for users who are not friends', async () => {
      vi.mocked(prisma.friendship.findUnique).mockResolvedValueOnce(null)

      await expect(createConversation('user-1', 'user-2')).resolves.toBeNull()
      expect(prisma.conversation.findFirst).not.toHaveBeenCalled()
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })
  })

  describe('conversation message access', () => {
    it('checks that a user participates in a conversation', async () => {
      vi.mocked(prisma.conversation.findFirst).mockResolvedValueOnce({
        id: 'conversation-1',
      } as any)

      await expect(
        isConversationParticipant('conversation-1', 'user-1'),
      ).resolves.toBe(true)
      expect(prisma.conversation.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'conversation-1',
          conversationParticipants: { some: { userId: 'user-1' } },
        },
        select: { id: true },
      })
    })

    it('returns chronological message history only to a participant', async () => {
      const oldest = { id: 'old', createdAt: new Date('2026-01-01') }
      const newest = { id: 'new', createdAt: new Date('2026-01-02') }
      vi.mocked(prisma.conversation.findFirst).mockResolvedValueOnce({
        messages: [newest, oldest],
      } as any)

      await expect(
        getConversationMessages('conversation-1', 'user-1'),
      ).resolves.toEqual([oldest, newest])
      expect(prisma.conversation.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'conversation-1',
          conversationParticipants: { some: { userId: 'user-1' } },
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
              createdBy: { select: { id: true, name: true } },
            },
          },
        },
      })
    })

    it('does not send a message if the sender is not a participant', async () => {
      vi.mocked(prisma.conversation.findFirst).mockResolvedValueOnce(null)

      await expect(
        sendMessage('conversation-1', 'user-3', 'Hello'),
      ).resolves.toBeNull()
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it('persists messages and updates the conversation timestamp before returning', async () => {
      vi.mocked(prisma.conversation.findFirst).mockResolvedValueOnce({
        id: 'conversation-1',
      } as any)
      const message = {
        id: 'message-1',
        content: 'Hello',
        createdAt: new Date(),
        createdById: 'user-1',
        createdBy: { id: 'user-1', name: 'Alice' },
      }
      const tx = {
        message: { create: vi.fn().mockResolvedValueOnce(message) },
        conversation: { update: vi.fn().mockResolvedValueOnce({}) },
      }
      vi.mocked(prisma.$transaction).mockImplementationOnce(
        async (callback: any) => callback(tx),
      )

      await expect(
        sendMessage('conversation-1', 'user-1', 'Hello'),
      ).resolves.toEqual(message)
      expect(tx.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            conversationId: 'conversation-1',
            createdById: 'user-1',
            content: 'Hello',
          },
        }),
      )
      expect(tx.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conversation-1' },
        data: { updatedAt: expect.any(Date) },
      })
    })
  })
})
