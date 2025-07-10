const express = require('express');
const router = express.Router();

const {
  createTicket,
  getUserTickets,
  deleteTicket,
  getAllTickets,
  getTicketsForAdmin,
  getTicketStats,
  assignTicketToAdmin,
  addReply,
} = require('../controllers/ticketController');

const {
  getAllAdmins,
} = require('../controllers/adminController');

const { protect } = require('../middlewares/authMiddleware');

// ======================= USER ROUTES =======================
router.post('/', protect, createTicket);
router.get('/user', protect, getUserTickets);
router.delete('/:id', protect, deleteTicket);
router.post('/:id/reply', protect, addReply);

// ======================= ADMIN ROUTES =======================
router.get('/admin/my-tickets', protect, getTicketsForAdmin);
router.get('/admin/ticket-stats', protect, getTicketStats);
router.patch('/admin/assign/:id', protect, assignTicketToAdmin);
router.get('/admin/all-tickets', protect, getAllTickets);
router.get('/admin/all-admins', protect, getAllAdmins); // 🔥 FIXED: this was /admin/list

module.exports = router;
