import { Router } from 'express'
import { getConversations } from '../controllers/chat.controller.js'

const router = Router()

router.get('/', getConversations)

export default router
