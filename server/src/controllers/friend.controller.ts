import { getAuthenticatedUserId } from '@/lib/auth.js'
import { FriendRequestValidationError } from '@/middleware/domain/errors/errors.js'
import { friendshipService } from '@/services/index.js'
import { Request, Response } from 'express'

export async function getFriends(req: Request, res: Response): Promise<void> {
  const userId = getAuthenticatedUserId(req, res)

  if (!userId) return

  try {
    const friends = await friendshipService.getFriends(userId)
    res.status(200).json(friends)
  } catch (error) {
    console.error('Error fetching friends:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export async function getPendingFriendRequests(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = getAuthenticatedUserId(req, res)

  if (!userId) return

  try {
    const requests =
      await friendshipService.getPendingFriendRequests(userId)
    res.status(200).json(
      requests.map(({ sender, ...request }) => ({
        ...request,
        senderName: sender.name,
        senderEmail: sender.email,
      })),
    )
  } catch (error) {
    console.error('Error fetching pending friend requests:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export async function createFriendRequest(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const userId = getAuthenticatedUserId(req, res)

    if (!userId) return

    const receiverId = req.body?.receiverId

    if (!receiverId || typeof receiverId !== 'string' || !receiverId.trim()) {
      res.status(400).json({ message: 'receiverId is required' })
      return
    }

    const friendRequest = await friendshipService.createFriendRequest(
      userId,
      receiverId.trim(),
    )
    if (!friendRequest) {
      res.status(400).json({ message: 'Cannot send this request. User not found.' })
      return
    }
    res.status(200).json(friendRequest)
  } catch (error) {
    console.error('Error creating friend request:', error)
    if (error instanceof FriendRequestValidationError) {
      res.status(400).json({ message: error.message })
      return
    }
    res.status(500).json({ message: 'Internal server error' })
  }
}

export async function declineFriendRequest(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = getAuthenticatedUserId(req, res)

  if (!userId) return

  const requestId = req.body?.requestId

  if (typeof requestId !== 'string' || !requestId.trim()) {
    res.status(400).json({ message: 'requestId is required' })
    return
  }

  try {
    const declined = await friendshipService.declineFriendRequest(
      requestId,
      userId,
    )

    if (!declined) {
      res.status(404).json({ message: 'Pending friend request not found' })
      return
    }

    res.status(204).end()
  } catch (error) {
    console.error('Error declining friend request:', error)
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

    const requestId = req.body?.requestId

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
    console.error('Error accepting friend request:', error)
    if (error instanceof FriendRequestValidationError) {
      res.status(400).json({ message: error.message })
      return
    }
    res.status(500).json({ message: 'Internal server error' })
  }
}
