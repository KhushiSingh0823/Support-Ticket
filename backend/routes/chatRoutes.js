const express = require('express');
const router = express.Router();
const {
  saveMessage,
  getMessages,
  getMessagesByTicketId,
  markMessagesAsRead,
  sendTicketMessage,
  markMessageAsDelivered, // ✅ ADDED
  markMessageAsRead,      // ✅ ADDED
} = require('../controllers/chatController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// ✅ Save a new message (general or ticket)
router.post('/send', protect, saveMessage);

// ✅ Get general or ticket-related messages by chatType
router.get('/:chatType', protect, getMessages);

// ✅ Mark messages as read
router.post('/mark-read', protect, markMessagesAsRead);

// ✅ Get messages by specific ticketId
router.get('/ticket/:ticketId', protect, getMessagesByTicketId);

// ✅ Send message to a specific ticket
router.post('/ticket/:ticketId/send', protect, upload.single('file'), sendTicketMessage);

// ✅ NEW: Mark a single message as delivered
router.post('/:id/delivered', protect, markMessageAsDelivered);

// ✅ NEW: Mark a single message as read
router.post('/:id/read', protect, markMessageAsRead);

module.exports = router;
