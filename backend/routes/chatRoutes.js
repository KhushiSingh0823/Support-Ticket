const express = require('express');
const router = express.Router();
const {
  saveMessage,
  getMessages,
  getMessagesByTicketId,
  markMessagesAsRead,
  sendTicketMessage, // ✅ ADD THIS
} = require('../controllers/chatController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware'); // ✅ For file uploads

// ✅ Save a new message (general or ticket)
router.post('/send', protect, saveMessage);

// ✅ Get general or ticket-related messages by chatType
router.get('/:chatType', protect, getMessages);

// ✅ Mark messages as read
router.post('/mark-read', protect, markMessagesAsRead);

// ✅ Get messages by specific ticketId
router.get('/ticket/:ticketId', protect, getMessagesByTicketId);

// ✅ NEW: Send message to a specific ticket
router.post('/ticket/:ticketId/send', protect, upload.single('file'), sendTicketMessage);

module.exports = router;
