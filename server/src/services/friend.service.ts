import { prisma } from '@/lib/prisma.js'
import { FriendRequestValidationError } from '@/middleware/domain/errors/errors.js'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client'

/**
 * Ensures user IDs are ordered canonically (userOneId < userTwoId)
 * to respect the composite primary key on the Friendship table.
 */
export const toCanonicalOrder = (
  userIdA: string,
  userIdB: string,
): { userOneId: string; userTwoId: string } => {
  return userIdA < userIdB
    ? { userOneId: userIdA, userTwoId: userIdB }
    : { userOneId: userIdB, userTwoId: userIdA }
}

export async function createFriendRequest(
  senderId: string,
  receiverId: string,
) {
  if (senderId === receiverId) {
    throw new FriendRequestValidationError(
      'You cannot send a friend request to yourself.',
    )
  }

  // 1. Check wheather the receiver is present in the database
  const receiver = await prisma.user.findUnique({
    where: {
      id: receiverId,
    },
    select: {
      id: true,
    },
  })
  if (!receiver) return null

  // 2. Check is both users are already friends
  const { userOneId, userTwoId } = toCanonicalOrder(senderId, receiverId)
  const existingFriendship = await prisma.friendship.findUnique({
    where: {
      userOneId_userTwoId: { userOneId, userTwoId },
    },
  })
  if (existingFriendship) {
    throw new FriendRequestValidationError()
  }

  // 3. Check for an existing reverse pending request (User B already invited User A)
  const reversePendingRequest = await prisma.friendRequest.findUnique({
    where: {
      senderId_recipientId: {
        senderId: receiverId,
        recipientId: senderId,
      },
    },
  })

  if (reversePendingRequest && reversePendingRequest.status === 'PENDING') {
    throw new FriendRequestValidationError(
      'This user has already sent you a friend request. Accept their request instead.',
    )
  }
  // 4. Create a record in FriendRequest table
  try {
    return await prisma.friendRequest.create({
      data: {
        senderId: senderId,
        recipientId: receiverId,
        status: 'PENDING',
      },
      select: {
        id: true,
        senderId: true,
        recipientId: true,
        status: true,
        createdAt: true,
      },
    })
  } catch (error) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new FriendRequestValidationError()
    }
    throw error
  }
}
