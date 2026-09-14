import express from 'express'
import cors from 'cors'
import userRouter from './routes/user.route.js'

const app = express()

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(userRouter)

app.get('/health', (_request, response) => {
  response.json('Hello from Server!')
})

export default app
