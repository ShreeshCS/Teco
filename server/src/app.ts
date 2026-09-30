import express from 'express'
import cors from 'cors'
import userRouter from './routes/user.route.js'
import authRouter from './routes/auth.route.js'
import { authenticateToken } from './middleware/domain/auth/auth.middleware.js'
import routes from './constants/urls.js'

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors({ origin: 'http://localhost:5173' }))

app.use(`${routes.api.auth}`, authRouter)
app.use(`${routes.api.user}`, authenticateToken, userRouter)
app.get('/health', (_request, response) => {
  response.json('Hello from Server!')
})

export default app
