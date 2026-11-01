import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getAllUsers,
  getAuthenticatedUserService,
} from '@/services/user.service.js'
import { prisma } from '@/lib/prisma.js'

vi.mock('@/lib/prisma.js', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}))

describe('user.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAllUsers', () => {
    it('should return all users with safe fields', async () => {
      const mockUsers = [
        {
          id: '1',
          name: 'User 1',
          email: 'u1@example.com',
          createdAt: new Date(),
        },
        {
          id: '2',
          name: 'User 2',
          email: 'u2@example.com',
          createdAt: new Date(),
        },
      ]
      vi.mocked(prisma.user.findMany).mockResolvedValueOnce(mockUsers as any)

      const users = await getAllUsers()

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      })
      expect(users).toEqual(mockUsers)
    })
  })

  describe('getAuthenticatedUserService', () => {
    it('should return safe profile for the given userId', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Alice',
        email: 'alice@example.com',
        createdAt: new Date(),
      }
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser as any)

      const user = await getAuthenticatedUserService('user-123')

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      })
      expect(user).toEqual(mockUser)
    })

    it('should return null if user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)

      const user = await getAuthenticatedUserService('non-existent')

      expect(user).toBeNull()
    })
  })
})
