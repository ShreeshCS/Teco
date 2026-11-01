import { createFriendRequest } from '@/controllers/friend.controller.js'
import { Router } from 'express'

const router = Router()

router.post('/send', createFriendRequest)

export default router;