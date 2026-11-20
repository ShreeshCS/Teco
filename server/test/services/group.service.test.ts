import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ensureDefaultGroupsForUser,
  updateGroup,
} from '@/services/group.service.js'
import { prisma } from '@/lib/prisma.js'

vi.mock('@/lib/prisma.js', () => ({
  prisma: {
    conversation: {
      upsert: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    conversation_Participant: {
      createMany: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      updateMany: vi.fn(),
    },
    user: { count: vi.fn() },
    message: { deleteMany: vi.fn() },
    $transaction: vi.fn(),
  },
}))

describe('group.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.conversation.upsert).mockResolvedValue({ id: 'group-id' } as never)
    vi.mocked(prisma.conversation_Participant.createMany).mockResolvedValue({ count: 1 })
  })

  it('creates the four default rooms and enrolls the user in each', async () => {
    await ensureDefaultGroupsForUser('user-1')

    expect(prisma.conversation.upsert).toHaveBeenCalledTimes(4)
    expect(prisma.conversation_Participant.createMany).toHaveBeenCalledTimes(4)
    expect(prisma.conversation_Participant.createMany).toHaveBeenCalledWith({
      data: [{ conversationId: 'group-id', userId: 'user-1' }],
      skipDuplicates: true,
    })
  })

  it('denies group changes to ordinary members', async () => {
    vi.mocked(prisma.conversation.findFirst).mockResolvedValue({
      id: 'group-id',
      ownerId: 'owner-id',
      groupKey: null,
    } as never)
    vi.mocked(prisma.conversation_Participant.findUnique).mockResolvedValue({
      role: 'MEMBER',
    } as never)

    await expect(
      updateGroup('group-id', 'member-id', { description: 'Updated' }),
    ).rejects.toMatchObject({ statusCode: 403 })
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('does not allow admins to change group identity or role assignments', async () => {
    vi.mocked(prisma.conversation.findFirst).mockResolvedValue({
      id: 'group-id',
      ownerId: 'owner-id',
      groupKey: null,
    } as never)
    vi.mocked(prisma.conversation_Participant.findUnique).mockResolvedValue({
      role: 'ADMIN',
    } as never)

    await expect(
      updateGroup('group-id', 'admin-id', {
        name: 'Renamed',
        description: 'Updated',
      }),
    ).rejects.toMatchObject({ statusCode: 403 })
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })
})
