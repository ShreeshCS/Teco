import express from 'express'
import cors from 'cors'
import userRouter from './routes/user.route.js'
import authRouter from './routes/auth.route.js'

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors({ origin: 'http://localhost:5173' }))
app.use('/api', userRouter)
app.use('/api', authRouter)

app.get('/health', (_request, response) => {
  response.json('Hello from Server!')
})

export default app
