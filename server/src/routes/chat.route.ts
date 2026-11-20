import { Router } from 'express'
import {
  createConversation,
  getConversationMessages,
  getConversations,
} from '../controllers/chat.controller.js'

const router = Router()

router.get('/', getConversations)
router.get('/:conversationId/messages', getConversationMessages)
router.post('/', createConversation)

export default router
