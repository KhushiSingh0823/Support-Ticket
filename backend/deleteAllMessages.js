const mongoose = require('mongoose');
require('dotenv').config();
const Message = require('./models/message'); // adjust path if needed

const MONGO_URI = process.env.MONGO_URI;

async function deleteAllMessages() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const result = await Message.deleteMany({});
    console.log(`🗑️ Deleted ${result.deletedCount} messages`);

    await mongoose.disconnect();
    console.log('🔌 Disconnected');
  } catch (err) {
    console.error('❌ Error deleting messages:', err.message);
  }
}

deleteAllMessages();
