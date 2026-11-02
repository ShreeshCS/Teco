import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  registerUserService,
  loginUserService,
} from '@/services/auth.service.js'
import { prisma } from '@/lib/prisma.js'
import {
  AuthenticationError,
  EmailAlreadyExistsError,
} from '@/middleware/domain/errors/errors.js'
import { Prisma } from '@/generated/prisma/index.js'
import bcrypt from 'bcrypt'

vi.mock('@/lib/prisma.js', () => ({
  prisma: {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}))

describe('auth.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('registerUserService', () => {
    const registerPayload = {
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password123',
    }

    it('should hash password and create safe user details on success', async () => {
      vi.mocked(bcrypt.hash).mockResolvedValueOnce('hashed-password' as never)
      const mockCreatedUser = {
        id: 'user-123',
        name: 'Alice',
        email: 'alice@example.com',
        createdAt: new Date(),
      }
      vi.mocked(prisma.user.create).mockResolvedValueOnce(
        mockCreatedUser as any,
      )

      const result = await registerUserService(registerPayload)

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10)
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: 'Alice',
          email: 'alice@example.com',
          passwordHash: 'hashed-password',
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      })
      expect(result).toEqual(mockCreatedUser)
    })

    it('should throw EmailAlreadyExistsError when email is duplicate (P2002)', async () => {
      vi.mocked(bcrypt.hash).mockResolvedValueOnce('hashed-password' as never)
      const p2002Error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on the constraint: `User_email_key`',
        { code: 'P2002', clientVersion: '7.10.0' },
      )
      vi.mocked(prisma.user.create).mockRejectedValueOnce(p2002Error)

      await expect(registerUserService(registerPayload)).rejects.toThrow(
        EmailAlreadyExistsError,
      )
    })

    it('should rethrow generic database errors during registration', async () => {
      vi.mocked(bcrypt.hash).mockResolvedValueOnce('hashed-password' as never)
      vi.mocked(prisma.user.create).mockRejectedValueOnce(
        new Error('DB failure'),
      )

      await expect(registerUserService(registerPayload)).rejects.toThrow(
        'DB failure',
      )
    })
  })

  describe('loginUserService', () => {
    const loginPayload = {
      email: 'alice@example.com',
      password: 'password123',
    }

    it('should throw AuthenticationError if user does not exist', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)

      await expect(loginUserService(loginPayload)).rejects.toThrow(
        AuthenticationError,
      )
    })

    it('should throw AuthenticationError if password does not match', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'user-123',
        email: 'alice@example.com',
        passwordHash: 'hashed-password',
      } as any)
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(false as never)

      await expect(loginUserService(loginPayload)).rejects.toThrow(
        AuthenticationError,
      )
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashed-password',
      )
    })

    it('should return id and email when credentials are valid', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'user-123',
        email: 'alice@example.com',
        passwordHash: 'hashed-password',
      } as any)
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never)

      const result = await loginUserService(loginPayload)

      expect(result).toEqual({
        id: 'user-123',
        email: 'alice@example.com',
      })
    })
  })
})
