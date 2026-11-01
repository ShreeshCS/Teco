import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  toCanonicalOrder,
  createFriendRequest,
} from '@/services/friend.service.js'
import { prisma } from '@/lib/prisma.js'
import { FriendRequestValidationError } from '@/middleware/domain/errors/errors.js'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client'

vi.mock('@/lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    friendship: {
      findUnique: vi.fn(),
    },
    friendRequest: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

describe('friend.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('toCanonicalOrder', () => {
    it('should place smaller string as userOneId when userIdA < userIdB', () => {
      const result = toCanonicalOrder('user-1', 'user-2')
      expect(result).toEqual({ userOneId: 'user-1', userTwoId: 'user-2' })
    })

    it('should place smaller string as userOneId when userIdA > userIdB', () => {
      const result = toCanonicalOrder('user-2', 'user-1')
      expect(result).toEqual({ userOneId: 'user-1', userTwoId: 'user-2' })
    })
  })

  describe('createFriendRequest', () => {
    const senderId = 'sender-123'
    const receiverId = 'receiver-456'

    it('should throw FriendRequestValidationError if senderId is the same as receiverId', async () => {
      await expect(createFriendRequest('user-1', 'user-1')).rejects.toThrow(
        FriendRequestValidationError,
      )
      await expect(createFriendRequest('user-1', 'user-1')).rejects.toThrow(
        'You cannot send a friend request to yourself.',
      )
    })

    it('should return null if receiver is not found in the database', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)

      const result = await createFriendRequest(senderId, receiverId)

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: receiverId },
        select: { id: true },
      })
      expect(result).toBeNull()
    })

    it('should throw FriendRequestValidationError if users are already friends', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: receiverId,
      } as any)
      vi.mocked(prisma.friendship.findUnique).mockResolvedValueOnce({
        userOneId: senderId < receiverId ? senderId : receiverId,
        userTwoId: senderId < receiverId ? receiverId : senderId,
        createdAt: new Date(),
      } as any)

      await expect(createFriendRequest(senderId, receiverId)).rejects.toThrow(
        FriendRequestValidationError,
      )
    })

    it('should throw FriendRequestValidationError if a reverse pending request exists', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: receiverId,
      } as any)
      vi.mocked(prisma.friendship.findUnique).mockResolvedValueOnce(null)
      vi.mocked(prisma.friendRequest.findUnique).mockResolvedValueOnce({
        id: 'existing-req',
        senderId: receiverId,
        recipientId: senderId,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
        respondedAt: null,
      })

      await expect(createFriendRequest(senderId, receiverId)).rejects.toThrow(
        'This user has already sent you a friend request. Accept their request instead.',
      )
    })

    it('should catch P2002 Prisma duplicate error and throw FriendRequestValidationError', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: receiverId,
      } as any)
      vi.mocked(prisma.friendship.findUnique).mockResolvedValueOnce(null)
      vi.mocked(prisma.friendRequest.findUnique).mockResolvedValueOnce(null)

      const prismaError = new PrismaClientKnownRequestError('Duplicate entry', {
        code: 'P2002',
        clientVersion: '7.10.0',
      })
      vi.mocked(prisma.friendRequest.create).mockRejectedValueOnce(prismaError)

      await expect(createFriendRequest(senderId, receiverId)).rejects.toThrow(
        FriendRequestValidationError,
      )
    })

    it('should rethrow unexpected errors from prisma.friendRequest.create', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: receiverId,
      } as any)
      vi.mocked(prisma.friendship.findUnique).mockResolvedValueOnce(null)
      vi.mocked(prisma.friendRequest.findUnique).mockResolvedValueOnce(null)

      const unexpectedError = new Error('Database connection failed')
      vi.mocked(prisma.friendRequest.create).mockRejectedValueOnce(
        unexpectedError,
      )

      await expect(createFriendRequest(senderId, receiverId)).rejects.toThrow(
        'Database connection failed',
      )
    })

    it('should successfully create and return a friend request', async () => {
      const mockCreatedRequest = {
        id: 'request-123',
        senderId,
        recipientId: receiverId,
        status: 'PENDING' as const,
        createdAt: new Date(),
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: receiverId,
      } as any)
      vi.mocked(prisma.friendship.findUnique).mockResolvedValueOnce(null)
      vi.mocked(prisma.friendRequest.findUnique).mockResolvedValueOnce(null)
      vi.mocked(prisma.friendRequest.create).mockResolvedValueOnce(
        mockCreatedRequest as any,
      )

      const result = await createFriendRequest(senderId, receiverId)

      expect(prisma.friendRequest.create).toHaveBeenCalledWith({
        data: {
          senderId,
          recipientId: receiverId,
          status: 'PENDING',
        },
        select: {
          id: true,
          senderId: true,
          recipientId: true,
          status: true,
          createdAt: true,
        },
      })
      expect(result).toEqual(mockCreatedRequest)
    })
  })
})
