import type { Request, Response } from 'express'

export const getAuthenticatedUserId = (
  req: Request,
  res: Response,
): string | null => {
  const userId = req.user?.userId

  if (!userId) {
    res.status(401).json({ message: 'User not found in session' })
    return null
  }

  return userId
}
