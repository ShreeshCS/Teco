import type { Request, Response } from 'express'
import { getAuthenticatedUserId } from '@/lib/auth.js'
import * as groupService from '@/services/group.service.js'

const handleError = (res: Response, error: unknown, action: string) => {
  if (error instanceof groupService.GroupServiceError) {
    res.status(error.statusCode).json({ message: error.message })
    return
  }
  console.error(`Error ${action}:`, error)
  res.status(500).json({ message: 'Internal server error' })
}

export const getGroups = async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req, res)
  if (!userId) return
  try {
    res.status(200).json(await groupService.getGroups(userId))
  } catch (error) {
    handleError(res, error, 'fetching groups')
  }
}

export const createGroup = async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req, res)
  if (!userId) return
  const { name, description, icon, memberIds } = req.body ?? {}
  if (
    typeof name !== 'string' || !name.trim() || name.trim().length > 60 ||
    typeof description !== 'string' || description.trim().length > 500 ||
    typeof icon !== 'string' || !icon.trim() || icon.trim().length > 16 ||
    !Array.isArray(memberIds) ||
    memberIds.some((id: unknown) => typeof id !== 'string')
  ) {
    res.status(400).json({ message: 'A group name, description, icon, and member list are required' })
    return
  }
  try {
    const id = await groupService.createGroup(userId, {
      name: name.trim(),
      description: description.trim(),
      icon: icon.trim(),
      memberIds,
    })
    res.status(201).json({ id })
  } catch (error) {
    handleError(res, error, 'creating group')
  }
}

export const updateGroup = async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req, res)
  if (!userId) return
  const { groupId } = req.params
  if (typeof groupId !== 'string' || !groupId) {
    res.status(400).json({ message: 'groupId is required' })
    return
  }
  const { name, description, icon, memberIds, adminIds } = req.body ?? {}
  if (
    (name !== undefined && (typeof name !== 'string' || !name.trim() || name.trim().length > 60)) ||
    (description !== undefined && (typeof description !== 'string' || description.trim().length > 500)) ||
    (icon !== undefined && (typeof icon !== 'string' || !icon.trim() || icon.trim().length > 16)) ||
    (memberIds !== undefined && (!Array.isArray(memberIds) || memberIds.some((id: unknown) => typeof id !== 'string'))) ||
    (adminIds !== undefined && (!Array.isArray(adminIds) || adminIds.some((id: unknown) => typeof id !== 'string')))
  ) {
    res.status(400).json({ message: 'Invalid group update' })
    return
  }
  try {
    await groupService.updateGroup(groupId, userId, {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(description !== undefined ? { description: description.trim() } : {}),
      ...(icon !== undefined ? { icon: icon.trim() } : {}),
      ...(memberIds !== undefined ? { memberIds } : {}),
      ...(adminIds !== undefined ? { adminIds } : {}),
    })
    res.status(204).end()
  } catch (error) {
    handleError(res, error, 'updating group')
  }
}

export const deleteGroup = async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req, res)
  if (!userId) return
  const { groupId } = req.params
  if (typeof groupId !== 'string' || !groupId) {
    res.status(400).json({ message: 'groupId is required' })
    return
  }
  try {
    await groupService.deleteGroup(groupId, userId)
    res.status(204).end()
  } catch (error) {
    handleError(res, error, 'deleting group')
  }
}
