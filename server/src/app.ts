import express from 'express'
import cors from 'cors'
import userRouter from './routes/user.route.js'
import authRouter from './routes/auth.route.js'
import chatRouter from './routes/chat.route.js'
import friendRouter from './routes/friend.route.js'
import { authenticateToken } from './middleware/domain/auth/auth.middleware.js'
import routes from './constants/urls.js'

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors({ origin: 'http://localhost:5173' }))

app.use(routes.api.auth.toString(), authRouter)
app.use(routes.api.user.toString(), authenticateToken, userRouter)
app.use(routes.api.conversations.toString(), authenticateToken, chatRouter)
app.use(routes.api.friendRequest.toString(), authenticateToken, friendRouter)
app.get('/health', (_request, response) => {
  response.json('Hello from Server!')
})

export default app
