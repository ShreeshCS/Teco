import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getConversations,
  createConversation,
} from '@/services/chat.service.js'
import { prisma } from '@/lib/prisma.js'

vi.mock('@/lib/prisma.js', () => ({
  prisma: {
    conversation: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
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
      vi.mocked(prisma.conversation.findFirst).mockResolvedValueOnce({
        id: 'existing-conv',
      } as any)

      const result = await createConversation('user-1', 'user-2')

      expect(result).toEqual({ id: 'existing-conv' })
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it('should create new conversation and participants in a transaction when none exists', async () => {
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
  })
})
