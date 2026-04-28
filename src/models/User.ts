import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'owner', 'manager', 'operator', 'viewer', 'user'],
    default: 'operator'
  }
}, {
  timestamps: true
})

const User = mongoose.models.User || mongoose.model('User', userSchema)

export default User
