import { getAuthenticatedUserId } from '@/lib/auth.js'
import { FriendRequestValidationError } from '@/middleware/domain/errors/errors.js'
import { friendshipService } from '@/services/index.js'
import { Request, Response } from 'express'

export async function createFriendRequest(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const userId = getAuthenticatedUserId(req, res)

    if (!userId) return

    const receiverId = req.body.receiverId

    const friendRequest = await friendshipService.createFriendRequest(
      userId,
      receiverId,
    )
    if (!friendRequest) {
      res.status(400).json({ message: 'Cannot send this request' })
      return
    }
    res.status(200).json(friendRequest)
  } catch (error) {
    if (error instanceof FriendRequestValidationError) {
      res.status(400).json({ message: error.message })
      return
    }
    res.status(500).json({ message: 'Internal server error' })
  }
}

export async function acceptFriendRequest(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const userId = getAuthenticatedUserId(req, res)

    if (!userId) return

    const requestId = req.body.requestId

    if (!requestId) {
      res.status(400).json({ message: 'requestId is required' })
      return
    }

    const friendship = await friendshipService.acceptFriendRequest(
      requestId,
      userId,
    )

    res.status(200).json({
      message: 'Friend request accepted',
      friendship,
    })
  } catch (error) {
    if (error instanceof FriendRequestValidationError) {
      res.status(400).json({ message: error.message })
      return
    }
    res.status(500).json({ message: 'Internal server error' })
  }
}

export async function getAcceptedFriends(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const userId = getAuthenticatedUserId(req, res)

    if (!userId) return

    const friends = await friendshipService.getAcceptedFriends(userId)
    res.status(200).json(friends)
  } catch (error) {
    if(error instanceof Error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
