/**
 * Authentication Service
 *
 * Responsibility: Business logic and database operations for user authentication.
 *
 * This service handles user registration with the following operations:
 * - Imports prisma from ../lib/prisma.js for database operations
 * - Hashes plaintext passwords using bcrypt or argon2 for security
 * - Inserts new users via prisma.user.create()
 * - Catches Prisma unique constraint errors (P2002) on email field and throws domain errors (EmailAlreadyExistsError)
 * - Uses Prisma's select to return only safe attributes (id, name, email, createdAt), omitting passwordHash
 */

import { Prisma } from '../generated/prisma/index.js'
import { prisma } from '../lib/prisma.js'
import { EmailAlreadyExistsError } from '../middleware/exceptionHandler.js'
import { RegisterPayload, SafeUser } from '../types/auth.js'
import bcrypt from 'bcrypt'

export const registerUserService = async (userData: RegisterPayload) => {
  try {
    // Hash the password before storing it in the database
    const passwordHash = await hashPassword(userData.password)

    const user: SafeUser = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        passwordHash: passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    })

    return user
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const errorMessage =
        error.message.includes('constraint: `User_email_key`') ?? ''
      if (errorMessage) {
        throw new EmailAlreadyExistsError()
      }
    }
    throw error
  }
}

const hashPassword = async (password: string): Promise<string> => {
  const hashedPassword = bcrypt.hash(password, 10)
  return hashedPassword
}

const verifyPassword = async (
  normalPassword: string,
  hashedPassword: string,
): Promise<boolean> => {
  return await bcrypt.compare(normalPassword, hashedPassword)
}

export const loginUserService = async (userData: {
  email: string
  password: string
}) => {
  const user = await prisma.user.findUnique({
    where: { email: userData.email },
    select: {
      passwordHash: true,
    },
  })

  if(user && user.passwordHash) {
    const isPasswordValid = await verifyPassword(
      userData.password,
      user.passwordHash,
    )
    if (!isPasswordValid) {
      throw new Error('Invalid credentials')
    }
  } else {
    throw new Error('User not found')
  }
}
