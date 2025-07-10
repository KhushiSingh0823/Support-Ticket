const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const Ticket = require('./models/Ticket'); // ✅ import ticket model
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize app and server
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Global middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tickets', require('./routes/ticketRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));

// Socket.IO real-time chat setup
io.on('connection', (socket) => {
  console.log(`🟢 Socket connected: ${socket.id}`);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`📥 Socket ${socket.id} joined room: ${roomId}`);
  });

  socket.on('typing', ({ room, senderId }) => {
    socket.to(room).emit('typing', senderId);
  });

  socket.on('stop-typing', ({ room }) => {
    socket.to(room).emit('stop-typing');
  });

  // ✅ Fixed: Save message to DB if it's ticket-specific
  socket.on('send-message', async (msg) => {
    const roomId =
      msg.chatType === 'ticket' && msg.ticketId
        ? `ticket-${msg.ticketId}`
        : 'general';

    // Broadcast to room
    io.to(roomId).emit('receive-message', msg);

    // Save to ticket if ticketId is provided
    if (msg.chatType === 'ticket' && msg.ticketId) {
      try {
        if (!mongoose.Types.ObjectId.isValid(msg.ticketId)) return;

        const ticket = await Ticket.findById(msg.ticketId);
        if (!ticket) return;

        const messageObj = {
          message: msg.content,
          senderName: msg.senderName || 'Unknown',
          senderRole: msg.role?.toLowerCase() || 'user',
          timestamp: new Date(),
          edited: false,
          deleted: false,
        };

        if (msg.replyTo?._id) {
          messageObj.replyTo = {
            messageId: msg.replyTo._id,
            messageText: msg.replyTo.content,
            senderName: msg.replyTo.senderName || 'Unknown',
          };
        }

        if (msg.attachment?.url) {
          messageObj.fileUrl = msg.attachment.url;
          messageObj.fileType = msg.attachment.type || '';
        }

        ticket.messages.push(messageObj);
        await ticket.save();
      } catch (err) {
        console.error('❌ Error saving socket message to ticket:', err.message);
      }
    }
  });

  socket.on('message-read', ({ chatType, messageId, reader }) => {
    io.to(chatType).emit('message-read', { messageId, reader });
  });

  socket.on('disconnect', () => {
    console.log(`🔴 Socket disconnected: ${socket.id}`);
  });
});

// Attach io instance to app
app.set('io', io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
