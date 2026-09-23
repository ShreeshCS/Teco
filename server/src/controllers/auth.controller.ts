import { Request, Response } from 'express'
import * as authService from '../services/auth.service.js'
import { AuthenticationError } from '../middleware/domain/errors/errors.js'
import { signAccessToken } from '../lib/jwt.js'

export const registerUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      res
        .status(400)
        .json({ message: 'Name, email, and password are required' })
      return
    }

    const newUser = await authService.registerUserService({
      name,
      email,
      password,
    })

    res.status(201).json(newUser)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Internal server error'

    console.error('Error adding user:', message)
    res.status(500).json({ message })
  }
}

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body

    const user = await authService.loginUserService({ email, password })

    const token = signAccessToken({
      userId: user.id,
      email: user.email,
    })

    if (!user) {
      throw new AuthenticationError()
    }

    res.status(200).json({
      user,
      token,
    })
  } catch (error) {
    if (error instanceof AuthenticationError) {
      res.status(401).json({ message: error.message })
      return
    }
    const message =
      error instanceof Error ? error.message : 'Internal server error'

    console.error('Error logging in user:', message)
    res.status(500).json({ message })
  }
}
