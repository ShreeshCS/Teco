import { prisma } from '../lib/prisma.js'

export const getAllUsers = async () => {
  return await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  })
}
