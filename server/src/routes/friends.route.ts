import { getFriends } from '@/controllers/friend.controller.js'
import { Router } from 'express'

const router = Router()

router.get('/', getFriends)

export default router
