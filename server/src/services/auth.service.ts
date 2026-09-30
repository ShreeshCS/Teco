import { Prisma } from '../generated/prisma/index.js'
import { prisma } from '../lib/prisma.js'
import {
  AuthenticationError,
  EmailAlreadyExistsError,
} from '../middleware/domain/errors/errors.js'
import {
  LoginPayload,
  LoginResponseDetails,
  RegisterPayload,
  SafeUserDetails,
} from '../types/auth.types.js'
import bcrypt from 'bcrypt'

const SALT_ROUNDS = 10

const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT_ROUNDS)
}

const verifyPassword = async (
  plainText: string,
  hashed: string,
): Promise<boolean> => {
  return await bcrypt.compare(plainText, hashed)
}

export const registerUserService = async (
  userData: RegisterPayload,
): Promise<SafeUserDetails> => {
  try {
    // Hash the password before storing it in the database
    const passwordHash = await hashPassword(userData.password)

    const user: SafeUserDetails = await prisma.user.create({
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

export const loginUserService = async (
  userData: LoginPayload,
): Promise<LoginResponseDetails> => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: userData.email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
      },
    })

    if (!user || !user.passwordHash) {
      throw new AuthenticationError()
    }

    const isPasswordValid = await verifyPassword(
      userData.password,
      user.passwordHash,
    )

    if (!isPasswordValid) {
      throw new AuthenticationError()
    }

    return {
      id: user.id,
      email: user.email,
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('Database error during login:', error.message)
    }
    throw error
  }
}
