import { Router } from 'express'
import {
  createGroup,
  deleteGroup,
  getGroups,
  updateGroup,
} from '../controllers/group.controller.js'

const router = Router()

router.get('/', getGroups)
router.post('/', createGroup)
router.patch('/:groupId', updateGroup)
router.delete('/:groupId', deleteGroup)

export default router
