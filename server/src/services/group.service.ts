import { Prisma, type GroupRole } from '../generated/prisma/index.js'
import { prisma } from '../lib/prisma.js'

export const DEFAULT_GROUPS = [
  {
    key: 'world-chat',
    name: '🌍 World Chat',
    description: 'Say hi to the world, make new friends, and chat across time zones.',
    icon: '🌍',
  },
  {
    key: 'tech-code',
    name: '💻 Tech & Code',
    description: 'Talk AI, gadgets, coding, and side projects with global builders.',
    icon: '💻',
  },
  {
    key: 'english-corner',
    name: '🗣️ English Corner',
    description: 'A friendly, judgment-free space to practice English and build fluency.',
    icon: '🗣️',
  },
  {
    key: 'love-vibes',
    name: '❤️ Love & Vibes',
    description: 'Mingle, share relationship stories, or spark a casual connection.',
    icon: '❤️',
  },
] as const

export class GroupServiceError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message)
    this.name = 'GroupServiceError'
  }
}

export const ensureDefaultGroupsForUser = async (
  userId: string,
  tx: Prisma.TransactionClient = prisma,
) => {
  for (const group of DEFAULT_GROUPS) {
    const conversation = await tx.conversation.upsert({
      where: { groupKey: group.key },
      create: {
        groupKey: group.key,
        isGroup: true,
        name: group.name,
        description: group.description,
        icon: group.icon,
      },
      update: {},
      select: { id: true },
    })

    await tx.conversation_Participant.createMany({
      data: [{ conversationId: conversation.id, userId }],
      skipDuplicates: true,
    })
  }
}

const groupSelect = {
  id: true,
  name: true,
  description: true,
  icon: true,
  groupKey: true,
  ownerId: true,
  updatedAt: true,
  conversationParticipants: {
    select: {
      userId: true,
      role: true,
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { user: { name: 'asc' as const } },
  },
  messages: {
    take: 1,
    orderBy: { createdAt: 'desc' as const },
    select: { content: true, createdAt: true },
  },
}

export const getGroups = async (userId: string) => {
  await ensureDefaultGroupsForUser(userId)
  return prisma.conversation.findMany({
    where: {
      isGroup: true,
      conversationParticipants: { some: { userId } },
    },
    select: groupSelect,
    orderBy: [{ groupKey: 'asc' }, { updatedAt: 'desc' }],
  })
}

const findGroup = async (groupId: string) =>
  prisma.conversation.findFirst({
    where: { id: groupId, isGroup: true },
    select: { id: true, ownerId: true, groupKey: true },
  })

const requireManagementRole = async (
  groupId: string,
  userId: string,
  allowAdmin: boolean,
) => {
  const group = await findGroup(groupId)
  if (!group) throw new GroupServiceError('Group not found', 404)

  const participant = await prisma.conversation_Participant.findUnique({
    where: { conversationId_userId: { conversationId: groupId, userId } },
    select: { role: true },
  })
  if (!participant) throw new GroupServiceError('Group not found', 404)
  if (participant.role !== 'OWNER' && !(allowAdmin && participant.role === 'ADMIN')) {
    throw new GroupServiceError('You do not have permission to manage this group', 403)
  }
  return { group, role: participant.role }
}

export const createGroup = async (
  ownerId: string,
  input: { name: string; description: string; icon: string; memberIds: string[] },
) => {
  const memberIds = [...new Set([ownerId, ...input.memberIds])]
  const existingUsers = await prisma.user.count({ where: { id: { in: memberIds } } })
  if (existingUsers !== memberIds.length) {
    throw new GroupServiceError('One or more selected users could not be found', 400)
  }

  const group = await prisma.conversation.create({
    data: {
      isGroup: true,
      name: input.name,
      description: input.description,
      icon: input.icon,
      ownerId,
      conversationParticipants: {
        create: memberIds.map((userId) => ({
          userId,
          role: userId === ownerId ? 'OWNER' : 'MEMBER',
        })),
      },
    },
    select: { id: true },
  })
  return group.id
}

export const updateGroup = async (
  groupId: string,
  userId: string,
  input: {
    name?: string
    description?: string
    icon?: string
    memberIds?: string[]
    adminIds?: string[]
  },
) => {
  const { group, role } = await requireManagementRole(groupId, userId, true)
  if (group.groupKey) {
    throw new GroupServiceError('Default groups cannot be edited', 403)
  }

  const isOwner = role === 'OWNER'
  if (!isOwner && (input.name !== undefined || input.icon !== undefined || input.adminIds !== undefined)) {
    throw new GroupServiceError('Only the owner can change the group name, icon, or admins', 403)
  }
  if (input.memberIds !== undefined && !input.memberIds.includes(group.ownerId ?? '')) {
    throw new GroupServiceError('The group owner cannot be removed', 400)
  }

  const memberIds = input.memberIds === undefined
    ? undefined
    : [...new Set(input.memberIds)]
  const adminIds = input.adminIds ?? []
  if (
    (input.adminIds !== undefined && memberIds === undefined) ||
    (memberIds !== undefined && adminIds.some((id) => !memberIds.includes(id))) ||
    adminIds.includes(group.ownerId ?? '')
  ) {
    throw new GroupServiceError('Admins must be group members and cannot be the owner', 400)
  }

  await prisma.$transaction(async (tx) => {
    if (input.memberIds !== undefined) {
      const current = await tx.conversation_Participant.findMany({
        where: { conversationId: groupId },
        select: { userId: true, role: true },
      })
      const targetIds = new Set(memberIds ?? [])
      const removeIds = current
        .filter((member) => !targetIds.has(member.userId) && member.role !== 'OWNER')
        .map((member) => member.userId)
      const currentIds = new Set(current.map((member) => member.userId))
      const addIds = (memberIds ?? []).filter((id) => !currentIds.has(id))
      const existingUsers = await tx.user.count({ where: { id: { in: addIds } } })
      if (existingUsers !== addIds.length) {
        throw new GroupServiceError('One or more selected users could not be found', 400)
      }

      if (!isOwner && current.some((member) =>
        removeIds.includes(member.userId) && member.role !== 'MEMBER',
      )) {
        throw new GroupServiceError('Admins cannot remove the owner or another admin', 403)
      }

      await tx.conversation_Participant.deleteMany({
        where: { conversationId: groupId, userId: { in: removeIds } },
      })
      await tx.conversation_Participant.createMany({
        data: addIds.map((id) => ({
          conversationId: groupId,
          userId: id,
          role: adminIds.includes(id) ? 'ADMIN' as GroupRole : 'MEMBER' as GroupRole,
        })),
        skipDuplicates: true,
      })
    }

    if (isOwner && input.adminIds !== undefined) {
      await tx.conversation_Participant.updateMany({
        where: { conversationId: groupId, userId: { in: memberIds ?? [] }, role: { not: 'OWNER' } },
        data: { role: 'MEMBER' },
      })
      await tx.conversation_Participant.updateMany({
        where: { conversationId: groupId, userId: { in: adminIds } },
        data: { role: 'ADMIN' },
      })
    }

    await tx.conversation.update({
      where: { id: groupId },
      data: {
        ...(isOwner && input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(isOwner && input.icon !== undefined ? { icon: input.icon } : {}),
      },
    })
  })
}

export const deleteGroup = async (groupId: string, userId: string) => {
  const { group } = await requireManagementRole(groupId, userId, false)
  if (group.groupKey) throw new GroupServiceError('Default groups cannot be deleted', 403)

  await prisma.$transaction(async (tx) => {
    await tx.message.deleteMany({ where: { conversationId: groupId } })
    await tx.conversation_Participant.deleteMany({ where: { conversationId: groupId } })
    await tx.conversation.delete({ where: { id: groupId } })
  })
}
