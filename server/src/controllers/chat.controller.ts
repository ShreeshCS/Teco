import type { Request, Response } from 'express'
import { getConversationByUser } from '../services/chat.service.js'

export const getConversations = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.user?.userId

  if (!userId) {
    res.status(401).json({ message: 'User not found in session' })
    return
  }

  try {
    const conversations = await getConversationByUser(userId)
    res.status(200).json(conversations)
  } catch (error) {
    console.error('Error fetching conversations:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
