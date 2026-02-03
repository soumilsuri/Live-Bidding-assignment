import dotenv from 'dotenv';
import { app } from './app.js';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './db/index.js';
import initializeSocketHandlers from './websockets/socketHandler.js';

dotenv.config({
  path: './.env',
});

const server = http.createServer(app);

// Initialize Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
  },
});

// Initialize WebSocket handlers
initializeSocketHandlers(io);

connectDB()
  .then(() => {
    // Listen on the HTTP server instead of the Express app directly
    server.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at port: ${process.env.PORT || 8000}`);
      console.log(`http://localhost:${process.env.PORT || 8000}`);
      console.log(`WebSocket server initialized`);
    });
  })
  .catch((err) => {
    console.log('MongoDB connection failed!', err);
  });

