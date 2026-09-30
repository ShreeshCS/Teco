/* eslint-disable @typescript-eslint/no-namespace */
import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken, TokenPayload } from '../../../lib/jwt.js'

// Extend Express Request interface to include authenticated user payload
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload
    }
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1] // Expects "Bearer <token>"

  if (!token) {
    res.status(401).json({ message: 'Authentication token required' })
    return
  }

  try {
    const payload = verifyAccessToken(token)
    req.user = payload // Attach decoded user info to request
    next()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ message: 'Token has expired' })
      return
    }
    res.status(403).json({ message: 'Invalid token' })
    return
  }
}
