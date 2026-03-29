import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  createdBy: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isPrivate: {
    type: Boolean,
    default: false
  }
}, { _id: true })

// Add replies as an array of subdocuments of the same schema
commentSchema.add({
  replies: [commentSchema]
})

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  deadline: {
    type: Date
  },
  completed: {
    type: Boolean,
    default: false
  },
  prioritize: {
    type: Boolean,
    default: false
  },
  comments: [commentSchema],
  createdby: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['work', 'personal'],
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }]
}, {
  timestamps: true
})

// Index for efficient queries
noteSchema.index({ createdby: 1, createdAt: -1 })
noteSchema.index({ createdby: 1, type: 1 })
noteSchema.index({ createdby: 1, completed: 1 })
noteSchema.index({ createdby: 1, prioritize: 1 })
noteSchema.index({ createdby: 1, tags: 1 })

const Note = mongoose.models.Note || mongoose.model('Note', noteSchema)

export default Note