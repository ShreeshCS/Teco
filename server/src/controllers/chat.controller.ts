import type { Request, Response } from 'express'
import { chatServices } from '@/services/index.js'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client'
import { getAuthenticatedUserId } from '@/lib/auth.js'

export const getConversations = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = getAuthenticatedUserId(req, res)

  if (!userId) {
    return
  }

  try {
    const conversations = await chatServices.getConversations(userId)
    res.status(200).json(conversations)
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      console.error('Error fetching conversations:', error.message)
    }
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const createConversation = async (req: Request, res: Response) => {
  const userId = getAuthenticatedUserId(req, res)
  if (!userId) return

  const friendId = req.body?.friendId
  if (typeof friendId !== 'string' || !friendId.trim()) {
    return res.status(400).json({ message: 'friendId is required' })
  }

  try {
    const conversation = await chatServices.createConversation(
      userId,
      friendId.trim(),
    )
    if (!conversation) {
      return res.status(403).json({ message: 'You can only chat with friends' })
    }
    res.status(201).json(conversation)
  } catch (error) {
    if (error instanceof Error && error.message === 'A conversation requires two distinct users') {
      return res.status(400).json({ message: error.message })
    }
    if (error instanceof PrismaClientKnownRequestError) console.error(error.message)
    else console.error('Error creating conversation:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const getConversationMessages = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = getAuthenticatedUserId(req, res)
  if (!userId) return

  const { conversationId } = req.params
  if (typeof conversationId !== 'string' || !conversationId) {
    res.status(400).json({ message: 'conversationId is required' })
    return
  }

  try {
    const messages = await chatServices.getConversationMessages(
      conversationId,
      userId,
    )
    if (!messages) {
      res.status(404).json({ message: 'Conversation not found' })
      return
    }
    res.status(200).json(messages)
  } catch (error) {
    console.error('Error fetching conversation messages:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
