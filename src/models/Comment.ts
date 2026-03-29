import mongoose, { Schema, Document } from 'mongoose'

interface CommentTag {
  type: 'file' | 'map'
  name: string
  displayName: string
}

export interface IComment extends Document {
  text: string
  author: string
  authorId: string
  projectId: string
  pinnedFile?: string
  parentId?: string
  isPrivate: boolean
  isEdited: boolean
  tags: CommentTag[]
  mentions: string[]
  likes: string[]
  createdAt: Date
  updatedAt: Date
}

const CommentTagSchema = new Schema({
  type: {
    type: String,
    enum: ['file', 'map'],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    required: true
  }
})

const CommentSchema = new Schema<IComment>({
  text: {
    type: String,
    required: [true, 'Comment text is required'],
    trim: true,
    maxlength: [2000, 'Comment cannot exceed 2000 characters']
  },
  author: {
    type: String,
    required: [true, 'Author is required'],
    trim: true
  },
  authorId: {
    type: String,
    required: [true, 'Author ID is required']
  },
  projectId: {
    type: String,
    required: [true, 'Project ID is required']
  },
  pinnedFile: {
    type: String,
    trim: true
  },
  parentId: {
    type: String,
    default: null
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  tags: [CommentTagSchema],
  mentions: [{
    type: String,
    trim: true
  }],
  likes: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
})

// Create indexes for better performance
CommentSchema.index({ projectId: 1, createdAt: -1 })
CommentSchema.index({ parentId: 1 })
CommentSchema.index({ authorId: 1 })

export default mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema)