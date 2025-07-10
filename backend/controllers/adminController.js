const User = require('../models/User');

// GET /api/admin/all-admins
const getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('-password'); // Exclude password
    res.status(200).json(admins);
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ message: 'Failed to fetch admins' });
  }
};

module.exports = {
  getAllAdmins,
};
