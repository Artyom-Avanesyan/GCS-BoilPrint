const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  storageFolder: {
    type: String,
    sparse: true,
    unique: true
  },
  iamPolicyApplied: {
    type: Boolean,
    default: false
  },
  folderCreated: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});


module.exports = mongoose.model('User', userSchema);