export type ConversationResult = {
  id: string
  conversationParticipants: Array<{
    user: {
      id: string
      name: string
    }
  }>
  messages: Array<{
    id: string
    content: string
    createdAt: Date
  }>
}[]
