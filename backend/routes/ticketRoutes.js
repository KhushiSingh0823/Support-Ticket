const express = require('express');
const router = express.Router();
const {
  createTicket,
  getUserTickets,
  getAllTickets,
  deleteTicket,
  getTicketsForAdmin,
  getTicketStats,
  assignTicketToAdmin,
  addReply,
  editMessage,
  deleteMessage,
  updateTicketStatus,
  getTicketMessages,
  getAllAdmins,
} = require('../controllers/ticketController');

const { protect, adminOnly } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware'); // ✅ Add this line

// ✅ User: Create new ticket
router.post('/', protect, createTicket);

// ✅ User: Get own tickets
router.get('/my-tickets', protect, getUserTickets);

// ✅ Admin: Get all tickets
router.get('/admin/all-tickets', protect, adminOnly, getAllTickets);

// ✅ Admin: Get tickets assigned to current admin
router.get('/admin/assigned-tickets', protect, adminOnly, getTicketsForAdmin);

// ✅ Admin: Get all admins (for dropdowns etc.)
router.get('/admin/all-admins', protect, adminOnly, getAllAdmins);

// ✅ Admin: Get stats
router.get('/admin/ticket-stats', protect, adminOnly, getTicketStats);

// ✅ Admin: Assign a ticket
router.post('/:id/assign', protect, adminOnly, assignTicketToAdmin);

// ✅ Ticket status update
router.put('/:id/status', protect, updateTicketStatus);

// ✅ Ticket deletion
router.delete('/:id', protect, deleteTicket);

// ✅ Reply to a ticket (with file upload)
router.post('/:id/reply', protect, upload.single('file'), addReply); // ✅ FIXED

// ✅ Edit ticket message
router.put('/:ticketId/messages/:messageId/edit', protect, editMessage);

// ✅ Delete ticket message
router.delete('/:ticketId/messages/:messageId', protect, deleteMessage);

// ✅ Get ticket messages
router.get('/:id/messages', protect, getTicketMessages);

module.exports = router;
