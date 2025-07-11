const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Message = require('../models/message');
const Ticket = require('../models/Ticket');

// ✅ Allowed image types
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];

// ✅ Utility to convert image to base64
const getBase64Image = (file) => {
  const filePath = path.join(__dirname, '..', 'uploads', file.filename);
  const fileData = fs.readFileSync(filePath);
  return `data:${file.mimetype};base64,${fileData.toString('base64')}`;
};

// ✅ Save general chat message
exports.saveMessage = async (req, res) => {
  try {
    const { content, chatType, replyTo } = req.body;

    if (!chatType || (!content && !req.file)) {
      return res.status(400).json({
        error: 'chatType and either message content or image are required.',
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

    if (req.file) {
      if (!ALLOWED_IMAGE_TYPES.includes(req.file.mimetype)) {
        return res.status(400).json({ error: 'Only image files are allowed.' });
      }

      messageData.attachment = {
        name: req.file.originalname,
        base64: getBase64Image(req.file),
      };
    }

    const saved = await new Message(messageData).save();
    const populated = await Message.findById(saved._id)
      .populate('replyTo')
      .populate('sender', '_id name role');

    res.status(201).json(populated);
  } catch (err) {
    console.error('❌ Error saving message:', err.message);
    res.status(500).json({ error: 'Failed to save message.' });
  }
};

// ✅ Get messages (general or ticket)
exports.getMessages = async (req, res) => {
  try {
    const { chatType } = req.params;
    const filter = { chatType };

    if (req.user.role === 'user') {
      filter.$or = [
        { sender: req.user._id },
        { role: 'admin' },
      ];
    }

    const messages = await Message.find(filter)
      .populate('replyTo')
      .populate('sender', '_id name role')
      .sort({ timestamp: 1 });

    res.json(messages);
  } catch (err) {
    console.error('❌ Error fetching messages:', err.message);
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
};

// ✅ Mark messages as read
exports.markMessagesAsRead = async (req, res) => {
  try {
    const { chatType } = req.body;
    const userId = req.user._id;

    if (!chatType) {
      return res.status(400).json({ error: 'chatType is required.' });
    }

    const now = new Date();

    const unread = await Message.find({
      chatType,
      'readBy.user': { $ne: userId },
    });

    await Message.updateMany(
      { chatType, 'readBy.user': { $ne: userId } },
      { $addToSet: { readBy: { user: userId, at: now } } }
    );

    const io = req.app.get('io');
    unread.forEach((msg) => {
      io.to(chatType).emit('message-read', {
        messageId: msg._id,
        reader: { user: userId, at: now },
      });
    });

    res.sendStatus(200);
  } catch (err) {
    console.error('❌ Error marking as read:', err.message);
    res.status(500).json({ error: 'Failed to mark messages as read.' });
  }
};

// ✅ Get messages by ticket ID
exports.getMessagesByTicketId = async (req, res) => {
  try {
    const { ticketId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({ error: 'Invalid ticket ID.' });
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
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    res.json(ticket.messages);
  } catch (err) {
    console.error('❌ Error getting ticket messages:', err.message);
    res.status(500).json({ error: 'Failed to get ticket messages.' });
  }
};

// ✅ Send message to ticket
exports.sendTicketMessage = async (req, res) => {
  try {
    const { content, replyTo } = req.body;
    const { ticketId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({ error: 'Invalid ticket ID.' });
    }

    if (!content && !req.file) {
      return res.status(400).json({ error: 'Message content or image is required.' });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
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
      if (!ALLOWED_IMAGE_TYPES.includes(req.file.mimetype)) {
        return res.status(400).json({ error: 'Only image files are allowed.' });
      }

      messageData.attachment = {
        name: req.file.originalname,
        base64: getBase64Image(req.file),
      };
    }

    const newMsg = await new Message(messageData).save();
    ticket.messages.push(newMsg._id);
    await ticket.save();

    const populated = await Message.findById(newMsg._id)
      .populate('sender', '_id name role')
      .populate('replyTo');

    const io = req.app.get('io');
    io.to(ticketId).emit('receive-message', populated);

    res.status(201).json(populated);
  } catch (err) {
    console.error('❌ Error sending ticket message:', err.message);
    res.status(500).json({ error: 'Failed to send message to ticket.' });
  }
};
// ✅ Mark a message as delivered
exports.markMessageAsDelivered = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ error: 'Message not found.' });

    const alreadyDelivered = message.deliveredTo.some((entry) =>
      entry.user.equals(userId)
    );

    if (!alreadyDelivered) {
      message.deliveredTo.push({ user: userId, at: new Date() });
      await message.save();
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('❌ Error marking message as delivered:', err.message);
    res.status(500).json({ error: 'Failed to mark message as delivered.' });
  }
};

// ✅ Mark a message as read
exports.markMessageAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ error: 'Message not found.' });

    const alreadyRead = message.readBy.some((entry) =>
      entry.user.equals(userId)
    );

    if (!alreadyRead) {
      message.readBy.push({ user: userId, at: new Date() });
      await message.save();
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('❌ Error marking message as read:', err.message);
    res.status(500).json({ error: 'Failed to mark message as read.' });
  }
};
