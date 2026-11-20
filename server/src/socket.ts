import type { Server as HttpServer } from 'node:http'
import { Server } from 'socket.io'
import { verifyAccessToken } from './lib/jwt.js'
import { chatServices } from './services/index.js'

interface SocketActionResult {
  ok: boolean
  error?: string
}

interface RealtimeMessage {
  id: string
  content: string
  createdAt: string
  createdById: string
  createdBy: {
    id: string
    name: string
  }
}

interface ClientToServerEvents {
  'conversation:join': (
    conversationId: string,
    acknowledge: (result: SocketActionResult) => void,
  ) => void
  'message:send': (
    payload: { conversationId: string; content: string },
    acknowledge: (result: SocketActionResult) => void,
  ) => void
}

interface ServerToClientEvents {
  'message:new': (message: RealtimeMessage) => void
}

type InterServerEvents = Record<string, (...args: never[]) => void>

interface SocketData {
  userId: string
}

export function attachSocketServer(httpServer: HttpServer): Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
> {
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
    },
  })

  io.use((socket, next) => {
    const token: unknown = socket.handshake.auth?.token

    if (typeof token !== 'string' || !token) {
      next(new Error('Authentication required'))
      return
    }

    try {
      const payload = verifyAccessToken(token)
      socket.data.userId = payload.userId
      next()
    } catch {
      next(new Error('Invalid authentication token'))
    }
  })

  io.on('connection', (socket) => {
    socket.on('conversation:join', async (conversationId, acknowledge) => {
      if (typeof acknowledge !== 'function') return
      if (typeof conversationId !== 'string' || !conversationId) {
        acknowledge({ ok: false, error: 'conversationId is required' })
        return
      }

      try {
        const isParticipant = await chatServices.isConversationParticipant(
          conversationId,
          socket.data.userId,
        )
        if (!isParticipant) {
          acknowledge({ ok: false, error: 'Conversation not found' })
          return
        }

        await socket.join(`conversation:${conversationId}`)
        acknowledge({ ok: true })
      } catch (error) {
        console.error('Error joining conversation socket room:', error)
        acknowledge({ ok: false, error: 'Unable to join conversation' })
      }
    })

    socket.on('message:send', async (payload, acknowledge) => {
      if (typeof acknowledge !== 'function') return
      const rawContent: unknown = payload?.content
      const rawConversationId: unknown = payload?.conversationId
      const content =
        typeof rawContent === 'string' ? rawContent.trim() : ''
      const conversationId =
        typeof rawConversationId === 'string' ? rawConversationId : ''
      if (
        !conversationId ||
        !content ||
        content.length > 4000
      ) {
        acknowledge({
          ok: false,
          error: 'A conversation and a message of 1-4000 characters are required',
        })
        return
      }

      try {
        const message = await chatServices.sendMessage(
          conversationId,
          socket.data.userId,
          content,
        )
        if (!message) {
          acknowledge({ ok: false, error: 'Conversation not found' })
          return
        }

        const room = `conversation:${conversationId}`
        const participantIds = new Set(
          await chatServices.getConversationParticipantIds(conversationId),
        )
        const realtimeMessage = {
          id: message.id,
          content: message.content,
          createdAt: message.createdAt.toISOString(),
          createdById: message.createdById,
          createdBy: message.createdBy,
        }
        const roomSockets = await io.in(room).fetchSockets()
        for (const roomSocket of roomSockets) {
          if (!participantIds.has(roomSocket.data.userId)) {
            await roomSocket.leave(room)
            continue
          }
          roomSocket.emit('message:new', realtimeMessage)
        }
        acknowledge({ ok: true })
      } catch (error) {
        console.error('Error sending realtime message:', error)
        acknowledge({ ok: false, error: 'Unable to send message' })
      }
    })
  })

  return io
}
