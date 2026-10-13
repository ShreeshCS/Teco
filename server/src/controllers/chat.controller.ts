import type { Request, Response } from 'express'
import { chatServices } from '@/services/index.js'
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
    const conversations = await chatServices.getConversationByUser(userId)
    res.status(200).json(conversations)
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      console.error('Error fetching conversations:', error.message)
    }
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const createConversation = async (req: Request, res: Response) => {
  const { userId1, userId2 } = req.body
  if (!userId1 || !userId2) {
    return res.status(400).json({ message: 'Bad request' })
  }

  try {
    const conversation = await chatServices.createConversation(userId1, userId2)
    res.status(201).json(conversation)
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      console.error(error.message)
    }
    res.status(500).json({ message: 'Internal server error' })
  }
}
