import { Request, Response } from 'express'
import * as userService from '../services/user.service.js'

export const getUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await userService.getAllUsers()

    res.status(200).json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId

    if (!userId) {
      res.status(401).json({ message: 'User not found in session' })
      return
    }
    const user = await userService.getAuthenticatedUserService(userId)

    if (!user) {
      res.status(404).json({ message: 'User account does not exist' })
      return
    }

    res.status(200).json({ user })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Internal server error'
    console.error('Error in getMe controller:', message)
    res.status(500).json({ message })
  }
}
