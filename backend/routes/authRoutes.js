const express = require('express');
const router = express.Router();
const { signup, login, getAllAdmins } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

// ✅ USER Auth Routes
router.post('/user/signup', signup);
router.post('/user/login', login);

// ✅ ADMIN Auth Routes
router.post('/admin/signup', signup);
router.post('/admin/login', login);

// ✅ Corrected: match frontend route '/admin/all-admins'
router.get('/admin/all-admins', protect, getAllAdmins);

module.exports = router;
