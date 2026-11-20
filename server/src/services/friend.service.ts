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

export async function getFriends(userId: string) {
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { userOneId: userId, userTwoId: { not: userId } },
        { userTwoId: userId, userOneId: { not: userId } },
      ],
    },
    
    select: {
      userOneId: true,
      userTwoId: true,
      userOne: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      },
      userTwo: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      },
    },
  })

  return friendships.map(({ userOne, userTwo }) =>
    userOne.id === userId ? userTwo : userOne,
  )
}

export async function getPendingFriendRequests(userId: string) {
  return prisma.friendRequest.findMany({
    where: {
      recipientId: userId,
      status: 'PENDING',
    },
    select: {
      id: true,
      senderId: true,
      recipientId: true,
      status: true,
      createdAt: true,
      sender: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

export async function createFriendRequest(
  senderId: string,
  receiverId: string,
) {
  if (!receiverId || typeof receiverId !== 'string' || !receiverId.trim()) {
    throw new FriendRequestValidationError('Recipient ID or email is required.')
  }

  const trimmedReceiver = receiverId.trim()

  if (senderId === trimmedReceiver) {
    throw new FriendRequestValidationError(
      'You cannot send a friend request to yourself.',
    )
  }

  const isEmail = trimmedReceiver.includes('@')

  // 1. Check whether the receiver is present in the database (support lookup by email or id)
  const receiver = isEmail
    ? await prisma.user.findUnique({
        where: {
          email: trimmedReceiver,
        },
        select: {
          id: true,
        },
      })
    : await prisma.user.findUnique({
        where: {
          id: trimmedReceiver,
        },
        select: {
          id: true,
        },
      })

  if (!receiver) return null

  const targetId = receiver.id

  if (senderId === targetId) {
    throw new FriendRequestValidationError(
      'You cannot send a friend request to yourself.',
    )
  }

  // 2. Check if both users are already friends
  const { userOneId, userTwoId } = toCanonicalOrder(senderId, targetId)
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
        senderId: targetId,
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
        recipientId: targetId,
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

export async function declineFriendRequest(
  requestId: string,
  userId: string,
): Promise<boolean> {
  const result = await prisma.friendRequest.deleteMany({
    where: {
      id: requestId,
      recipientId: userId,
      status: 'PENDING',
    },
  })

  return result.count > 0
}

export async function acceptFriendRequest(
  requestId: string,
  userId: string,
) {
  const pendingRequest = await prisma.friendRequest.findUnique({
    where: {
      id: requestId,
    },
  })

  if (!pendingRequest || pendingRequest.status !== 'PENDING') {
    throw new FriendRequestValidationError(
      'Friend request not found or is no longer pending.',
    )
  }

  // Ensure only the intended recipient can accept the request
  if (pendingRequest.recipientId !== userId) {
    throw new FriendRequestValidationError(
      'You are not authorized to accept this friend request.',
    )
  }

  const { userOneId, userTwoId } = toCanonicalOrder(
    pendingRequest.senderId,
    pendingRequest.recipientId,
  )

  return await prisma.$transaction(async (tx) => {
    await tx.friendRequest.update({
      where: {
        id: pendingRequest.id,
      },
      data: {
        status: 'ACCEPTED',
        respondedAt: new Date(),
      },
    })

    return await tx.friendship.upsert({
      where: {
        userOneId_userTwoId: {
          userOneId,
          userTwoId,
        },
      },
      update: {}, // No fields need updating if already friends
      create: {
        userOneId,
        userTwoId,
      },
    })
  })
}
