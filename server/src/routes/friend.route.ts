import {
  acceptFriendRequest,
  createFriendRequest,
  getAcceptedFriends,
} from '@/controllers/friend.controller.js'
import { Router } from 'express'

const router = Router()

router.post('/send', createFriendRequest)
router.post('/accept', acceptFriendRequest)
router.get('/', getAcceptedFriends)
router.get('/friends', getAcceptedFriends)

export default router
