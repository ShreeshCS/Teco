import 'dotenv/config';
import { createServer } from 'node:http'
import app from './app.js'
import { attachSocketServer } from './socket.js'

const port = Number(process.env.PORT) || 3000
const httpServer = createServer(app)

attachSocketServer(httpServer)

httpServer.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`)
})
