import { Request, Response } from 'express'
import * as userService from '../services/user.service.js'

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await userService.getAllUsers()

    res.status(200).json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
