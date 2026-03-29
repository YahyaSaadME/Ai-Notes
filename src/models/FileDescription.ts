import mongoose, { Schema, Document } from 'mongoose'

export interface IFileDescription extends Document {
  projectId: string
  filename: string
  description: string
  updatedAt: Date
}

const FileDescriptionSchema = new Schema<IFileDescription>({
  projectId: {
    type: String,
    required: [true, 'Project ID is required']
  },
  filename: {
    type: String,
    required: [true, 'Filename is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

// Create compound unique index
FileDescriptionSchema.index({ projectId: 1, filename: 1 }, { unique: true })

export default mongoose.models.FileDescription || mongoose.model<IFileDescription>('FileDescription', FileDescriptionSchema)