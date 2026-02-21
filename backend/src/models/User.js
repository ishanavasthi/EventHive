const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true, // store the ENCRYPTED hash, not the real password
  },
  role: {
    type: String,
    default: 'user',
  },
  profilePicture: {
    type: String, // URL from Cloudinary
    default: ''
  },
  bankDetails: {
    accountNumber: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    accountHolderName: { type: String, default: '' }
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isGoogleUser: { type: Boolean, default: false }
});

module.exports = mongoose.model('User', UserSchema);