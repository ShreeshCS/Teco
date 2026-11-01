import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authenticateToken } from '@/middleware/domain/auth/auth.middleware.js'
import * as jwtLib from '@/lib/jwt.js'
import type { Request, Response, NextFunction } from 'express'

describe('auth.middleware', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let next: NextFunction

  beforeEach(() => {
    req = {
      headers: {},
    }
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    }
    next = vi.fn()
  })

  it('should return 401 if Authorization header is missing', () => {
    authenticateToken(req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Authentication token required',
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('should return 401 if Authorization header has no bearer token', () => {
    req.headers = { authorization: 'Bearer' }

    authenticateToken(req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Authentication token required',
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('should return 401 if token has expired', () => {
    req.headers = { authorization: 'Bearer expired-token' }

    const expiredError = new Error('jwt expired')
    expiredError.name = 'TokenExpiredError'
    vi.spyOn(jwtLib, 'verifyAccessToken').mockImplementationOnce(() => {
      throw expiredError
    })

    authenticateToken(req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'Token has expired' })
    expect(next).not.toHaveBeenCalled()
  })

  it('should return 403 if token is invalid', () => {
    req.headers = { authorization: 'Bearer invalid-token' }

    vi.spyOn(jwtLib, 'verifyAccessToken').mockImplementationOnce(() => {
      throw new Error('invalid signature')
    })

    authenticateToken(req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' })
    expect(next).not.toHaveBeenCalled()
  })

  it('should attach decoded user to req.user and call next() on valid token', () => {
    req.headers = { authorization: 'Bearer valid-token' }

    const mockPayload = { userId: 'user-123', email: 'user@example.com' }
    vi.spyOn(jwtLib, 'verifyAccessToken').mockReturnValueOnce(mockPayload)

    authenticateToken(req as Request, res as Response, next)

    expect(req.user).toEqual(mockPayload)
    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })
})

