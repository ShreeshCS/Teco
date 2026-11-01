import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  toCanonicalOrder,
  createFriendRequest,
  acceptFriendRequest,
  getAcceptedFriends,
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
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
    friendRequest: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
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

  describe('acceptFriendRequest', () => {
    const requestId = 'req-123'
    const recipientId = 'recipient-456'
    const senderId = 'sender-789'

    it('should throw FriendRequestValidationError if request is not found or not pending', async () => {
      vi.mocked(prisma.friendRequest.findUnique).mockResolvedValueOnce(null)
      await expect(acceptFriendRequest(requestId, recipientId)).rejects.toThrow(
        FriendRequestValidationError,
      )
    })

    it('should throw FriendRequestValidationError if user is not the recipient', async () => {
      vi.mocked(prisma.friendRequest.findUnique).mockResolvedValueOnce({
        id: requestId,
        senderId,
        recipientId,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
        respondedAt: null,
      })

      await expect(
        acceptFriendRequest(requestId, 'different-user'),
      ).rejects.toThrow(
        'You are not authorized to accept this friend request.',
      )
    })

    it('should accept friend request and upsert friendship', async () => {
      vi.mocked(prisma.friendRequest.findUnique).mockResolvedValueOnce({
        id: requestId,
        senderId,
        recipientId,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
        respondedAt: null,
      })

      const expectedFriendship = {
        userOneId: recipientId < senderId ? recipientId : senderId,
        userTwoId: recipientId < senderId ? senderId : recipientId,
        createdAt: new Date(),
      }

      const txMock = {
        friendRequest: { update: vi.fn().mockResolvedValue({}) },
        friendship: { upsert: vi.fn().mockResolvedValue(expectedFriendship) },
      }
      vi.mocked(prisma.$transaction).mockImplementationOnce(async (cb: any) =>
        cb(txMock),
      )

      const result = await acceptFriendRequest(requestId, recipientId)

      expect(txMock.friendRequest.update).toHaveBeenCalledWith({
        where: { id: requestId },
        data: {
          status: 'ACCEPTED',
          respondedAt: expect.any(Date),
        },
      })
      expect(txMock.friendship.upsert).toHaveBeenCalledWith({
        where: {
          userOneId_userTwoId: {
            userOneId: expectedFriendship.userOneId,
            userTwoId: expectedFriendship.userTwoId,
          },
        },
        update: {},
        create: {
          userOneId: expectedFriendship.userOneId,
          userTwoId: expectedFriendship.userTwoId,
        },
      })
      expect(result).toEqual(expectedFriendship)
    })
  })

  describe('getAcceptedFriends', () => {
    const currentUserId = 'user-current-123'

    it('should return an empty array with 200 when user has no friends', async () => {
      vi.mocked(prisma.friendship.findMany).mockResolvedValueOnce([])

      const result = await getAcceptedFriends(currentUserId)

      expect(prisma.friendship.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ userOneId: currentUserId }, { userTwoId: currentUserId }],
        },
        include: {
          userOne: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
            },
          },
          userTwo: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
      expect(result).toEqual([])
    })

    it('should return friends and never return the current user as their own friend', async () => {
      const mockFriendA = {
        id: 'user-a',
        name: 'Alice',
        email: 'alice@example.com',
        createdAt: new Date('2026-01-01'),
      }
      const mockFriendB = {
        id: 'user-b',
        name: 'Bob',
        email: 'bob@example.com',
        createdAt: new Date('2026-01-02'),
      }
      const mockCurrentUser = {
        id: currentUserId,
        name: 'Current User',
        email: 'me@example.com',
        createdAt: new Date('2026-01-01'),
      }

      // Friendship 1: current user is userTwo, Alice is userOne
      // Friendship 2: current user is userOne, Bob is userTwo
      const mockFriendships = [
        {
          userOneId: 'user-a',
          userTwoId: currentUserId,
          createdAt: new Date(),
          userOne: mockFriendA,
          userTwo: mockCurrentUser,
        },
        {
          userOneId: currentUserId,
          userTwoId: 'user-b',
          createdAt: new Date(),
          userOne: mockCurrentUser,
          userTwo: mockFriendB,
        },
      ]

      vi.mocked(prisma.friendship.findMany).mockResolvedValueOnce(
        mockFriendships as any,
      )

      const result = await getAcceptedFriends(currentUserId)

      expect(result).toHaveLength(2)
      // Each friendship appears once
      expect(result).toEqual([mockFriendA, mockFriendB])
      // Current user is never returned as friend
      expect(result.some((f) => f.id === currentUserId)).toBe(false)
      // Only safe user fields are present
      result.forEach((friend) => {
        expect(friend).toHaveProperty('id')
        expect(friend).toHaveProperty('name')
        expect(friend).toHaveProperty('email')
        expect(friend).toHaveProperty('createdAt')
        expect(friend).not.toHaveProperty('passwordHash')
      })
    })
  })
})
