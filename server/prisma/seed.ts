/// <reference types="node" />
import { prisma } from '../src/lib/prisma'

async function main() {
  // Clear existing users if necessary to prevent unique constraint errors during re-seeding
  await prisma.user.deleteMany()

  const user1 = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      name: 'Alice',
      passwordHash: 'mock_hashed_password_1', // Auth is not implemented yet
    },
  })

  const user2 = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      name: 'Bob',
      passwordHash: 'mock_hashed_password_2',
    },
  })

  console.log('Database seeded:', { user1, user2 })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
