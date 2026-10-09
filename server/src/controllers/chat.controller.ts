import type { Request, Response } from 'express'
import { getConversationByUser } from '../services/chat.service.js'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client'

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
    if (error instanceof PrismaClientKnownRequestError) {
      console.error('Error fetching conversations:', error.message)
    }
    res.status(500).json({ message: 'Internal server error' })
  }
}
