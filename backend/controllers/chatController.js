const mongoose = require('mongoose');
const Message = require('../models/message');
const Ticket = require('../models/Ticket');

// ✅ Save a new general chat message
exports.saveMessage = async (req, res) => {
  try {
    const { content, chatType, replyTo, attachment } = req.body;

    if (!chatType || (!content && !attachment)) {
      return res.status(400).json({
        error: 'chatType and either message content or attachment are required.',
      });
    }

    const messageData = {
      sender: req.user._id,
      role: req.user.role || 'user',
      content: content || '',
      chatType,
      timestamp: new Date(),
    };

    if (replyTo && mongoose.Types.ObjectId.isValid(replyTo)) {
      messageData.replyTo = replyTo;
    }

    if (attachment?.name && attachment?.url) {
      messageData.attachment = {
        name: attachment.name,
        url: attachment.url,
      };
    }

    const saved = await new Message(messageData).save();
    const populatedMessage = await Message.findById(saved._id)
      .populate('replyTo')
      .populate('sender', '_id name role');

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('❌ Error saving message:', error.message);
    res.status(500).json({ error: 'Failed to save message' });
  }
};

// ✅ Get general or ticket chat messages
exports.getMessages = async (req, res) => {
  try {
    const { chatType } = req.params;
    const filter = { chatType };

    if (req.user.role === 'user') {
      filter.$or = [
        { sender: req.user._id },
        { role: { $in: ['admin', 'Admin'] } },
      ];
    }

    const messages = await Message.find(filter)
      .populate('replyTo')
      .populate('sender', '_id name role')
      .sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    console.error('❌ Error fetching messages:', error.message);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// ✅ Mark messages as read
exports.markMessagesAsRead = async (req, res) => {
  try {
    const { chatType } = req.body;
    const userId = req.user._id;

    if (!chatType || !userId) {
      return res.status(400).json({ error: 'chatType and user must be provided' });
    }

    const now = new Date();

    const unreadMessages = await Message.find({
      chatType,
      'readBy.user': { $ne: userId },
    });

    await Message.updateMany(
      {
        chatType,
        'readBy.user': { $ne: userId },
      },
      {
        $addToSet: {
          readBy: {
            user: userId,
            at: now,
          },
        },
      }
    );

    const io = req.app.get('io');
    unreadMessages.forEach((msg) => {
      io.to(chatType).emit('message-read', {
        messageId: msg._id,
        reader: { user: userId, at: now },
      });
    });

    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Error marking messages as read:', error.message);
    res.status(500).json({ error: 'Failed to mark messages as read.' });
  }
};

// ✅ Get all messages for a specific ticket
exports.getMessagesByTicketId = async (req, res) => {
  try {
    const { ticketId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({ message: 'Invalid ticket ID' });
    }

    const ticket = await Ticket.findById(ticketId).populate({
      path: 'messages',
      populate: [
        { path: 'sender', select: '_id name role' },
        { path: 'replyTo' },
      ],
      options: { sort: { timestamp: 1 } },
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.status(200).json(ticket.messages);
  } catch (error) {
    console.error('❌ Error fetching ticket messages:', error.message);
    res.status(500).json({ error: 'Failed to get ticket messages' });
  }
};

// ✅ Send message to a specific ticket
exports.sendTicketMessage = async (req, res) => {
  try {
    const { content, replyTo } = req.body;
    const { ticketId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({ message: 'Invalid ticket ID' });
    }

    if (!content && !req.file) {
      return res.status(400).json({ message: 'Message content or file is required.' });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const messageData = {
      sender: req.user._id,
      role: req.user.role || 'user',
      chatType: 'ticket',
      content: content || '',
      ticket: ticket._id,
      timestamp: new Date(),
    };

    if (replyTo && mongoose.Types.ObjectId.isValid(replyTo)) {
      messageData.replyTo = replyTo;
    }

    if (req.file) {
      messageData.attachment = {
        name: req.file.originalname,
        url: `/uploads/${req.file.filename}`,
      };
    }

    const newMessage = await new Message(messageData).save();
    ticket.messages.push(newMessage._id);
    await ticket.save();

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', '_id name role')
      .populate('replyTo');

    const io = req.app.get('io');
    io.to(ticketId).emit('receive-message', populatedMessage);

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('❌ Error sending ticket message:', error.message);
    res.status(500).json({ error: 'Failed to send message to ticket' });
  }
};
