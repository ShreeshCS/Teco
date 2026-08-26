import express from 'express'
import cors from 'cors'
const app = express()

app.use(cors({ origin: 'http://localhost:5173' }))

app.get('/health', (_request, response) => {
  response.json('Hello from Server!')
})

export default app
