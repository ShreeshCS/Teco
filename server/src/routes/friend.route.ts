import {
  acceptFriendRequest,
  createFriendRequest,
  declineFriendRequest,
  getPendingFriendRequests,
} from '@/controllers/friend.controller.js'
import { Router } from 'express'

const router = Router()

router.get('/pending', getPendingFriendRequests)
router.post('/send', createFriendRequest)
router.post('/accept', acceptFriendRequest)
router.post('/decline', declineFriendRequest)

export default router
