import { Router } from 'express'
import { getMe, getUsers } from '../controllers/user.controller.js'

const router = Router()

router.get('/details', getUsers)
router.get('/me', getMe)

export default router
