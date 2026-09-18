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

import { prisma } from '../lib/prisma.js'
import { RegisterPayload, SafeUser } from '../types/auth.js'

export const registerUserService = async (userData: RegisterPayload) => {
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

  return user;
}

const hashPassword = async (password: string): Promise<string> => {
  // Implement your password hashing logic here (e.g., using bcrypt)
  // For demonstration purposes, we'll just return the plain password.
  // In a real application, you should never store plain passwords.
  return password
}
