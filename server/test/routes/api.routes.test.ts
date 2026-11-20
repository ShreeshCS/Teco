import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import app from '@/app.js'
import * as authService from '@/services/auth.service.js'
import * as userService from '@/services/user.service.js'
import { chatServices, friendshipService } from '@/services/index.js'
import {
  AuthenticationError,
  EmailAlreadyExistsError,
  FriendRequestValidationError,
} from '@/middleware/domain/errors/errors.js'
import { signAccessToken } from '@/lib/jwt.js'

vi.mock('@/services/auth.service.js')
vi.mock('@/services/user.service.js')
vi.mock('@/services/friend.service.js')
vi.mock('@/services/chat.service.js')

describe('API Route Integration Tests', () => {
  const testUser = {
    userId: 'user-abc-123',
    email: 'test@example.com',
  }
  let validToken: string

  beforeEach(() => {
    vi.clearAllMocks()
    validToken = signAccessToken(testUser)
  })

  describe('GET /health', () => {
    it('should return 200 and hello message', async () => {
      const res = await request(app).get('/health')
      expect(res.status).toBe(200)
      expect(res.body).toBe('Hello from Server!')
    })
  })

  describe('Conversation endpoints', () => {
    it('requires authentication before creating a conversation', async () => {
      const res = await request(app)
        .post('/api/conversations')
        .send({ friendId: 'friend-1' })

      expect(res.status).toBe(401)
      expect(chatServices.createConversation).not.toHaveBeenCalled()
    })

    it('creates conversations for the authenticated user and a friend', async () => {
      vi.mocked(chatServices.createConversation).mockResolvedValueOnce({
        id: 'conversation-1',
      } as any)

      const res = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ friendId: 'friend-1' })

      expect(res.status).toBe(201)
      expect(res.body).toEqual({ id: 'conversation-1' })
      expect(chatServices.createConversation).toHaveBeenCalledWith(
        testUser.userId,
        'friend-1',
      )
    })

    it('returns conversation history only to an authenticated participant', async () => {
      const messages = [
        {
          id: 'message-1',
          content: 'Hello',
          createdAt: new Date('2026-01-01').toISOString(),
          createdById: testUser.userId,
          createdBy: { id: testUser.userId, name: 'Test User' },
        },
      ]
      vi.mocked(chatServices.getConversationMessages).mockResolvedValueOnce(
        messages as any,
      )

      const res = await request(app)
        .get('/api/conversations/conversation-1/messages')
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toEqual(messages)
      expect(chatServices.getConversationMessages).toHaveBeenCalledWith(
        'conversation-1',
        testUser.userId,
      )
    })
  })

  describe('POST /api/auth/register', () => {
    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' })

      expect(res.status).toBe(400)
      expect(res.body).toEqual({
        message: 'Name, email, and password are required',
      })
    })

    it('should return 409 if user email already exists', async () => {
      vi.mocked(authService.registerUserService).mockRejectedValueOnce(
        new EmailAlreadyExistsError(
          'An account with this email already exists.',
        ),
      )

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Alice',
          email: 'alice@example.com',
          password: 'password123',
        })

      expect(res.status).toBe(409)
      expect(res.body).toBe('An account with this email already exists.')
    })

    it('should return 201 with created safe user details on success', async () => {
      const mockSafeUser = {
        id: 'new-user-1',
        name: 'Alice',
        email: 'alice@example.com',
        createdAt: new Date().toISOString(),
      }
      vi.mocked(authService.registerUserService).mockResolvedValueOnce(
        mockSafeUser as any,
      )

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Alice',
          email: 'alice@example.com',
          password: 'password123',
        })

      expect(res.status).toBe(201)
      expect(res.body).toEqual(mockSafeUser)
    })
  })

  describe('POST /api/auth/login', () => {
    it('should return 401 on authentication failure', async () => {
      vi.mocked(authService.loginUserService).mockRejectedValueOnce(
        new AuthenticationError(),
      )

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'alice@example.com', password: 'wrong' })

      expect(res.status).toBe(401)
      expect(res.body).toEqual({ message: 'Invalid email or password' })
    })

    it('should return 200 with JWT token and user info on valid login', async () => {
      vi.mocked(authService.loginUserService).mockResolvedValueOnce({
        id: 'user-123',
        email: 'alice@example.com',
      })

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'alice@example.com', password: 'password123' })

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('token')
      expect(res.body.user).toEqual({
        id: 'user-123',
        email: 'alice@example.com',
      })
    })
  })

  describe('GET /api/user/me', () => {
    it('should return 401 when token is missing', async () => {
      const res = await request(app).get('/api/user/me')
      expect(res.status).toBe(401)
    })

    it('should return 200 and user profile when token is valid', async () => {
      const mockProfile = {
        id: testUser.userId,
        email: testUser.email,
        name: 'Alice',
        createdAt: new Date().toISOString(),
      }
      vi.mocked(userService.getAuthenticatedUserService).mockResolvedValueOnce(
        mockProfile as any,
      )

      const res = await request(app)
        .get('/api/user/me')
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toEqual(mockProfile)
    })
  })

  describe('GET /api/friends', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app).get('/api/friends')
      expect(res.status).toBe(401)
    })

    it('should return only safe friend details for the authenticated user', async () => {
      const friends = [
        {
          id: 'friend-1',
          name: 'Alice',
          email: 'alice@example.com',
          createdAt: new Date().toISOString(),
        },
      ]
      vi.mocked(friendshipService.getFriends).mockResolvedValueOnce(
        friends as any,
      )

      const res = await request(app)
        .get('/api/friends')
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toEqual(friends)
      expect(friendshipService.getFriends).toHaveBeenCalledWith(
        testUser.userId,
      )
      expect(res.body[0]).not.toHaveProperty('passwordHash')
    })

    it('should return 200 with an empty list when there are no friends', async () => {
      vi.mocked(friendshipService.getFriends).mockResolvedValueOnce([])

      const res = await request(app)
        .get('/api/friends')
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toEqual([])
    })
  })

  describe('GET /api/friend-request/pending', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/friend-request/pending')
      expect(res.status).toBe(401)
    })

    it('returns incoming pending requests with safe sender details', async () => {
      vi.mocked(friendshipService.getPendingFriendRequests).mockResolvedValueOnce(
        [
          {
            id: 'request-1',
            senderId: 'sender-1',
            recipientId: testUser.userId,
            status: 'PENDING',
            createdAt: new Date('2026-01-01'),
            sender: { name: 'Alice', email: 'alice@example.com' },
          },
        ] as any,
      )

      const res = await request(app)
        .get('/api/friend-request/pending')
        .set('Authorization', `Bearer ${validToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toEqual([
        {
          id: 'request-1',
          senderId: 'sender-1',
          recipientId: testUser.userId,
          status: 'PENDING',
          createdAt: new Date('2026-01-01').toISOString(),
          senderName: 'Alice',
          senderEmail: 'alice@example.com',
        },
      ])
      expect(friendshipService.getPendingFriendRequests).toHaveBeenCalledWith(
        testUser.userId,
      )
    })
  })

  describe('POST /api/friend-request/send', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/friend-request/send')
        .send({ receiverId: 'target-user' })

      expect(res.status).toBe(401)
    })

    it('should return 400 when validation fails', async () => {
      vi.mocked(friendshipService.createFriendRequest).mockRejectedValueOnce(
        new FriendRequestValidationError(
          'You cannot send a friend request to yourself.',
        ),
      )

      const res = await request(app)
        .post('/api/friend-request/send')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ receiverId: testUser.userId })

      expect(res.status).toBe(400)
      expect(res.body).toEqual({
        message: 'You cannot send a friend request to yourself.',
      })
    })

    it('should return 200 with friend request details on success', async () => {
      const mockRequest = {
        id: 'req-999',
        senderId: testUser.userId,
        recipientId: 'target-user',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      }
      vi.mocked(friendshipService.createFriendRequest).mockResolvedValueOnce(
        mockRequest as any,
      )

      const res = await request(app)
        .post('/api/friend-request/send')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ receiverId: 'target-user' })

      expect(res.status).toBe(200)
      expect(res.body).toEqual(mockRequest)
    })
  })

  describe('POST /api/friend-request/decline', () => {
    it('only removes a pending request when addressed to the authenticated user', async () => {
      vi.mocked(friendshipService.declineFriendRequest).mockResolvedValueOnce(
        true,
      )

      const res = await request(app)
        .post('/api/friend-request/decline')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ requestId: 'request-1' })

      expect(res.status).toBe(204)
      expect(friendshipService.declineFriendRequest).toHaveBeenCalledWith(
        'request-1',
        testUser.userId,
      )
    })
  })
})
