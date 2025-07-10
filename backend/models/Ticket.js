const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    // 👤 User Info
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'User email is required'],
      lowercase: true,
      trim: true,
    },

    // 🛠 Issue Info
    issue: {
      type: String,
      required: [true, 'Issue description is required'],
      minlength: 5,
    },
    screenshot: {
      type: String, // Stores uploaded image path (if any)
      default: '',
    },

    // 🔄 Status
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved'],
      default: 'Open',
    },

    // 🔗 Associations
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // 💬 Chat messages linked to this ticket
    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
      },
    ],
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

module.exports = mongoose.model('Ticket', ticketSchema);
