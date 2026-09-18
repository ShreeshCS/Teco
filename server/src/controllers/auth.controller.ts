import { Request, Response } from 'express'
import * as authService from '../services/auth.service.js'

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ message: 'Name, email, and password are required' })
      return
    }

    const newUser = await authService.registerUserService({ name, email, password })

    res.status(201).json(newUser)
  } catch (error) {
    console.error('Error adding user:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}