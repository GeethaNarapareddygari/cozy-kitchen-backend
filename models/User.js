const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  otp:      { type: String },
  isVerified: { type: Boolean, default: false },

  // 👇 CHANGED: Simple Array (Accepts anything)
  favorites: { type: Array, default: [] } 
});

module.exports = mongoose.model('User', UserSchema);