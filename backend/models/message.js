const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    // 👤 Who sent the message
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // 🧑‍💼 Role of sender (user/admin)
    role: {
      type: String,
      enum: ['admin', 'user'],
      required: true,
      lowercase: true,
    },

    // 📝 Main message content
    content: {
      type: String,
      default: '',
    },

    // 🧵 Chat type context (either for a ticket or general chat)
    chatType: {
      type: String,
      enum: ['ticket', 'general'],
      required: true,
    },

    // 🔁 Optional reply-to threading
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },

    // 📎 Optional file attachment from Cloudinary
    attachment: {
      name: { type: String, default: '' },
      url: { type: String, default: '' }, // ✅ Corrected from `base64` to `url`
    },

    // ✅ Read receipts
    readBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        at: { type: Date, default: Date.now },
      },
    ],

    // 📬 Delivery receipts
    deliveredTo: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true, // includes createdAt, updatedAt
  }
);

module.exports = mongoose.model('Message', messageSchema);
