const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Message = require('../models/message');

// ✅ CREATE TICKET
exports.createTicket = async (req, res) => {
  try {
    const { issue } = req.body;

    if (!issue) {
      return res.status(400).json({ message: 'Issue is required' });
    }

    const userFromDb = await User.findById(req.user.id);

    if (!userFromDb) {
      return res.status(404).json({ message: 'User not found' });
    }

    const screenshot = req.cloudinaryUrl || ''; // ✅ from Cloudinary middleware

    const ticket = await Ticket.create({
      name: userFromDb.name,
      email: userFromDb.email,
      user: userFromDb._id,
      issue,
      screenshot,
    });

    res.status(201).json(ticket);
  } catch (err) {
    console.error('❌ Error creating ticket:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
};

// ✅ GET USER'S TICKETS
exports.getUserTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ ADMIN: GET ALL TICKETS
exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate('assignedAdmin', 'name')
      .populate('user', 'name');
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ ADMIN: GET TICKETS ASSIGNED TO CURRENT ADMIN
exports.getTicketsForAdmin = async (req, res) => {
  try {
    const tickets = await Ticket.find({ assignedAdmin: req.user._id })
      .populate('user', 'name')
      .populate('assignedAdmin', 'name');
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ ADMIN: ASSIGN TICKET TO SELECTED ADMIN
exports.assignTicketToAdmin = async (req, res) => {
  try {
    const { adminId } = req.body;
    const ticketId = req.params.id;

    if (!adminId) return res.status(400).json({ message: 'Admin ID is required' });

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(400).json({ message: 'Invalid admin ID' });
    }

    ticket.assignedAdmin = adminId;
    await ticket.save();

    const populated = await Ticket.findById(ticketId)
      .populate('assignedAdmin', 'name')
      .populate('user', 'name');

    res.status(200).json({
      message: 'Ticket successfully assigned to admin',
      ticket: populated,
    });
  } catch (err) {
    console.error('Error assigning admin:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ✅ ADMIN: GLOBAL TICKET STATS
exports.getTicketStats = async (req, res) => {
  try {
    const tickets = await Ticket.find();
    const stats = {
      open: tickets.filter(t => t.status === 'Open').length,
      inProgress: tickets.filter(t => t.status === 'In Progress').length,
      resolved: tickets.filter(t => t.status === 'Resolved').length,
    };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ ADD REPLY TO TICKET
exports.addReply = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    let { content, replyTo, chatType } = req.body;

    // Don't allow completely empty messages
    const hasText = content?.trim();
    const hasAttachment = req.file && req.file.originalname && req.file.path;

    if (!chatType || (!hasText && !hasAttachment)) {
      return res.status(400).json({ message: 'Message content or attachment is required' });
    }

    // Only attach if real file present
    let attachment = null;
    if (hasAttachment) {
      attachment = {
        name: req.file.originalname.trim(),
        url: req.file.path.trim(),
      };
    }

    const newMessage = new Message({
      sender: req.user._id,
      role: req.user.role,
      content: hasText ? content.trim() : '',
      chatType,
      replyTo: replyTo || null,
      ...(attachment && { attachment }), // ✅ Only include if valid
      readBy: [{ user: req.user._id }],
    });

    const savedMessage = await newMessage.save();

    // Add to ticket if this is a ticket-type message
    if (chatType === 'ticket') {
      ticket.messages.push(savedMessage._id);
      await ticket.save();
    }

    // Emit via socket.io to frontend
    const io = req.app.get('io');
    if (io) {
      io.to(ticketId).emit('newMessage', {
        ticketId,
        message: {
          ...savedMessage.toObject(),
          senderName: req.user.name,
          senderRole: req.user.role,
        },
      });
    }

    res.status(201).json({
      ...savedMessage.toObject(),
      senderName: req.user.name,
      senderRole: req.user.role,
    });
  } catch (err) {
    console.error('❌ Error in addReply:', err);
    res.status(500).json({ error: err.message });
  }
};


// ✅ EDIT A MESSAGE
exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { newContent } = req.body;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    if (message.deleted) {
      return res.status(400).json({ message: 'Cannot edit a deleted message' });
    }

    message.content = newContent;
    message.edited = true;
    await message.save();

    const io = req.app.get('io');
    if (io && message.chatType === 'ticket') {
      io.to(message._id.toString()).emit('messageEdited', { message });
    }

    res.status(200).json(message);
  } catch (err) {
    console.error('❌ Error editing message:', err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ DELETE A MESSAGE
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    message.content = '[deleted]';
    message.deleted = true;
    await message.save();

    const io = req.app.get('io');
    if (io && message.chatType === 'ticket') {
      io.to(message._id.toString()).emit('messageDeleted', { messageId: message._id });
    }

    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting message:', err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ DELETE A TICKET
exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    if (ticket.email !== req.user.email) {
      return res.status(403).json({ message: 'Unauthorized to delete this ticket' });
    }

    await Ticket.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Ticket deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ UPDATE TICKET STATUS
exports.updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const ticketId = req.params.id;

    const validStatuses = ['Open', 'In Progress', 'Resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    ticket.status = status;
    await ticket.save();

    const updatedTicket = await Ticket.findById(ticketId)
      .populate('user', 'name')
      .populate('assignedAdmin', 'name');

    res.status(200).json({ message: 'Status updated', ticket: updatedTicket });
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ✅ GET ALL MESSAGES FOR A TICKET
exports.getTicketMessages = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate({
      path: 'messages',
      populate: { path: 'sender', select: 'name email role' },
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.status(200).json(ticket.messages);
  } catch (err) {
    console.error('Error fetching ticket messages:', err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ GET ALL ADMINS (FOR DROPDOWNS)
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('_id name email');
    res.status(200).json(admins);
  } catch (err) {
    console.error('Error fetching admins:', err);
    res.status(500).json({ error: 'Failed to retrieve admins' });
  }
};
