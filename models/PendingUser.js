const mongoose = require('mongoose');

const PendingUserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  otp:      { type: String, required: true },
  
  // 🕒 Auto-delete this document after 600 seconds (10 minutes)
  createdAt: { type: Date, default: Date.now, expires: 600 } 
});

module.exports = mongoose.model('PendingUser', PendingUserSchema);