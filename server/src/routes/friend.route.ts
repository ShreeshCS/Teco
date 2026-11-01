import {
  acceptFriendRequest,
  createFriendRequest,
} from '@/controllers/friend.controller.js'
import { Router } from 'express'

const router = Router()

router.post('/send', createFriendRequest)
router.post('/accept', acceptFriendRequest)

export default router
