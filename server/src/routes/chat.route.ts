import { Router } from 'express'
import { createConversation, getConversations } from '../controllers/chat.controller.js'

const router = Router()

router.get('/', getConversations)
router.post('/', createConversation)

export default router
